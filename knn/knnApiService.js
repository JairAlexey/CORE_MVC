import axios from 'axios';

// URL del servicio KNN (configurable por variable de entorno)
const KNN_API_URL = process.env.KNN_API_URL || 'http://127.0.0.1:8001';

export const knnApiService = {
    /**
     * Verificar estado del servicio KNN
     */
    async getStatus() {
        try {
            const response = await axios.get(`${KNN_API_URL}/health`, {
                timeout: 5000
            });
            return response.data;
        } catch (error) {
            console.error('Error verificando estado del servicio KNN:', error);
            return {
                status: 'ERROR',
                message: 'Servicio KNN no disponible',
                error: error.message
            };
        }
    },

    /**
     * Encontrar películas similares usando KNN
     */
    async findSimilarMovies(movieId, topK = 3) {
        try {
            const response = await axios.post(`${KNN_API_URL}/similar-movies`, {
                movie_id: movieId,
                top_k: topK
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            return response.data;
        } catch (error) {
            console.error('Error encontrando películas similares:', error);
            throw new Error('Error al obtener películas similares del servicio KNN');
        }
    },

    /**
     * Expandir recomendaciones sociales con KNN
     */
    async expandSocialRecommendations(socialRecommendations, userFeatures) {
        try {
            const response = await axios.post(`${KNN_API_URL}/expand-recommendations`, {
                social_recommendations: socialRecommendations,
                user_features: userFeatures
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });
            
            return response.data;
        } catch (error) {
            console.error('Error expandiendo recomendaciones sociales:', error);
            throw new Error('Error al expandir recomendaciones con KNN');
        }
    },

    /**
     * Obtener recomendaciones eficientes combinando todas las estrategias
     */
    async getEfficientRecommendations(socialRecommendations, userFeatures) {
        try {
            const response = await axios.post(`${KNN_API_URL}/efficient-recommendations`, {
                social_recommendations: socialRecommendations,
                user_features: userFeatures
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 20000
            });
            
            return response.data;
        } catch (error) {
            console.error('Error obteniendo recomendaciones eficientes:', error);
            throw new Error('Error al obtener recomendaciones eficientes del servicio KNN');
        }
    },

    /**
     * Obtener estado detallado del modelo KNN
     */
    async getModelStatus() {
        try {
            const response = await axios.get(`${KNN_API_URL}/model-status`, {
                timeout: 5000
            });
            return response.data;
        } catch (error) {
            console.error('Error obteniendo estado del modelo KNN:', error);
            return {
                knn_loaded: false,
                error: error.message
            };
        }
    },

    /**
     * Entrenar modelo KNN (solo para desarrollo)
     */
    async trainModel() {
        try {
            const response = await axios.post(`${KNN_API_URL}/train-model`, {}, {
                timeout: 60000 // 1 minuto para entrenamiento
            });
            return response.data;
        } catch (error) {
            console.error('Error entrenando modelo KNN:', error);
            throw new Error('Error al entrenar modelo KNN');
        }
    }
};

/**
 * Función helper para convertir recomendaciones del formato de la base de datos
 * al formato esperado por la API KNN
 */
export const convertRecommendationsForKNN = (dbRecommendations) => {
    return dbRecommendations.map(rec => ({
        movie_id: rec.movie_id,
        title: rec.title,
        rating: rec.recommenders?.[0]?.rating || 4.0, // Tomar el rating del primer recomendador
        recommenders: rec.recommenders || []
    }));
};

/**
 * Función helper para extraer características del usuario
 */
export const extractUserFeatures = (userData, userStats) => {
    return {
        user_id: userData.id,
        favorite_genres: userData.favorite_genres || [],
        avg_rating: userStats?.avg_user_rating || 3.5,
        total_rated: userStats?.user_num_rated || 0
    };
};

/**
 * Función helper para integrar recomendaciones KNN con el sistema existente
 */
export const integrateKNNWithExistingSystem = async (pool, userId, socialRecommendations) => {
    try {
        // Obtener datos del usuario
        const userQuery = await pool.query(`
            SELECT id, favorite_genres 
            FROM users 
            WHERE id = $1
        `, [userId]);

        if (userQuery.rowCount === 0) {
            throw new Error('Usuario no encontrado');
        }

        const userData = userQuery.rows[0];

        // Obtener estadísticas del usuario
        const userStatsQuery = await pool.query(`
            SELECT 
                AVG(rating) as avg_user_rating,
                COUNT(*) as user_num_rated
            FROM user_movies 
            WHERE user_id = $1 AND rating IS NOT NULL
        `, [userId]);

        const userStats = userStatsQuery.rows[0];

        // Preparar datos para KNN
        const knnRecommendations = convertRecommendationsForKNN(socialRecommendations);
        const userFeatures = extractUserFeatures(userData, userStats);

        // Verificar si el servicio KNN está disponible
        const knnStatus = await knnApiService.getStatus();
        
        if (knnStatus.status === 'healthy') {
            console.log('🤖 Servicio KNN disponible, obteniendo recomendaciones eficientes...');
            
            // Obtener recomendaciones eficientes
            const efficientRecs = await knnApiService.getEfficientRecommendations(
                knnRecommendations, 
                userFeatures
            );

            console.log(`✅ Recomendaciones KNN obtenidas: ${efficientRecs.final_count} películas`);
            console.log(`📊 Estrategia utilizada: ${efficientRecs.strategy_summary.knn_activated ? 'KNN + Social' : 'Solo Social'}`);

            return {
                recommendations: efficientRecs.recommendations,
                knn_used: true,
                strategy_summary: efficientRecs.strategy_summary
            };

        } else {
            console.log('⚠️ Servicio KNN no disponible, usando recomendaciones sociales originales');
            
            return {
                recommendations: socialRecommendations,
                knn_used: false,
                strategy_summary: {
                    social_recommendations: socialRecommendations.length,
                    knn_activated: false,
                    reason: 'KNN service unavailable'
                }
            };
        }

    } catch (error) {
        console.error('Error integrando KNN con sistema existente:', error);
        
        // Fallback a recomendaciones sociales originales
        return {
            recommendations: socialRecommendations,
            knn_used: false,
            strategy_summary: {
                social_recommendations: socialRecommendations.length,
                knn_activated: false,
                reason: error.message
            }
        };
    }
};

export default knnApiService; 