import axios from "./axios";

export const getAllMoviesRequest = () => axios.get("/movies");
export const updateMovieRequest = (id, movieData) => axios.put(`/movies/${id}`, movieData);