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
            default:
                endpoint = '/discover/movie';
        }

        const response = await axios.get(`${BASE_URL}${endpoint}`, {
            params: {
                api_key: API_KEY,
                language: 'es-MX',
                page: page,
                region: 'MX'
            },
        });
        return {
            results: response.data.results,
            totalPages: response.data.total_pages,
            currentPage: response.data.page
        };
    } catch (error) {
        console.error('Error fetching movies:', error);
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
                include_video: false,
                with_watch_monetization_types: 'flatrate'
            },
        });
        return {
            results: response.data.results,
            totalPages: response.data.total_pages,
            currentPage: response.data.page
        };
    } catch (error) {
        console.error('Error fetching all movies:', error);
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
                include_adult: false,
                region: 'MX'
            },
        });
        return {
            results: response.data.results,
            totalPages: response.data.total_pages,
            currentPage: response.data.page
        };
    } catch (error) {
        console.error('Error searching movies:', error);
        throw error;
    }
};