import axios from 'axios';

const API_KEY = 'd73468cfd03d633688b7bee80c78f659';
const BASE_URL = 'https://api.themoviedb.org/3';

export const fetchMovies = async (page = 1, category = 'popular') => {
    try {
        let endpoint;
        switch (category) {
            case 'top_rated':
                endpoint = '/movie/top_rated';
                break;
            case 'upcoming':
                endpoint = '/movie/upcoming';
                break;
            case 'now_playing':
                endpoint = '/movie/now_playing';
                break;
            case 'all':
                endpoint = '/discover/movie';
                break;
            default:
                endpoint = '/movie/popular';
        }

        const response = await axios.get(`${BASE_URL}${endpoint}`, {
            params: {
                api_key: API_KEY,
                language: 'es-MX',
                page: page,
                region: 'MX'
            }
        });

        // Verificar la respuesta
        if (!response.data || !response.data.results) {
            console.error('Respuesta inválida de TMDB:', response);
            throw new Error('Formato de respuesta inválido de TMDB');
        }

        console.log('Respuesta de TMDB:', response.data); // Para debug

        return {
            results: response.data.results.map(movie => ({
                ...movie,
                poster_path: movie.poster_path 
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : null
            })),
            totalPages: response.data.total_pages,
            currentPage: response.data.page
        };
    } catch (error) {
        console.error('Error detallado al obtener películas:', error.response || error);
        throw error;
    }
};

export const searchMovies = async (searchTerm, page = 1) => {
    try {
        const response = await axios.get(`${BASE_URL}/search/movie`, {
            params: {
                api_key: API_KEY,
                language: 'es-MX',
                query: searchTerm,
                page: page,
                region: 'MX'
            }
        });

        return {
            results: response.data.results.map(movie => ({
                ...movie,
                poster_path: movie.poster_path 
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : null
            })),
            totalPages: response.data.total_pages,
            currentPage: response.data.page
        };
    } catch (error) {
        console.error('Error en búsqueda de películas:', error);
        throw error;
    }
};

export const fetchAllMovies = async (page = 1) => {
    try {
        const response = await axios.get(`${BASE_URL}/discover/movie`, {
            params: {
                api_key: API_KEY,
                language: 'es-MX',
                page: page,
                sort_by: 'popularity.desc',
                include_adult: false,
                include_video: false
            }
        });

        return {
            results: response.data.results.map(movie => ({
                ...movie,
                poster_path: movie.poster_path 
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : null
            })),
            totalPages: response.data.total_pages,
            currentPage: response.data.page
        };
    } catch (error) {
        console.error('Error obteniendo todas las películas:', error);
        throw error;
    }
};

const options = {
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`
    }
};