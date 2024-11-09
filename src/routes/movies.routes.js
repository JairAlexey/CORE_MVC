import Router from "express-promise-router";
import {
    getAllMovies,
    getMovie,
    createMovie,
    updateMovie,
    deleteMovie,
} from "../controllers/movies.controller.js";
import { isAuth, isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/movies", isAuth, isAdmin, getAllMovies);
router.get("/movies/:id", isAuth, isAdmin, getMovie);
router.post("/movies", isAuth, isAdmin, createMovie);
router.put("/movies/:id", isAuth, isAdmin, updateMovie);
router.delete("/movies/:id", isAuth, isAdmin, deleteMovie);

export default router;