import express from "express";
import { getAllUsers, getUserBySlug } from "../controllers/userController";

import { signUp } from "../controllers/authController";

const router = express.Router();

router.get("/", getAllUsers);

router.post("/", signUp);

router.get("/:slug", getUserBySlug);

export default router;
