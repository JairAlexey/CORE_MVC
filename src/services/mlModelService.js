import axios from 'axios';

// URL del servicio ML separado (configurable por variable de entorno)
const ML_MODEL_URL = process.env.ML_MODEL_URL || 'http://127.0.0.1:8000';

export const predictMovieRating = async (predictionData) => {
    try {
        const response = await axios.post(`${ML_MODEL_URL}/predict`, predictionData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 segundos de timeout
        });
        
        return response.data;
    } catch (error) {
        console.error('Error al comunicarse con el modelo de ML:', error);
        throw new Error('Error al obtener predicción del modelo');
    }
};

export const predictMultipleMovies = async (moviesData) => {
    try {
        const response = await axios.post(`${ML_MODEL_URL}/predict-batch`, {
            movies: moviesData
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 segundos de timeout para predicciones en lote
        });
        
        return response.data;
    } catch (error) {
        console.error('Error al comunicarse con el modelo de ML para predicciones en lote:', error);
        throw new Error('Error al obtener predicciones en lote del modelo');
    }
};

export const calculateMovieFeatures = async (pool, userId, movieId) => {
    try {
        // Obtener información del usuario
        const userQuery = await pool.query(`
            SELECT favorite_genres 
            FROM users 
            WHERE id = $1
        `, [userId]);

        if (userQuery.rowCount === 0) {
            throw new Error('Usuario no encontrado');
        }

        const userFavoriteGenres = userQuery.rows[0].favorite_genres || [];

        // Obtener información de la película (agregar release_date y popularity)
        const movieQuery = await pool.query(`
            SELECT genre_ids, vote_average, vote_count, release_date, popularity
            FROM movies 
            WHERE id = $1
        `, [movieId]);

        if (movieQuery.rowCount === 0) {
            throw new Error('Película no encontrada');
        }

        const movie = movieQuery.rows[0];
        const movieGenres = movie.genre_ids || [];

        // Calcular géneros compartidos
        const sharedGenres = userFavoriteGenres.filter(genre => 
            movieGenres.includes(genre)
        );
        const nSharedGenres = sharedGenres.length;
        const isFavoriteGenre = nSharedGenres >= 1 ? 1 : 0;
        const genreMatchRatio = movieGenres.length > 0 ? nSharedGenres / movieGenres.length : 0;

        // Calcular years_since_release
        const currentYear = new Date().getFullYear();
        let yearsSinceRelease = 0;
        if (movie.release_date) {
            let releaseYear;
            if (typeof movie.release_date === 'string') {
                releaseYear = parseInt(movie.release_date.substring(0, 4));
            } else if (movie.release_date instanceof Date) {
                releaseYear = movie.release_date.getFullYear();
            } else {
                releaseYear = parseInt(String(movie.release_date).substring(0, 4));
            }
            if (!isNaN(releaseYear)) {
                yearsSinceRelease = currentYear - releaseYear;
            }
        }

        // Obtener estadísticas del usuario
        const userStatsQuery = await pool.query(`
            SELECT 
                AVG(rating) as avg_user_rating,
                COUNT(*) as user_num_rated
            FROM user_movies 
            WHERE user_id = $1 AND rating IS NOT NULL
        `, [userId]);

        const userStats = userStatsQuery.rows[0];
        const avgUserRating = parseFloat(userStats.avg_user_rating) || 3.5;
        const userNumRated = parseInt(userStats.user_num_rated) || 0;

        // Verificar si fue recomendada
        const recommendationQuery = await pool.query(`
            SELECT 1 FROM movie_recommendations 
            WHERE receiver_id = $1 AND movie_id = $2
        `, [userId, movieId]);

        const wasRecommended = recommendationQuery.rowCount > 0 ? 1 : 0;

        return {
            n_shared_genres: nSharedGenres,
            genre_match_ratio: parseFloat(genreMatchRatio.toFixed(3)),
            vote_average: movie.vote_average || 0,
            vote_count: movie.vote_count || 0,
            popularity: movie.popularity || 0,
            years_since_release: yearsSinceRelease,
            is_favorite_genre: isFavoriteGenre,
            was_recommended: wasRecommended,
            avg_user_rating: parseFloat(avgUserRating.toFixed(2)),
            user_num_rated: userNumRated
        };
    } catch (error) {
        console.error('Error calculando características de la película:', error);
        throw error;
    }
};

export const calculateMultipleMoviesFeatures = async (pool, userId, movieIds) => {
    try {
        const featuresPromises = movieIds.map(movieId => 
            calculateMovieFeatures(pool, userId, movieId)
        );
        
        const features = await Promise.all(featuresPromises);
        
        return features.map((feature, index) => ({
            movie_id: movieIds[index],
            ...feature
        }));
    } catch (error) {
        console.error('Error calculando características de múltiples películas:', error);
        throw error;
    }
};

export const getModelStatus = async () => {
    try {
        const response = await axios.get(`${ML_MODEL_URL}/health`, {
            timeout: 5000
        });
        
        return response.data;
    } catch (error) {
        console.error('Error verificando estado del modelo ML:', error);
        return {
            status: 'ERROR',
            model_loaded: false,
            error: error.message
        };
    }
}; 