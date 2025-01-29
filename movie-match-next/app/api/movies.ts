import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';  

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true  // Importante para las cookies
});

axiosInstance.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export const movieApi = {
    getAllMovies: async (page = 1, category = 'popular') => {
        try {
            const response = await axiosInstance.get('/user-movies', {
                params: { page, category }
            });
            return response.data;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    login: async (email: string, password: string) => {
        try {
            const response = await axiosInstance.post('/signin', { 
                email,
                password
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || 'Error en el inicio de sesión';
                throw new Error(errorMessage);
            }
            throw error;
        }
    }
};