import express from "express";
import {
  getAllUsers,
  createUser,
  getUserBySlug,
} from "../controllers/userController";

const router = express.Router();

router.get("/", getAllUsers);

router.post("/", createUser);

router.get("/:slug", getUserBySlug);

export default router;
