import { pool } from "../db.js";
import { predictMovieRating, calculateMovieFeatures, predictMultipleMovies, calculateMultipleMoviesFeatures } from "../services/mlModelService.js";
import { knnService } from "../services/knnService.js";

export const generateRecommendations = async (req, res) => {
    try {
        const userId = req.userId;

        // Obtener conexiones del usuario
        const connections = await pool.query(`
            SELECT 
                CASE 
                    WHEN user1_id = $1 THEN user2_id 
                    ELSE user1_id 
                END as connected_user_id
            FROM user_connections 
            WHERE $1 IN (user1_id, user2_id)
        `, [userId]);

        if (connections.rowCount === 0) {
            return res.json({ message: "No tienes conexiones aún" });
        }

        // Obtener todas las películas recomendables de una vez
        const recommendableMovies = await pool.query(`
            SELECT DISTINCT 
                m.id,
                m.title,
                um.rating,
                um.user_id as recommender_id
            FROM movies m
            INNER JOIN user_movies um ON m.id = um.movie_id
            INNER JOIN user_connections uc ON (
                (uc.user1_id = $1 AND uc.user2_id = um.user_id) OR
                (uc.user2_id = $1 AND uc.user1_id = um.user_id)
            )
            INNER JOIN users u ON u.id = $1
            WHERE um.rating >= 4
            AND NOT EXISTS (
                SELECT 1 
                FROM user_movies um2 
                WHERE um2.movie_id = m.id 
                AND um2.user_id = $1
            )
            -- El filtro de géneros ha sido eliminado para permitir cualquier película
        `, [userId]);

        if (recommendableMovies.rowCount === 0) {
            return res.json({ 
                message: "No hay películas recomendables que cumplan con tus preferencias de géneros. Asegúrate de tener géneros favoritos configurados." 
            });
        }

        // Insertar todas las recomendaciones
        for (const movie of recommendableMovies.rows) {
            await pool.query(`
                INSERT INTO movie_recommendations 
                (recommender_id, receiver_id, movie_id, rating)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (recommender_id, receiver_id, movie_id) DO NOTHING
            `, [movie.recommender_id, userId, movie.id, movie.rating]);
        }

        return res.json({ 
            message: `Recomendaciones generadas exitosamente. ${recommendableMovies.rowCount} películas recomendadas.` 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            message: "Error al generar recomendaciones" 
        });
    }
};

