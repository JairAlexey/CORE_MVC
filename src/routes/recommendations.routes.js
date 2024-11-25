import Router from "express-promise-router";
import { 
    generateRecommendations, 
    getUserRecommendations 
} from "../controllers/recommendations.controller.js";
import { isAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/recommendations/generate", isAuth, generateRecommendations);
router.get("/recommendations", isAuth, getUserRecommendations);

export default router;