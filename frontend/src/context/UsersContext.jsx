import { createContext, useState, useContext } from "react";
import {
    getAllUsersRequest,
    updateUserRequest,
    deleteUserRequest
} from "../api/users.api";

const UsersContext = createContext();

export const useUsers = () => {
    const context = useContext(UsersContext);
    if (!context) {
        throw new Error("useUsers debe estar dentro del proveedor UsersProvider");
    }
    return context;
};

export const UsersProvider = ({ children }) => {
    const [users, setUsers] = useState([]);
    const [errors, setErrors] = useState([]);

    const loadUsers = async () => {
        try {
            const res = await getAllUsersRequest();
            setUsers(res.data);
        } catch (error) {
            setErrors([error.response?.data?.message || "Error al cargar usuarios"]);
        }
    };

    const updateUser = async (id, userData) => {
        try {
            const res = await updateUserRequest(id, userData);
            setUsers(users.map(user => user.id === id ? res.data : user));
            return res.data;
        } catch (error) {
            setErrors([error.response?.data?.message || "Error al actualizar usuario"]);
        }
    };

    const deleteUser = async (id) => {
        try {
            const res = await deleteUserRequest(id);
            if (res.status === 204) {
                setUsers(users.filter(user => user.id !== id));
            }
        } catch (error) {
            setErrors([error.response?.data?.message || "Error al eliminar usuario"]);
        }
    };

    return (
        <UsersContext.Provider
            value={{
                users,
                loadUsers,
                updateUser,
                deleteUser,
                errors
            }}
        >
            {children}
        </UsersContext.Provider>
    );
}; 