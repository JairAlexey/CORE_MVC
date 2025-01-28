class MovieObserver {
    constructor() {
        this.observers = [];
    }

    subscribe(observer) {
        this.observers.push(observer);
    }

    unsubscribe(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }

    notify(userId, movieId, rating) {
        this.observers.forEach(observer => {
            observer.update(userId, movieId, rating);
        });
    }
}

class RecommendationObserver {
    constructor(pool) {
        this.pool = pool;
    }

    async update(userId, movieId, rating) {
        if (rating >= 4) {
            try {
                // Obtener conexiones del usuario
                const connections = await this.pool.query(`
                    SELECT 
                        CASE 
                            WHEN user1_id = $1 THEN user2_id 
                            ELSE user1_id 
                        END as connected_user_id
                    FROM user_connections 
                    WHERE $1 IN (user1_id, user2_id)
                `, [userId]);

                // Para cada conexión, verificar si debemos recomendar la película
                for (const connection of connections.rows) {
                    const connectedUserId = connection.connected_user_id;

                    // Verificar si el usuario conectado ya ha visto la película
                    const hasWatched = await this.pool.query(
                        "SELECT 1 FROM user_movies WHERE user_id = $1 AND movie_id = $2",
                        [connectedUserId, movieId]
                    );

                    if (hasWatched.rowCount === 0) {
                        // Insertar recomendación
                        await this.pool.query(`
                            INSERT INTO movie_recommendations 
                            (recommender_id, receiver_id, movie_id, rating)
                            VALUES ($1, $2, $3, $4)
                            ON CONFLICT (recommender_id, receiver_id, movie_id) 
                            DO UPDATE SET rating = $4
                        `, [userId, connectedUserId, movieId, rating]);
                    }
                }
            } catch (error) {
                console.error('Error en RecommendationObserver:', error);
            }
        }
    }
}

export { MovieObserver, RecommendationObserver }; 