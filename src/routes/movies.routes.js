import Router from "express-promise-router";
import {
    getAllMovies,
    updateMovie,
    createMovie,
    deleteMovie,
    markMovieAsWatched, 
    unmarkMovieAsWatched, 
    commentAndRateMovie,
    getMovieDetails
} from "../controllers/movies.controller.js";
import { isAuth, isAdmin } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validate.middleware.js";
import { updateMovieSchema, createMovieSchema } from "../schemas/movie.schema.js";

const router = Router();

// Ruta para usuarios normales (solo necesita autenticación)
router.get("/user-movies", isAuth, getAllMovies);

// Rutas para administradores
router.get("/movies", isAuth, isAdmin, getAllMovies);
router.put("/movies/:id", isAuth, isAdmin, validateSchema(updateMovieSchema), updateMovie);
router.post("/movies", isAuth, isAdmin, validateSchema(createMovieSchema), createMovie);
router.delete("/movies/:id", isAuth, isAdmin, deleteMovie);

// Rutas para marcar y desmarcar películas como vistas
router.post("/movies/:movieId/watched", isAuth, markMovieAsWatched);
router.delete("/movies/:movieId/watched", isAuth, unmarkMovieAsWatched);
router.post("/movies/:movieId/comment", isAuth, commentAndRateMovie);

// Ruta para obtener los detalles de una película
router.get("/movies/:movieId/details", isAuth, getMovieDetails);



export default router;