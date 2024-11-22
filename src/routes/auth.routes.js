import Router from "express-promise-router";
import {
  profile,
  signin,
  signout,
  signup,
  updateFavoriteGenres,
} from "../controllers/auth.controller.js";
import { isAuth } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validate.middleware.js";
import { signinSchema, signupSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post("/signin", validateSchema(signinSchema), signin);

router.post("/signup", validateSchema(signupSchema), signup);

router.post("/signout", signout);

router.get("/profile", isAuth, profile);

router.put("/users/favorite-genres", isAuth, updateFavoriteGenres);

export default router;
