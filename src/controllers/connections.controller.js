import { pool } from "../db.js";

export const calculateUserCompatibility = async (user1Id, user2Id) => {
    try {
        // 1. Calcular similitud en películas (60% del peso total)
        const movieSimilarity = await pool.query(`
            WITH user1_movies AS (
                SELECT movie_id, rating FROM user_movies WHERE user_id = $1
            ),
            user2_movies AS (
                SELECT movie_id, rating FROM user_movies WHERE user_id = $2
            ),
            common_movies AS (
                SELECT 
                    u1.rating as rating1,
                    u2.rating as rating2
                FROM user1_movies u1
                INNER JOIN user2_movies u2 ON u1.movie_id = u2.movie_id
            )
            SELECT 
                CASE 
                    WHEN COUNT(*) = 0 THEN 0
                    ELSE (
                        1 - (SUM(ABS(rating1 - rating2))::float / (COUNT(*) * 4))
                    ) * 100
                END as movie_similarity
            FROM common_movies
        `, [user1Id, user2Id]);

        // 2. Calcular similitud en géneros (40% del peso total)
        const genreSimilarity = await pool.query(`
            WITH user1_genres AS (
                SELECT unnest(favorite_genres) as genre FROM users WHERE id = $1
            ),
            user2_genres AS (
                SELECT unnest(favorite_genres) as genre FROM users WHERE id = $2
            ),
            common_genres AS (
                SELECT COUNT(*) as common_count
                FROM user1_genres u1
                INNER JOIN user2_genres u2 ON u1.genre = u2.genre
            ),
            total_genres AS (
                SELECT COUNT(DISTINCT genre) as total_count
                FROM (
                    SELECT genre FROM user1_genres
                    UNION
                    SELECT genre FROM user2_genres
                ) as all_genres
            )
            SELECT 
                CASE 
                    WHEN total.total_count = 0 THEN 0
                    ELSE (common.common_count::float / total.total_count) * 100
                END as genre_similarity
            FROM common_genres common, total_genres total
        `, [user1Id, user2Id]);

        const movieScore = movieSimilarity.rows[0].movie_similarity * 0.6;
        const genreScore = genreSimilarity.rows[0].genre_similarity * 0.4;
        
        return Math.round(movieScore + genreScore);
    } catch (error) {
        console.error("Error calculando compatibilidad:", error);
        throw error;
    }
};

export const updateUserConnections = async (req, res) => {
    try {
        const userId = req.userId;
        
        // Obtener todos los usuarios excepto el actual
        const usersResult = await pool.query(
            'SELECT id FROM users WHERE id != $1',
            [userId]
        );

        // Calcular compatibilidad con cada usuario
        for (const user of usersResult.rows) {
            const compatibilityScore = await calculateUserCompatibility(
                Math.min(userId, user.id),
                Math.max(userId, user.id)
            );

            // Solo crear conexión si la compatibilidad es mayor al 50%
            if (compatibilityScore >= 50) {
                await pool.query(`
                    INSERT INTO user_connections (user1_id, user2_id, compatibility_score)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (user1_id, user2_id) 
                    DO UPDATE SET 
                        compatibility_score = $3,
                        created_at = CURRENT_TIMESTAMP
                `, [
                    Math.min(userId, user.id),
                    Math.max(userId, user.id),
                    compatibilityScore
                ]);
            }
        }

        res.json({ message: "Conexiones actualizadas exitosamente" });
    } catch (error) {
        console.error("Error al actualizar conexiones:", error);
        res.status(500).json({ message: "Error al actualizar conexiones" });
    }
};

export const getUserConnections = async (req, res) => {
    try {
        const userId = req.userId;

        const connectionsResult = await pool.query(`
            SELECT 
                CASE 
                    WHEN uc.user1_id = $1 THEN uc.user2_id 
                    ELSE uc.user1_id 
                END as connected_user_id,
                u.name as connected_user_name,
                u.gravatar as connected_user_gravatar,
                uc.compatibility_score,
                uc.created_at
            FROM user_connections uc
            JOIN users u ON (
                CASE 
                    WHEN uc.user1_id = $1 THEN uc.user2_id 
                    ELSE uc.user1_id 
                END = u.id
            )
            WHERE $1 IN (user1_id, user2_id)
            ORDER BY uc.compatibility_score DESC
        `, [userId]);

        if (connectionsResult.rowCount === 0) {
            return res.status(404).json({ 
                errors: [
                    "No tienes conexiones aún. Para generar conexiones necesitas:",
                    "- Calificar algunas películas",
                    "- Tener géneros favoritos en común con otros usuarios",
                    "- Que existan otros usuarios activos en el sistema"
                ]
            });
        }

        res.json(connectionsResult.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            errors: ["Error al obtener conexiones"] 
        });
    }
};