export const getUserRecommendations = async (req, res) => {
    try {
        const userId = req.userId; // Utilizamos el userId del token
        console.log("🔍 getUserRecommendations llamado para usuario:", userId);

        const recommendations = await pool.query(`
            SELECT 
                m.id as movie_id,
                m.title,
                m.overview,
                m.genre_ids,
                m.release_date,
                CASE 
                    WHEN m.poster_path IS NOT NULL AND m.poster_path != '' 
                    THEN CONCAT('https://image.tmdb.org/t/p/w500', m.poster_path)
                    ELSE NULL
                END as poster_path,
                -- Agrupar todos los recomendadores en un array
                ARRAY_AGG(
                    JSON_BUILD_OBJECT(
                        'id', u.id,
                        'name', u.name,
                        'gravatar', u.gravatar,
                        'rating', mr.rating
                    )
                ) as recommenders,
                -- Tomar la fecha más reciente de recomendación
                MAX(mr.created_at) as created_at,
                -- Contar cuántos usuarios recomendaron esta película
                COUNT(DISTINCT mr.recommender_id) as recommender_count
            FROM movie_recommendations mr
            INNER JOIN movies m ON mr.movie_id = m.id
            INNER JOIN users u ON mr.recommender_id = u.id
            WHERE mr.receiver_id = $1
            GROUP BY m.id, m.title, m.overview, m.genre_ids, m.release_date, m.poster_path
            ORDER BY created_at DESC
        `, [userId]);

        console.log("📊 Recomendaciones encontradas:", recommendations.rowCount);

        if (recommendations.rowCount === 0) {
            return res.status(404).json({ 
                errors: [
                    "No hay recomendaciones disponibles. Para recibir recomendaciones:",
                    "- Necesitas tener conexiones con otros usuarios",
                    "- Tus conexiones deben haber visto películas que tú no",
                    "- Esas películas deben tener buenas calificaciones (4 o 5 estrellas)"
                ]
            });
        }

        // Extraer los IDs de las películas para predicción en lote
        const movieIds = recommendations.rows.map(rec => rec.movie_id);
        console.log("🎬 IDs de películas para predicción:", movieIds);

        try {
            console.log("🤖 Iniciando cálculo de features para predicción en lote...");
            // Calcular features para todas las películas de una vez
            const moviesFeatures = await calculateMultipleMoviesFeatures(pool, userId, movieIds);
            console.log("✅ Features calculados para", moviesFeatures.length, "películas");
            
            // Verificar que las features tengan los datos correctos
            console.log("🔍 Verificando features calculados...");
            for (let i = 0; i < Math.min(3, moviesFeatures.length); i++) {
                console.log(`   Película ${i + 1}:`, {
                    movie_id: moviesFeatures[i].movie_id,
                    title: moviesFeatures[i].title || 'Sin título',
                    n_shared_genres: moviesFeatures[i].n_shared_genres,
                    vote_average: moviesFeatures[i].vote_average,
                    popularity: moviesFeatures[i].popularity
                });
            }
            
            console.log("🤖 Enviando features al modelo de IA...");
            // Obtener predicciones en lote del modelo
            const batchPredictions = await predictMultipleMovies(moviesFeatures);
            console.log("✅ Predicciones recibidas del modelo:", batchPredictions);
            
            // Verificar que las predicciones tengan la estructura correcta
            if (!batchPredictions || !batchPredictions.predictions) {
                console.error('❌ Error: Las predicciones no tienen la estructura esperada');
                console.error('📊 Estructura recibida:', JSON.stringify(batchPredictions, null, 2));
                throw new Error('Estructura de predicciones inválida');
            }
            
            // Crear un mapa de predicciones por movie_id para acceso rápido
            const predictionsMap = {};
            batchPredictions.predictions.forEach(pred => {
                predictionsMap[pred.movie_id] = pred;
            });

            // Combinar recomendaciones con predicciones
            const recommendationsWithPredictions = recommendations.rows.map(recommendation => {
                const prediction = predictionsMap[recommendation.movie_id];
                return {
                    ...recommendation,
                    ml_prediction: prediction || null
                };
            });

            console.log("🎉 Recomendaciones con predicciones listas:", recommendationsWithPredictions.length);
            console.log("📊 Ejemplo de recomendación con predicción:", {
                movie_id: recommendationsWithPredictions[0]?.movie_id,
                title: recommendationsWithPredictions[0]?.title,
                ml_prediction: recommendationsWithPredictions[0]?.ml_prediction
            });

            return res.json({
                recommendations: recommendationsWithPredictions,
                total_predictions: batchPredictions.total_movies || 0,
                model_used: batchPredictions.model_used || 'unknown'
            });

        } catch (mlError) {
            console.error('❌ Error en predicción de ML:', mlError);
            console.error('❌ Stack trace:', mlError.stack);
            
            // Si falla la predicción, devolver recomendaciones sin predicciones
            const recommendationsWithoutPredictions = recommendations.rows.map(recommendation => ({
                ...recommendation,
                ml_prediction: null
            }));

            return res.json({
                recommendations: recommendationsWithoutPredictions,
                ml_error: `No se pudieron obtener predicciones del modelo de IA: ${mlError.message}`,
                total_predictions: 0
            });
        }

    } catch (error) {
        console.error('❌ Error general en getUserRecommendations:', error);
        return res.status(500).json({ 
            errors: ["Error al obtener recomendaciones"] 
        });
    }
};

export const getMoviePrediction = async (req, res) => {
    try {
        const userId = req.userId;
        const { movie_id } = req.body;

        if (!movie_id) {
            return res.status(400).json({ 
                errors: ["Se requiere el ID de la película"] 
            });
        }

        // Calcular features para el modelo
        const features = await calculateMovieFeatures(pool, userId, movie_id);
        
        // Obtener predicción del modelo
        const prediction = await predictMovieRating(features);
        
        return res.json({
            prediction: prediction
        });
    } catch (error) {
        console.error('Error obteniendo predicción:', error);
        return res.status(500).json({ 
            errors: ["Error al obtener predicción del modelo"] 
        });
    }
};

