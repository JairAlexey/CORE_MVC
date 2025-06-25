import axios from 'axios';

class KNNService {
    constructor() {
        this.baseURL = process.env.KNN_API_URL || 'http://localhost:8001';
        this.api = axios.create({
            baseURL: this.baseURL,
            timeout: 30000, // 30 segundos
        });
    }

    async getKNNRecommendations(userId, limit = 10) {
        try {
            console.log(`🤖 [KNN] Solicitando recomendaciones para usuario ${userId}`);
            
            const response = await this.api.post('/recommend', {
                user_id: userId,
                limit: limit
            });

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
            return {
                status: 'online',
                data: response.data
            };
        } catch (error) {
            return {
                status: 'offline',
                error: error.message
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