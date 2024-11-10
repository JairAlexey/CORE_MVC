import Router from "express-promise-router";
import {
    getAllMovies,
    updateMovie,
    createMovie,
    deleteMovie
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

export default router;