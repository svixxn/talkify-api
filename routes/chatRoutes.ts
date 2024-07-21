import express from "express";

import { checkAuth } from "../middlewares/authMiddleware";
import {
  getAllChats,
  createChat,
  updateChat,
  addUserToChat,
} from "../controllers/chatController";

const router = express.Router();

router.get("/", checkAuth, getAllChats);

router.post("/", checkAuth, createChat);

router.patch("/:chatId", checkAuth, updateChat);

router.post("/:chatId/invite", checkAuth, addUserToChat);

export default router;
