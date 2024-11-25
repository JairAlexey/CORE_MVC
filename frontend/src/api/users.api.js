import axios from "./axios";

export const getAllUsersRequest = () => axios.get("/users");

export const updateUserRequest = (id, userData) =>
    axios.put(`/users/${id}`, userData);

export const deleteUserRequest = (id) =>
    axios.delete(`/users/${id}`);
