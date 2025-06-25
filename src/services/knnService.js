import axios from 'axios';

class KNNService {
    constructor() {
        this.baseURL = process.env.KNN_API_URL || 'http://localhost:8001';
        this.api = axios.create({
            baseURL: this.baseURL,
            timeout: 30000, // 30 segundos
        });
    }

    async getKNNRecommendations(userId, limit = 10, userWatchedMovies = null) {
        try {
            console.log(`🤖 [KNN] Solicitando recomendaciones para usuario ${userId}`);
            const body = {
                user_id: userId,
                limit: limit
            };
            if (userWatchedMovies && Array.isArray(userWatchedMovies) && userWatchedMovies.length > 0) {
                body.user_watched_movies = userWatchedMovies;
            }
            const response = await this.api.post('/recommendations/knn', body);
            console.log(`✅ [KNN] Recomendaciones recibidas:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`❌ [KNN] Error obteniendo recomendaciones:`, error.message);
            if (error.code === 'ECONNREFUSED') {
                throw new Error('Servicio KNN no disponible. Asegúrate de que esté ejecutándose.');
            }
            if (error.response) {
                throw new Error(`Error del servicio KNN: ${error.response.data.detail || error.response.statusText}`);
            }
            throw new Error(`Error de conexión con KNN: ${error.message}`);
        }
    }

    async getSimilarMovies(movieId, limit = 5) {
        try {
            console.log(`🔍 [KNN] Buscando películas similares a ${movieId}`);
            
            const response = await this.api.post('/similar', {
                movie_id: movieId,
                limit: limit
            });

            console.log(`✅ [KNN] Películas similares encontradas:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`❌ [KNN] Error buscando películas similares:`, error.message);
            
            if (error.response) {
                throw new Error(`Error del servicio KNN: ${error.response.data.detail || error.response.statusText}`);
            }
            
            throw new Error(`Error de conexión con KNN: ${error.message}`);
        }
    }

    async getKNNStatus() {
        try {
            const response = await this.api.get('/health');
            const data = response.data;
            
            // Verificar si el modelo está cargado y funcionando
            const modelLoaded = data.model_info?.model_loaded || false;
            const totalMovies = data.model_info?.total_movies || 0;
            
            if (modelLoaded && totalMovies > 0) {
                return {
                    status: 'online',
                    data: {
                        ...data,
                        model_active: true,
                        total_movies: totalMovies
                    }
                };
            } else {
                return {
                    status: 'warning',
                    data: {
                        ...data,
                        model_active: false,
                        message: 'Modelo KNN cargado pero sin datos suficientes'
                    }
                };
            }
        } catch (error) {
            return {
                status: 'offline',
                error: error.message,
                data: {
                    model_active: false,
                    message: 'Servicio KNN no disponible'
                }
            };
        }
    }

    async evaluateRecommendations(userId, recommendations, topK = 10) {
        try {
            console.log(`📊 [KNN] Evaluando calidad de recomendaciones para usuario ${userId}`);
            
            const response = await this.api.post('/evaluate', {
                user_id: userId,
                recommendations: recommendations,
                top_k: topK
            });

            console.log(`✅ [KNN] Evaluación completada:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`❌ [KNN] Error evaluando recomendaciones:`, error.message);
            
            if (error.response) {
                throw new Error(`Error del servicio KNN: ${error.response.data.detail || error.response.statusText}`);
            }
            
            throw new Error(`Error de conexión con KNN: ${error.message}`);
        }
    }
}

export const knnService = new KNNService(); 