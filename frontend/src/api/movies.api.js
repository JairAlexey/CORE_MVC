import axios from "./axios";

export const getAllMoviesRequest = (page = 1, category = 'popular', searchTerm = '') => {
    const user = JSON.parse(localStorage.getItem('user'));
    const endpoint = user?.is_admin ? '/movies' : '/user-movies';
    return axios.get(endpoint, {
        params: {
            page,
            category,
            search: searchTerm
        }
    });
};

export const updateMovieRequest = (id, movie) => axios.put(`/movies/${id}`, movie);
export const deleteMovieRequest = (id) => axios.delete(`/movies/${id}`);
export const createMovieRequest = (movie) => axios.post('/movies', movie);

//funciones de la API para marcar y desmarcar películas como vistas
export const markMovieAsWatchedRequest = (movieId) => axios.post(`/movies/${movieId}/watched`);
export const unmarkMovieAsWatchedRequest = (movieId) => axios.delete(`/movies/${movieId}/watched`);
export const commentAndRateMovieRequest = (movieId, comment, rating) => 
    axios.post(`/movies/${movieId}/comment`, { comment, rating });

//funcion para obtener los detalles de la peliculas
export const getMovieDetailsRequest = (movieId) => axios.get(`/movies/${movieId}/details`);
