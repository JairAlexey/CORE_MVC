import { createContext, useState, useContext, useEffect } from "react";
import { getAllMoviesRequest, updateMovieRequest, deleteMovieRequest, createMovieRequest } from "../api/movies.api";

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
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        if (errors.length > 0) {
            const timer = setTimeout(() => {
                setErrors([]);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [errors]);

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
            const errorMessage = error.response?.data?.message || "Error al actualizar la película";
            setErrors([errorMessage]);
            throw error; 
        }
    };

    const deleteMovie = async (id) => {
        try {
            await deleteMovieRequest(id);
            setMovies(movies.filter(movie => movie.id !== id));
        } catch (error) {
            setErrors([error.response?.data?.message || "Error al eliminar la película"]);
        }
    };

    const createMovie = async (movieData) => {
        try {
            const res = await createMovieRequest(movieData);
            setMovies([...movies, res.data]);
            setSuccessMessage("¡Película creada exitosamente!");
            return res.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Error al crear la película";
            setErrors([errorMessage]);
            throw error; // Importante: re-lanzar el error para manejarlo en el componente
        }
    };

    useEffect(() => {
        loadMovies();
    }, []);

    return (
        <MoviesContext.Provider value={{
            movies,
            errors,
            successMessage,
            setSuccessMessage,
            loadMovies,
            createMovie,
            updateMovie,
            deleteMovie
        }}>
            {children}
        </MoviesContext.Provider>
    );
};