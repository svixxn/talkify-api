import { Request, Response } from "express";
import { db } from "../config/db";
import {
  chat_participants,
  chats,
  insertChatSchema,
  inviteUsersToChatSchema,
  NewChat,
  updateChatSchema,
  userRolesEnum,
} from "../config/schema";
import { and, eq, sql, SQLWrapper } from "drizzle-orm";
import { APIResponse } from "../utils/general";
import { httpStatus } from "../utils/constants";
import { asyncWrapper } from "../utils/general";

export const getAllChats = asyncWrapper(async (req: Request, res: Response) => {
  const currentUser = res.locals.user;

  const userChats = await db
    .select({
      chatId: chats.id,
      name: chats.name,
      isGroup: chats.isGroup,
      isDeleted: chats.isDeleted,
      chat_participants: chat_participants,
    })
    .from(chats)
    .where(eq(chat_participants.userId, currentUser.id))
    .leftJoin(chat_participants, eq(chats.id, chat_participants.chatId));

  return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message, {
    userChats,
  });
});

export const createChat = asyncWrapper(async (req: Request, res: Response) => {
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
});

export const updateChat = asyncWrapper(async (req: Request, res: Response) => {
  const currentUser = res.locals.user;
  const { chatId } = req.params;

  if (!chatId) {
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

  const chatIdNumber = parseInt(chatId);

  const result = await db
    .select()
    .from(chats)
    .where(
      and(
        eq(chats.id, chatIdNumber),
        eq(chat_participants.userId, currentUser.id)
      )
    )
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
});

export const deleteChatFull = asyncWrapper(
  async (req: Request, res: Response) => {
    const currentUser = res.locals.user;
    const { chatId } = req.params;

    if (!chatId) {
      return APIResponse(
        res,
        httpStatus.BadRequest.code,
        "Chat id is required"
      );
    }

    const chatIdNumber = parseInt(chatId);

    const result = await db
      .select()
      .from(chats)
      .where(
        and(
          eq(chats.id, chatIdNumber),
          eq(chat_participants.userId, currentUser.id)
        )
      )
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

    await db.delete(chats).where(eq(chats.id, chatIdNumber));
  }
);

export const addUserToChat = asyncWrapper(
  async (req: Request, res: Response) => {
    const currentUser = res.locals.user;
    const { chatId } = req.params;

    if (!chatId) {
      return APIResponse(
        res,
        httpStatus.BadRequest.code,
        "Chat id is required"
      );
    }

    const inviteUsersSchema = inviteUsersToChatSchema.safeParse(req.body);

    if (!inviteUsersSchema.success) {
      return APIResponse(
        res,
        httpStatus.BadRequest.code,
        "Validation error",
        inviteUsersSchema.error
      );
    }

    const chatIdNumber = parseInt(chatId);

    const result = await db
      .select()
      .from(chats)
      .where(
        and(
          eq(chats.id, chatIdNumber),
          eq(chat_participants.userId, currentUser.id)
        )
      )
      .leftJoin(chat_participants, eq(chats.id, chat_participants.chatId));

    if (result.length === 0) {
      return APIResponse(
        res,
        httpStatus.NotFound.code,
        httpStatus.NotFound.message
      );
    }

    if (
      result[0].chat_participants?.role !== "admin" &&
      result[0].chat_participants?.role !== "moderator"
    ) {
      return APIResponse(
        res,
        httpStatus.Forbidden.code,
        httpStatus.Forbidden.message
      );
    }

    const users = inviteUsersSchema.data.userIds;

    const usersToInsert = users.map((userId) => {
      return {
        chatId: chatIdNumber,
        userId,
      };
    });

    await db.insert(chat_participants).values(usersToInsert);

    return APIResponse(res, httpStatus.OK.code, "Users added to chat");
  }
);
