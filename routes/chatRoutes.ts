import express from "express";

import { checkAuth } from "../middlewares/authMiddleware";
import {
  getAllChats,
  createChat,
  updateChat,
  addUserToChat,
  getChatInfoWithMessages,
  sendMessage,
  deleteChatFull,
} from "../controllers/chatController";

const router = express.Router();

router.use(checkAuth);

router.route("/").get(getAllChats).post(createChat);

router
  .route("/:chatId")
  .get(getChatInfoWithMessages)
  .post(sendMessage)
  .patch(updateChat)
  .delete(deleteChatFull);

router.post("/:chatId/invite", addUserToChat);

export default router;
