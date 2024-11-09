import Router from "express-promise-router";
import { isAuth, isAdmin } from "../middlewares/auth.middleware.js";
import { getUsers, updateUser, deleteUser } from "../controllers/admin.controller.js";

const router = Router();

router.get("/users", isAuth, isAdmin, getUsers);
router.put("/users/:id", isAuth, isAdmin, updateUser);
router.delete("/users/:id", isAuth, isAdmin, deleteUser);

export default router; 