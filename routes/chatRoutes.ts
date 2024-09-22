import express from "express";

import { checkAuth } from "../middlewares/authMiddleware";
import {
  getAllChats,
  createChat,
  updateChat,
  addUserToChat,
  getChatInfo,
  sendMessage,
  deleteChatFull,
  getChatMessages,
} from "../controllers/chatController";

const router = express.Router();

router.use(checkAuth);

router.route("/").get(getAllChats).post(createChat);

router
  .route("/:chatId")
  .get(getChatInfo)
  .patch(updateChat)
  .delete(deleteChatFull);

router.route("/:chatId/messages").get(getChatMessages).post(sendMessage);

router.post("/:chatId/invite", addUserToChat);

export default router;
