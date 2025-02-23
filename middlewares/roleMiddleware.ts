import { NextFunction, Request, Response } from "express";
import { db } from "../config/db";
import {
  chat_participants,
  chats,
  UserRole,
  userRolesEnum,
} from "../config/schema";
import { and, eq } from "drizzle-orm";
import { APIResponse } from "../utils/general";
import { httpStatus } from "../utils/constants";

export const checkAvailability = (roles?: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const currentUser = res.locals.user;
    const { chatId } = req.params;

    if (!chatId) {
      return APIResponse(
        res,
        httpStatus.BadRequest.code,
        "Chat id is required"
      );
    }

    const chatIdNumber = Number(chatId);

    const chat = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatIdNumber));

    if (chat.length === 0) {
      return APIResponse(
        res,
        httpStatus.NotFound.code,
        "Chat with provided id does not exist"
      );
    }

    const chatParticipant = await db
      .select()
      .from(chat_participants)
      .where(
        and(
          eq(chat_participants.userId, currentUser.id),
          eq(chat_participants.chatId, chatIdNumber)
        )
      );

    if (chatParticipant.length === 0) {
      return APIResponse(
        res,
        httpStatus.Forbidden.code,
        "You are not a participant of this chat"
      );
    }

    if (roles && !roles.includes(chatParticipant[0].role!)) {
      return APIResponse(
        res,
        httpStatus.Forbidden.code,
        "You do not have permission to perform this action"
      );
    }

    next();
  };
};
