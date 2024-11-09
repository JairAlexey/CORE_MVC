import axios from 'axios';

const API_KEY = 'd73468cfd03d633688b7bee80c78f659';
const BASE_URL = 'https://api.themoviedb.org/3';

export const fetchMovies = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/discover/movie`, {
            params: {
                api_key: API_KEY,
                sort_by: 'popularity.desc',
                language: 'es-MX', // Idioma español
                page: 1,
            },
        });
        return response.data.results;
    } catch (error) {
        console.error('Error fetching movies:', error);
        throw error;
    }
};