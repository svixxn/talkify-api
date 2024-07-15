import express from "express";

import { checkAuth } from "../middlewares/authMiddleware";
import {
  getAllChats,
  createChat,
  updateChat,
} from "../controllers/chatController";

const router = express.Router();

router.get("/", checkAuth, getAllChats);

router.post("/", checkAuth, createChat);

router.patch("/:id", checkAuth, updateChat);

export default router;
