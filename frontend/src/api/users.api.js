import axios from "./axios";

export const getAllUsersRequest = () => axios.get("/users");

export const updateUserRequest = (id, userData) =>
    axios.put(`/users/${id}`, userData);

export const deleteUserRequest = (id) =>
    axios.delete(`/users/${id}`);

export const generateFavoriteGenresRequest = (favoriteGenres) => 
    axios.put('/favorite-genres', { favoriteGenres });

export const getFavoriteGenresRequest = () => axios.get('/favorite-genres');