export const getKNNRecommendations = async (req, res) => {
    try {
        const userId = req.userId;
        const limit = parseInt(req.query.limit) || 10;

        console.log(`🎯 [KNN] Solicitando recomendaciones KNN para usuario ${userId}`);

        // Verificar estado del servicio KNN
        const knnStatus = await knnService.getKNNStatus();
        if (knnStatus.status === 'offline') {
            return res.status(503).json({
                error: "Servicio KNN no disponible",
                details: knnStatus.error
            });
        }

        // Obtener recomendaciones del modelo KNN
        const knnRecommendations = await knnService.getKNNRecommendations(userId, limit);

        if (!knnRecommendations.recommendations || knnRecommendations.recommendations.length === 0) {
            return res.json({
                recommendations: [],
                message: "No se encontraron recomendaciones KNN para este usuario",
                knn_info: {
                    model_status: "active",
                    total_movies: knnRecommendations.total_movies || 0,
                    algorithm: "K-Nearest Neighbors"
                }
            });
        }

        // Obtener información completa de las películas recomendadas
        const movieIds = knnRecommendations.recommendations.map(rec => rec.movie_id);
        
        const moviesQuery = await pool.query(`
            SELECT 
                m.id,
                m.title,
                m.overview,
                m.genre_ids,
                m.release_date,
                CASE 
                    WHEN m.poster_path IS NOT NULL AND m.poster_path != '' 
                    THEN CONCAT('https://image.tmdb.org/t/p/w500', m.poster_path)
                    ELSE NULL
                END as poster_path,
                m.vote_average,
                m.popularity
            FROM movies m
            WHERE m.id = ANY($1)
            ORDER BY m.id
        `, [movieIds]);

        // Combinar recomendaciones KNN con información de películas
        const recommendationsWithDetails = knnRecommendations.recommendations.map(knnRec => {
            const movieInfo = moviesQuery.rows.find(movie => movie.id === knnRec.movie_id);
            return {
                ...knnRec,
                ...movieInfo,
                knn_similarity: knnRec.similarity,
                knn_score: knnRec.score
            };
        });

        console.log(`✅ [KNN] ${recommendationsWithDetails.length} recomendaciones KNN procesadas`);

        return res.json({
            recommendations: recommendationsWithDetails,
            knn_info: {
                model_status: "active",
                total_movies: knnRecommendations.total_movies || 0,
                algorithm: "K-Nearest Neighbors",
                neighbors_used: knnRecommendations.neighbors_used || 3,
                features_used: knnRecommendations.features_used || 7
            }
        });

    } catch (error) {
        console.error('❌ [KNN] Error en getKNNRecommendations:', error);
        return res.status(500).json({
            error: "Error al obtener recomendaciones KNN",
            details: error.message
        });
    }
};

export const getSimilarMoviesKNN = async (req, res) => {
    try {
        const { movieId } = req.params;
        const limit = parseInt(req.query.limit) || 5;

        console.log(`🔍 [KNN] Buscando películas similares a ${movieId}`);

        // Verificar que la película existe
        const movieExists = await pool.query(
            'SELECT id, title FROM movies WHERE id = $1',
            [movieId]
        );

        if (movieExists.rowCount === 0) {
            return res.status(404).json({
                error: "Película no encontrada"
            });
        }

        // Obtener películas similares del modelo KNN
        const similarMovies = await knnService.getSimilarMovies(movieId, limit);

        if (!similarMovies.similar_movies || similarMovies.similar_movies.length === 0) {
            return res.json({
                similar_movies: [],
                original_movie: movieExists.rows[0],
                message: "No se encontraron películas similares",
                knn_info: {
                    model_status: "active",
                    algorithm: "K-Nearest Neighbors"
                }
            });
        }

        // Obtener información completa de las películas similares
        const similarMovieIds = similarMovies.similar_movies.map(movie => movie.movie_id);
        
        const moviesQuery = await pool.query(`
            SELECT 
                m.id,
                m.title,
                m.overview,
                m.genre_ids,
                m.release_date,
                CASE 
                    WHEN m.poster_path IS NOT NULL AND m.poster_path != '' 
                    THEN CONCAT('https://image.tmdb.org/t/p/w500', m.poster_path)
                    ELSE NULL
                END as poster_path,
                m.vote_average,
                m.popularity
            FROM movies m
            WHERE m.id = ANY($1)
            ORDER BY m.id
        `, [similarMovieIds]);

        // Combinar información de similitud con detalles de películas
        const similarMoviesWithDetails = similarMovies.similar_movies.map(similarMovie => {
            const movieInfo = moviesQuery.rows.find(movie => movie.id === similarMovie.movie_id);
            return {
                ...similarMovie,
                ...movieInfo
            };
        });

        console.log(`✅ [KNN] ${similarMoviesWithDetails.length} películas similares encontradas`);

        return res.json({
            similar_movies: similarMoviesWithDetails,
            original_movie: movieExists.rows[0],
            knn_info: {
                model_status: "active",
                algorithm: "K-Nearest Neighbors",
                neighbors_used: similarMovies.neighbors_used || 3
            }
        });

    } catch (error) {
        console.error('❌ [KNN] Error en getSimilarMoviesKNN:', error);
        return res.status(500).json({
            error: "Error al obtener películas similares",
            details: error.message
        });
    }
};

export const getKNNStatus = async (req, res) => {
    try {
        const status = await knnService.getKNNStatus();
        return res.json(status);
    } catch (error) {
        console.error('❌ [KNN] Error obteniendo estado:', error);
        return res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
};