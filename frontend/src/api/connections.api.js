import axios from "./axios";

export const updateConnectionsRequest = () => axios.post('/connections/update');
export const getUserConnectionsRequest = () => axios.get('/connections');
export const generateRecommendationsRequest = () => axios.post('/recommendations/generate');
export const getUserRecommendationsRequest = () => axios.get('/recommendations');