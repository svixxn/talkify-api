import express from "express";

import { checkAuth } from "../middlewares/authMiddleware";
import {
  getAllChats,
  createChat,
  updateChat,
  addUsersToChat,
  getChatInfo,
  sendMessage,
  deleteChatFull,
  getChatMessages,
  deleteChatHistory,
  deleteChatMessage,
  removeUsersFromChat,
  pinMessage,
} from "../controllers/chatController";

import { checkAvailability } from "../middlewares/roleMiddleware";

const router = express.Router();

router.use(checkAuth);

router.route("/").get(getAllChats).post(createChat);

router
  .route("/:chatId")
  .get(checkAvailability(), getChatInfo)
  .patch(checkAvailability(["admin", "moderator"]), updateChat)
  .delete(checkAvailability(["admin"]), deleteChatFull);

router
  .route("/:chatId/messages")
  .get(checkAvailability(), getChatMessages)
  .post(checkAvailability(), sendMessage)
  .delete(checkAvailability(["admin"]), deleteChatHistory);

router
  .route("/:chatId/messages/:messageId")
  .delete(checkAvailability(), deleteChatMessage);

router.route("/:chatId/messages/:messageId/pin").post(pinMessage);

router
  .route("/:chatId/members")
  .patch(checkAvailability(["admin", "moderator"]), addUsersToChat)
  .post(checkAvailability(["admin", "moderator"]), removeUsersFromChat);

export default router;
