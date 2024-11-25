import Router from "express-promise-router";
import { updateUserConnections, getUserConnections } from "../controllers/connections.controller.js";
import { isAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/connections/update", isAuth, updateUserConnections);
router.get("/connections", isAuth, getUserConnections);

export default router;