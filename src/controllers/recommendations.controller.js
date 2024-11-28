import { pool } from "../db.js";

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

        // Para cada conexión, buscar películas para recomendar
        const recommendationsMap = new Map(); // Usar un mapa para evitar duplicados

        for (const connection of connections.rows) {
            const connectedUserId = connection.connected_user_id;

            // Obtener películas bien calificadas (4 o 5 estrellas) por el usuario conectado
            const recommendableMovies = await pool.query(`
                SELECT DISTINCT 
                    m.id,
                    m.title,
                    um.rating,
                    um.user_id as recommender_id
                FROM movies m
                INNER JOIN user_movies um ON m.id = um.movie_id                    
                WHERE um.user_id = $1 
                AND um.rating >= 4
                AND NOT EXISTS (
                    SELECT 1 
                    FROM user_movies um2 
                    WHERE um2.movie_id = m.id 
                    AND um2.user_id = $2
                )
            `, [connectedUserId, userId]);

            // Insertar recomendaciones en el mapa
            for (const movie of recommendableMovies.rows) {
                const key = movie.id; // Usar el ID de la película como clave
                if (!recommendationsMap.has(key)) {
                    recommendationsMap.set(key, {
                        ...movie,
                        recommenders: [movie.recommender_id] // Inicializar con el recomendador
                    });
                } else {
                    recommendationsMap.get(key).recommenders.push(movie.recommender_id); // Agregar recomendador
                }
            }
        }

        // Insertar recomendaciones en la base de datos
        for (const [key, movie] of recommendationsMap) {
            await pool.query(`
                INSERT INTO movie_recommendations 
                (recommender_id, receiver_id, movie_id, rating)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (recommender_id, receiver_id, movie_id) DO NOTHING
            `, [movie.recommender_id, userId, movie.id, movie.rating]);
        }

        return res.json({ message: "Recomendaciones generadas exitosamente" });
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

        const recommendations = await pool.query(`
            SELECT 
                mr.id as id,
                m.*,
                u.name as recommender_name,
                u.gravatar as recommender_gravatar,
                mr.rating as recommender_rating,
                mr.created_at
            FROM movie_recommendations mr
            INNER JOIN movies m ON mr.movie_id = m.id
            INNER JOIN users u ON mr.recommender_id = u.id
            WHERE mr.receiver_id = $1
            ORDER BY mr.created_at DESC
        `, [userId]);

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

        return res.json({
            recommendations: recommendations.rows
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            errors: ["Error al obtener recomendaciones"] 
        });
    }
};