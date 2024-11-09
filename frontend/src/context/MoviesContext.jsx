import { createContext, useState, useContext, useEffect } from "react";
import { getAllMoviesRequest, updateMovieRequest } from "../api/movies.api";

const MoviesContext = createContext();

export const useMovies = () => {
    const context = useContext(MoviesContext);
    if (!context) {
        throw new Error("useMovies debe estar dentro del proveedor MoviesProvider");
    }
    return context;
};

export const MoviesProvider = ({ children }) => {
    const [movies, setMovies] = useState([]);
    const [errors, setErrors] = useState([]);

    const loadMovies = async () => {
        try {
            const res = await getAllMoviesRequest();
            setMovies(res.data);
        } catch (error) {
            setErrors([error.response?.data?.message || "Error al cargar películas"]);
        }
    };

    const updateMovie = async (id, movieData) => {
        try {
            const res = await updateMovieRequest(id, movieData);
            setMovies(movies.map(movie => 
                movie.id === id ? res.data : movie
            ));
            return res.data;
        } catch (error) {
            setErrors([error.response?.data?.message || "Error al actualizar la película"]);
        }
    };

    useEffect(() => {
        loadMovies();
    }, []);

    return (
        <MoviesContext.Provider value={{ movies, loadMovies, updateMovie, errors }}>
            {children}
        </MoviesContext.Provider>
    );
};