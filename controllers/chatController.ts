import { Request, Response } from "express";
import { db } from "../config/db";
import {
  chat_participants,
  chats,
  insertChatSchema,
  inviteUsersToChatSchema,
  messages,
  NewChat,
  sendMessageSchema,
  updateChatSchema,
  userRolesEnum,
  users,
} from "../config/schema";
import { and, asc, desc, eq, sql, SQLWrapper } from "drizzle-orm";
import { APIResponse } from "../utils/general";
import { httpStatus } from "../utils/constants";
import { asyncWrapper } from "../utils/general";

export const getAllChats = asyncWrapper(async (req: Request, res: Response) => {
  const currentUser = res.locals.user;

  const userChats = await db
    .select({
      chatId: chats.id,
      name: chats.name,
      photo: chats.photo,
      lastMessage: messages.content,
      lastMessageDate: messages.createdAt,
    })
    .from(chats)
    .leftJoin(chat_participants, eq(chats.id, chat_participants.chatId))
    .leftJoin(
      messages,
      and(
        eq(messages.chatId, chats.id),
        eq(
          messages.id,
          db
            .select({ id: messages.id })
            .from(messages)
            .where(eq(messages.chatId, chats.id))
            .orderBy(desc(messages.createdAt))
            .limit(1)
        )
      )
    )
    .where(eq(chat_participants.userId, currentUser.id))
    .orderBy(desc(messages.createdAt));

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

export const getChatInfoWithMessages = asyncWrapper(
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

    const chatParticipant = await db
      .select({ id: chat_participants.id })
      .from(chat_participants)
      .where(
        and(
          eq(chat_participants.chatId, chatIdNumber),
          eq(chat_participants.userId, currentUser.id)
        )
      );

    if (chatParticipant.length === 0) {
      return APIResponse(
        res,
        httpStatus.Forbidden.code,
        "User is not belong to this chat"
      );
    }

    const chatInfo = await db
      .select({
        name: chats.name,
        participants: sql`ARRAY_AGG(${chat_participants.userId})`.as(
          "participants"
        ),
      })
      .from(chats)
      .leftJoin(chat_participants, eq(chat_participants.chatId, chats.id))
      .where(eq(chats.id, chatIdNumber))
      .groupBy(chats.id);

    const participantsInfo = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
      })
      .from(users)
      .where(sql`${users.id} in ${chatInfo[0].participants}`);

    chatInfo[0].participants = participantsInfo;

    const chatMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatIdNumber))
      .orderBy(asc(messages.createdAt));

    return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message, {
      chatInfo: chatInfo[0],
      chatMessages,
    });
  }
);

export const sendMessage = asyncWrapper(async (req: Request, res: Response) => {
  const currentUser = res.locals.user;

  const { chatId } = req.params;

  if (!chatId) {
    return APIResponse(res, httpStatus.BadRequest.code, "Chat id is required");
  }

  const sendMessageParseResult = sendMessageSchema.safeParse(req.body);

  if (!sendMessageParseResult.success) {
    return APIResponse(
      res,
      httpStatus.BadRequest.code,
      "Validation error",
      sendMessageParseResult.error
    );
  }

  const chatIdNumber = parseInt(chatId);

  const chatParticipent = await db
    .select({ id: chat_participants.id })
    .from(chat_participants)
    .where(
      and(
        eq(chat_participants.chatId, chatIdNumber),
        eq(chat_participants.userId, currentUser.id)
      )
    );

  if (chatParticipent.length === 0) {
    return APIResponse(res, httpStatus.NotFound.code, "Chat not found");
  }

  const newMessage = {
    ...sendMessageParseResult.data,
    chatId: chatIdNumber,
    senderId: currentUser.id,
  };

  await db.insert(messages).values(newMessage);

  return APIResponse(
    res,
    httpStatus.Created.code,
    "Message created",
    newMessage
  );
});
