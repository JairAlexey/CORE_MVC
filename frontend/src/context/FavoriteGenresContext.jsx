import { createContext, useContext, useState, useEffect } from "react";
import { getFavoriteGenresRequest, generateFavoriteGenresRequest } from "../api/users.api";
import { getAllGenres } from "../utils/genres";

const FavoriteGenresContext = createContext();

export const useFavoriteGenres = () => {
    const context = useContext(FavoriteGenresContext);
    if (!context) {
        throw new Error("useFavoriteGenres debe estar dentro del proveedor FavoriteGenresProvider");
    }
    return context;
};

export const FavoriteGenresProvider = ({ children }) => {
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [genres, setGenres] = useState([]);

    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const response = await getFavoriteGenresRequest();
                setSelectedGenres(response.data.favoriteGenres);
            } catch (error) {
                console.error("Error al obtener géneros favoritos:", error);
            }
        };

        fetchGenres();
        setGenres(getAllGenres());
    }, []);

    const updateFavoriteGenres = async (favoriteGenres) => {
        try {
            await generateFavoriteGenresRequest(favoriteGenres);
            alert("Géneros favoritos actualizados");
        } catch (error) {
            console.error("Error al actualizar géneros favoritos:", error);
        }
    };

    return (
        <FavoriteGenresContext.Provider value={{ selectedGenres, setSelectedGenres, genres, updateFavoriteGenres }}>
            {children}
        </FavoriteGenresContext.Provider>
    );
};
