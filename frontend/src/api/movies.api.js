import axios from "./axios";

export const getAllMoviesRequest = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const endpoint = user?.is_admin ? '/movies' : '/user-movies';
    return axios.get(endpoint);
};

export const updateMovieRequest = (id, movieData) => axios.put(`/movies/${id}`, movieData);
export const deleteMovieRequest = (id) => axios.delete(`/movies/${id}`); 
export const createMovieRequest = (movieData) => axios.post(`/movies`, movieData); 