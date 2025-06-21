import { createContext, useContext, useState, useEffect } from "react";
import { getFavoriteGenresRequest, generateFavoriteGenresRequest } from "../api/users.api";
import { getAllGenres } from "../utils/genres";
import { useAuth } from "../context/AuthContext";

const FavoriteGenresContext = createContext();

export const useFavoriteGenres = () => {
    const context = useContext(FavoriteGenresContext);
    if (!context) {
        throw new Error("useFavoriteGenres debe estar dentro del proveedor FavoriteGenresProvider");
    }
    return context;
};

export const FavoriteGenresProvider = ({ children }) => {
    const { user, updateUser } = useAuth(); 
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [genres, setGenres] = useState([]);
    const [errors, setErrors] = useState([]);

    const clearErrors = () => {
        setErrors([]);
    };

    useEffect(() => {
        const fetchGenres = async () => {
            try {
                if (user) { 
                    const response = await getFavoriteGenresRequest(); 
                    setSelectedGenres(response.data.favoriteGenres);
                } else {
                    setSelectedGenres([]);
                }
            } catch (error) {
                console.error("Error al obtener géneros favoritos:", error);
                setSelectedGenres([]);
            }
        };

        fetchGenres();
        setGenres(getAllGenres());
    }, [user]);

    const updateFavoriteGenres = async (favoriteGenres) => {
        try {
            console.log("Enviando géneros favoritos al backend:", favoriteGenres);
            const response = await generateFavoriteGenresRequest(favoriteGenres);
            console.log("Respuesta del backend:", response.data);
            // Actualizar el estado del usuario con los nuevos géneros favoritos
            updateUser(response.data);
            alert("Géneros favoritos actualizados");
        } catch (error) {
            console.error("Error al actualizar géneros favoritos:", error);
            setErrors(error.response?.data.errors || [error.response?.data.message]);
        }
    };

    return (
        <FavoriteGenresContext.Provider value={{
            selectedGenres,
            setSelectedGenres,
            genres,
            updateFavoriteGenres,
            errors,
            clearErrors,
        }}>
            {children}
        </FavoriteGenresContext.Provider>
    );
};