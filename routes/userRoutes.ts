import express from "express";
import {
  getAllUsers,
  getCurrentUser,
  getUserById,
  getUsersForCreateChat,
  getUsersForSearch,
} from "../controllers/userController";

import { signIn, signUp } from "../controllers/authController";
import { checkAuth } from "../middlewares/authMiddleware";

const router = express.Router();

router.route("/").get(checkAuth, getAllUsers).post(signUp);

router.get("/me", checkAuth, getCurrentUser);

router.get("/searchToCreateChat", checkAuth, getUsersForCreateChat);

router.post("/search", checkAuth, getUsersForSearch);

router.route("/:id").get(checkAuth, getUserById);

router.post("/sign-in", signIn);

export default router;
