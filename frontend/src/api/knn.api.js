import axios from "./axios.js";

export const getKNNRecommendationsRequest = async (limit = 10) => {
    return await axios.get(`/recommendations/knn?limit=${limit}`);
};

export const getSimilarMoviesKNNRequest = async (movieId, limit = 5) => {
    return await axios.get(`/movies/${movieId}/similar-knn?limit=${limit}`);
};

export const getKNNStatusRequest = async () => {
    const timestamp = new Date().getTime();
    return await axios.get(`/knn/status?_t=${timestamp}`);
}; 