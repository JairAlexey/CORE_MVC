import { createContext, useState, useContext, useEffect } from "react";
import { 
    getAllMoviesRequest, 
    updateMovieRequest, 
    deleteMovieRequest, 
    createMovieRequest,
    markMovieAsWatchedRequest,
    unmarkMovieAsWatchedRequest,
    commentAndRateMovieRequest,
    getMovieDetailsRequest
} from "../api/movies.api";

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

    const loadMovies = async (page = 1, category = 'popular', searchTerm = '') => {
        try {
            const res = await getAllMoviesRequest(page, category, searchTerm);
            if (res.data && res.data.movies) {
                setMovies(res.data.movies);
                return res.data;
            }
            return null;
        } catch (error) {
            setErrors([error.response?.data?.message || "Error al cargar películas"]);
            throw error;
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

    const markMovieAsWatched = async (movieId) => {
        try {
            const res = await markMovieAsWatchedRequest(movieId);
            setMovies(prevMovies => 
                prevMovies.map(movie => 
                    movie.id === parseInt(movieId) 
                        ? { ...movie, watched: true } 
                        : movie
                )
            );
            return res.data;
        } catch (error) {
            setErrors([error.response?.data?.message || "Error al marcar la película como vista"]);
            throw error;
        }
    };
    
    const unmarkMovieAsWatched = async (movieId) => {
        try {
            const res = await unmarkMovieAsWatchedRequest(movieId);
            setMovies(prevMovies => 
                prevMovies.map(movie => 
                    movie.id === parseInt(movieId) 
                        ? { ...movie, watched: false, commented: false, rating: null } 
                        : movie
                )
            );
            return res.data;
        } catch (error) {
            setErrors([error.response?.data?.message || "Error al desmarcar la película como vista"]);
            throw error;
        }
    };
    
    const commentAndRateMovie = async (movieId, comment, rating) => {
        try {
            const res = await commentAndRateMovieRequest(movieId, comment, rating);
            setMovies(prevMovies => 
                prevMovies.map(movie => 
                    movie.id === parseInt(movieId) 
                        ? { ...movie, commented: true, rating } 
                        : movie
                )
            );
            return res.data;
        } catch (error) {
            setErrors([error.response?.data?.message || "Error al comentar o valorar la película"]);
            throw error;
        }
    };

    const getMovieDetails = async (movieId) => {
        try {
            const res = await getMovieDetailsRequest(movieId);
            return res.data;
        } catch (error) {
            setErrors([error.response?.data?.message || "Error al obtener detalles de la película"]);
            throw error;
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
            setMovies,
            setSuccessMessage,
            loadMovies,
            createMovie,
            updateMovie,
            deleteMovie,
            markMovieAsWatched,
            unmarkMovieAsWatched,
            commentAndRateMovie,
            getMovieDetails
        }}>
            {children}
        </MoviesContext.Provider>
    );
};