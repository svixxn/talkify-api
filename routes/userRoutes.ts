import express from "express";
import {
  getAllUsers,
  getCurrentUser,
  getUserBySlug,
  getUsersForCreateChat,
  getUsersForSearch,
} from "../controllers/userController";

import { signIn, signUp } from "../controllers/authController";
import { checkAuth } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/sign-in", signIn);

router.get("/", getAllUsers);

router.post("/", signUp);

router.get("/me", checkAuth, getCurrentUser);

router.get("/search", checkAuth, getUsersForSearch);

router.get("/searchToCreateChat", checkAuth, getUsersForCreateChat);

router.get("/:slug", getUserBySlug);

export default router;
