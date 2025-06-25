import Router from "express-promise-router";
import { 
    generateRecommendations, 
    getUserRecommendations,
    getKNNRecommendations,
    getSimilarMoviesKNN,
    getKNNStatus
} from "../controllers/recommendations.controller.js";
import { isAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/recommendations/generate", isAuth, generateRecommendations);
router.get("/recommendations", isAuth, getUserRecommendations);

// Hacer público el endpoint de status
router.get("/knn/status", getKNNStatus);

// Rutas protegidas
router.get("/recommendations/knn", isAuth, getKNNRecommendations);
router.get("/movies/:movieId/similar-knn", isAuth, getSimilarMoviesKNN);

export default router;