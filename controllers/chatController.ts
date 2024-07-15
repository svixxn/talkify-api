import { Request, Response } from "express";
import { db } from "../config/db";
import {
  chat_participants,
  chats,
  insertChatSchema,
  NewChat,
  updateChatSchema,
  userRolesEnum,
} from "../config/schema";
import { and, eq, sql, SQLWrapper } from "drizzle-orm";
import { APIResponse } from "../utils/general";
import { httpStatus } from "../utils/constants";

export async function getAllChats(req: Request, res: Response) {
  const currentUser = res.locals.user;

  const userChats = await db
    .select({
      chatId: chats.id,
      name: chats.name,
      isGroup: chats.isGroup,
      isDeleted: chats.isDeleted,
    })
    .from(chats)
    .where(eq(chat_participants.userId, currentUser.id))
    .leftJoin(chat_participants, eq(chats.id, chat_participants.chatId));

  return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message, {
    chats: userChats,
  });
}

export const createChat = async (req: Request, res: Response) => {
  const currentUser = res.locals.user;

  if (!currentUser) {
    return APIResponse(
      res,
      httpStatus.Unauthorized.code,
      httpStatus.Unauthorized.message
    );
  }

  try {
    const newChatSchema = insertChatSchema.safeParse(req.body);

    if (!newChatSchema.success) {
      return APIResponse(
        res,
        httpStatus.BadRequest.code,
        "Validation error",
        newChatSchema.error
      );
    }

    const newChat = newChatSchema.data;

    const chat = await db.insert(chats).values(newChat).returning();

    await db.insert(chat_participants).values({
      chatId: chat[0].id,
      userId: currentUser.id,
      role: "admin",
    });

    return APIResponse(
      res,
      httpStatus.Created.code,
      httpStatus.Created.message,
      {
        chat: chat[0].id,
      }
    );
  } catch (err: any) {
    return APIResponse(
      res,
      400,
      "There was an issue during creating a new chat",
      err
    );
  }
};

export const updateChat = async (req: Request, res: Response) => {
  const currentUser = res.locals.user;

  if (!currentUser) {
    return APIResponse(
      res,
      httpStatus.Unauthorized.code,
      httpStatus.Unauthorized.message
    );
  }

  const { id } = req.params;

  if (!id) {
    return APIResponse(res, httpStatus.BadRequest.code, "Chat id is required");
  }

  const updateSchema = updateChatSchema.safeParse(req.body);

  if (!updateSchema.success) {
    return APIResponse(
      res,
      httpStatus.BadRequest.code,
      "Validation error",
      updateSchema.error
    );
  }

  const chatIdNumber = parseInt(id);

  const result = await db
    .select()
    .from(chats)
    .where(eq(chats.id, chatIdNumber))
    .leftJoin(chat_participants, eq(chats.id, chat_participants.chatId));

  if (result.length === 0) {
    return APIResponse(
      res,
      httpStatus.NotFound.code,
      httpStatus.NotFound.message
    );
  }

  if (result[0].chat_participants?.role !== "admin") {
    return APIResponse(
      res,
      httpStatus.Forbidden.code,
      httpStatus.Forbidden.message
    );
  }

  const updatedChat = await db
    .update(chats)
    .set(updateSchema.data)
    .where(eq(chats.id, chatIdNumber))
    .returning();

  return APIResponse(
    res,
    httpStatus.OK.code,
    httpStatus.OK.message,
    updatedChat
  );
};
