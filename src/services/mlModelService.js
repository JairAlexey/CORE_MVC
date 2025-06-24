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

// Nueva función para predicción en lote
export const predictMultipleMovies = async (moviesFeatures) => {
    console.log("🤖 predictMultipleMovies llamado con", moviesFeatures.length, "películas");
    console.log("📊 Features de ejemplo:", moviesFeatures[0]);
    console.log("🌐 URL del modelo ML:", ML_MODEL_URL);
    
    try {
        const requestData = {
            movies: moviesFeatures
        };
        
        console.log("📤 Enviando datos al modelo ML:", JSON.stringify(requestData, null, 2));
        
        const response = await axios.post(`${ML_MODEL_URL}/predict-batch`, requestData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000, // 30 segundos para lote
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        
        console.log("✅ Respuesta del modelo recibida:", response.status, response.statusText);
        console.log("📊 Datos de respuesta:", JSON.stringify(response.data, null, 2));
        
        return response.data;
    } catch (error) {
        console.error('❌ Error al comunicarse con el modelo de ML para predicción en lote:');
        console.error('❌ URL:', ML_MODEL_URL);
        console.error('❌ Error:', error.message);
        console.error('❌ Status:', error.response?.status);
        console.error('❌ Status Text:', error.response?.statusText);
        console.error('❌ Response Data:', error.response?.data);
        console.error('❌ Request Data:', error.config?.data);
        
        // Si es un error de timeout, dar información específica
        if (error.code === 'ECONNABORTED') {
            throw new Error('Timeout al comunicarse con el modelo ML (30s)');
        }
        
        // Si es un error de red
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            throw new Error(`No se puede conectar al servicio ML en ${ML_MODEL_URL}`);
        }
        
        // Si es un error HTTP
        if (error.response) {
            throw new Error(`Error HTTP ${error.response.status}: ${error.response.statusText}`);
        }
        
        throw new Error(`Error al obtener predicciones del modelo: ${error.message}`);
    }
};

// Función para verificar el estado del servicio ML
export const checkMLServiceHealth = async () => {
    try {
        const response = await axios.get(`${ML_MODEL_URL}/health`, {
            timeout: 5000
        });
        return response.data;
    } catch (error) {
        console.error('Error verificando salud del servicio ML:', error);
        return { status: 'ERROR', error: error.message };
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

        // Popularidad
        const popularity = movie.popularity || 0;

        return {
            movie_id: movieId,
            n_shared_genres: nSharedGenres,
            vote_average: movie.vote_average || 0,
            vote_count: movie.vote_count || 0,
            is_favorite_genre: isFavoriteGenre,
            years_since_release: yearsSinceRelease,
            popularity: popularity
        };
    } catch (error) {
        console.error('Error calculando features de la película:', error);
        throw error;
    }
};

// Nueva función para calcular features de múltiples películas
export const calculateMultipleMoviesFeatures = async (pool, userId, movieIds) => {
    console.log("🔍 calculateMultipleMoviesFeatures llamado para usuario:", userId, "con", movieIds.length, "películas");
    
    try {
        // Obtener información del usuario una sola vez
        const userQuery = await pool.query(`
            SELECT favorite_genres 
            FROM users 
            WHERE id = $1
        `, [userId]);

        if (userQuery.rowCount === 0) {
            throw new Error('Usuario no encontrado');
        }

        const userFavoriteGenres = userQuery.rows[0].favorite_genres || [];
        console.log("👤 Géneros favoritos del usuario:", userFavoriteGenres);

        // Obtener información de todas las películas de una vez
        const placeholders = movieIds.map((_, index) => `$${index + 1}`).join(',');
        const moviesQuery = await pool.query(`
            SELECT id, title, genre_ids, vote_average, vote_count, release_date, popularity
            FROM movies 
            WHERE id IN (${placeholders})
        `, movieIds);

        console.log("📊 Películas encontradas en BD:", moviesQuery.rowCount);

        const currentYear = new Date().getFullYear();
        const moviesFeatures = [];

        for (const movie of moviesQuery.rows) {
            const movieGenres = movie.genre_ids || [];

            // Calcular géneros compartidos
            const sharedGenres = userFavoriteGenres.filter(genre => 
                movieGenres.includes(genre)
            );
            const nSharedGenres = sharedGenres.length;
            const isFavoriteGenre = nSharedGenres >= 1 ? 1 : 0;

            // Calcular years_since_release
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

            const features = {
                movie_id: movie.id,
                n_shared_genres: nSharedGenres,
                vote_average: movie.vote_average || 0,
                vote_count: movie.vote_count || 0,
                is_favorite_genre: isFavoriteGenre,
                years_since_release: yearsSinceRelease,
                popularity: movie.popularity || 0
            };
            
            moviesFeatures.push(features);
            console.log(`🎬 Película ${movie.id} (${movie.title}):`, features);
        }

        console.log("✅ Features calculados para", moviesFeatures.length, "películas");
        return moviesFeatures;
    } catch (error) {
        console.error('❌ Error calculando features de múltiples películas:', error);
        throw error;
    }
}; 