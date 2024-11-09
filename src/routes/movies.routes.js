import Router from "express-promise-router";
import {
    getAllMovies,
    updateMovie
} from "../controllers/movies.controller.js";
import { isAuth, isAdmin } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validate.middleware.js";
import { updateMovieSchema } from "../schemas/movie.schema.js";

const router = Router();

router.get("/movies", isAuth, isAdmin, getAllMovies);
router.put("/movies/:id", isAuth, isAdmin, validateSchema(updateMovieSchema), updateMovie);

export default router;