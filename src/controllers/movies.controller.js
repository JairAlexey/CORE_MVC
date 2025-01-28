import { MovieService, UserMovieService } from '../services/MovieService.js';
import { pool } from "../db.js";

// Inyección de dependencias a través del constructor
class MovieController {
    constructor(movieService, userMovieService) {
        this.movieService = movieService;
        this.userMovieService = userMovieService;
    }

    getAllMovies = async (req, res) => {
        try {
            const userId = req.userId;
            const page = parseInt(req.query.page) || 1;
            const category = req.query.category || 'popular';
            const searchTerm = req.query.search || '';

            const result = await this.movieService.getAllMovies({
                userId,
                page,
                category,
                searchTerm
            });

            return res.json(result);
        } catch (error) {
            console.error('Error en getAllMovies:', error);
            return res.status(500).json({
                message: "Error al obtener películas",
                error: error.message
            });
        }
    }

    createMovie = async (req, res) => {
        try {
            const movie = await this.movieService.createMovie(req.body);
            return res.status(201).json(movie);
        } catch (error) {
            return res.status(500).json({
                message: error.message
            });
        }
    }

    updateMovie = async (req, res) => {
        try {
            const { id } = req.params;
            const movie = await this.movieService.updateMovie(id, req.body);
            return res.json(movie);
        } catch (error) {
            return res.status(500).json({
                message: "Error al actualizar la película",
                error: error.message
            });
        }
    }

    deleteMovie = async (req, res) => {
        try {
            const { id } = req.params;
            await this.movieService.deleteMovie(id);
            return res.json({ message: "Película eliminada exitosamente" });
        } catch (error) {
            return res.status(500).json({
                message: "Error al eliminar la película",
                error: error.message
            });
        }
    }

    markMovieAsWatched = async (req, res) => {
        try {
            const { movieId } = req.params;
            const userId = req.userId;
            const result = await this.userMovieService.markAsWatched(userId, movieId);
            return res.json(result);
        } catch (error) {
            return res.status(500).json({
                message: "Error al marcar la película como vista",
                error: error.message
            });
        }
    }

    unmarkMovieAsWatched = async (req, res) => {
        try {
            const { movieId } = req.params;
            const userId = req.userId;
            const result = await this.userMovieService.unmarkAsWatched(userId, movieId);
            return res.json(result);
        } catch (error) {
            return res.status(500).json({
                message: "Error al desmarcar la película como vista",
                error: error.message
            });
        }
    }

    commentAndRateMovie = async (req, res) => {
        try {
            const { movieId } = req.params;
            const { comment, rating } = req.body;
            const userId = req.userId;
            const result = await this.userMovieService.commentAndRate(userId, movieId, comment, rating);
            return res.json(result);
        } catch (error) {
            return res.status(500).json({
                message: "Error al comentar o valorar la película",
                error: error.message
            });
        }
    }

    getMovieDetails = async (req, res) => {
        try {
            const { movieId } = req.params;
            const result = await this.movieService.getMovieDetails(movieId);
            return res.json(result);
        } catch (error) {
            return res.status(500).json({
                message: "Error al obtener detalles de la película",
                error: error.message
            });
        }
    }
}

// Instanciación de servicios y controlador
const movieService = new MovieService(pool);
const userMovieService = new UserMovieService(pool);
const movieController = new MovieController(movieService, userMovieService);

// Exportación de métodos del controlador
export const {
    getAllMovies,
    createMovie,
    updateMovie,
    deleteMovie,
    markMovieAsWatched,
    unmarkMovieAsWatched,
    commentAndRateMovie,
    getMovieDetails
} = movieController;