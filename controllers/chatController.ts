import { Request, Response } from "express";
import { db } from "../config/db";
import {
  chat_participants,
  chats,
  createChatSchema,
  inviteUsersToChatSchema,
  messages,
  NewChat,
  NewChatParticipant,
  sendMessageSchema,
  updateChatSchema,
  userRolesEnum,
  users,
} from "../config/schema";
import { and, asc, desc, eq, sql, SQLWrapper } from "drizzle-orm";
import { APIResponse } from "../utils/general";
import { defaultChatPhoto, httpStatus } from "../utils/constants";
import { asyncWrapper } from "../utils/general";

export const getAllChats = asyncWrapper(async (req: Request, res: Response) => {
  const currentUser = res.locals.user;
  const { s } = req.query;

  const searchValue = (s as string) || "";

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
    .where(
      and(
        eq(chat_participants.userId, currentUser.id),
        sql`lower(${chats.name}) LIKE ${`%${searchValue.toLowerCase()}%`}`
      )
    )
    .orderBy(desc(sql`COALESCE(${messages.createdAt}, ${chats.createdAt})`));

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
    const newChatSchema = createChatSchema.safeParse(req.body);

    if (!newChatSchema.success) {
      return APIResponse(
        res,
        httpStatus.BadRequest.code,
        "Validation error",
        newChatSchema.error
      );
    }

    const { name, users: usersWhoToAdd } = newChatSchema.data;

    if (usersWhoToAdd.length == 1) {
      const userToCreateChatWith = await db
        .select({ name: users.name, avatar: users.avatar })
        .from(users)
        .where(eq(usersWhoToAdd[0] as any, users.id));

      if (userToCreateChatWith.length <= 0)
        return APIResponse(
          res,
          httpStatus.NotFound.code,
          "User with provided id not found"
        );

      const chatName = userToCreateChatWith[0].name;
      const chatPhoto = userToCreateChatWith[0].avatar || defaultChatPhoto;

      const chat = await db
        .insert(chats)
        .values({ name: chatName, photo: chatPhoto })
        .returning();

      const chatParticipants: NewChatParticipant[] = [
        {
          chatId: chat[0].id,
          userId: currentUser.id,
          role: "admin",
        },
        {
          chatId: chat[0].id,
          userId: usersWhoToAdd[0],
          role: "admin",
        },
      ];

      await db.insert(chat_participants).values(chatParticipants);
    } else {
      if (!name)
        return APIResponse(
          res,
          httpStatus.BadRequest.code,
          "You should specify a name to create a group chat"
        );

      const chat = await db
        .insert(chats)
        .values({ name, photo: defaultChatPhoto, isGroup: true })
        .returning();

      const chatParticipantsToAdd = usersWhoToAdd.map((userId) => {
        const newUser: NewChatParticipant = {
          chatId: chat[0].id,
          userId: userId,
          role: "user",
        };

        return newUser;
      });

      const currentUserToAdd: NewChatParticipant = {
        chatId: chat[0].id,
        userId: currentUser.id,
        role: "admin",
      };

      chatParticipantsToAdd.push(currentUserToAdd);

      await db.insert(chat_participants).values(chatParticipantsToAdd);
    }

    return APIResponse(
      res,
      httpStatus.Created.code,
      httpStatus.Created.message
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

    return APIResponse(
      res,
      httpStatus.Deleted.code,
      "Chat deleted successfully"
    );
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

export const getChatInfo = asyncWrapper(async (req: Request, res: Response) => {
  const currentUser = res.locals.user;
  const { chatId } = req.params;

  if (!chatId) {
    return APIResponse(res, httpStatus.BadRequest.code, "Chat id is required");
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
      photo: chats.photo,
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
  });
});

export const getChatMessages = asyncWrapper(
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

    const chatMessages = await db
      .select({
        id: messages.id,
        content: messages.content,
        messageType: messages.messageType,
        createdAt: messages.createdAt,
        senderId: messages.senderId,
        senderAvatar: users.avatar,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.chatId, chatIdNumber))
      .orderBy(asc(messages.createdAt));

    return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message, {
      messages: chatMessages,
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

  const createdMessage = await db
    .insert(messages)
    .values(newMessage)
    .returning();

  return APIResponse(res, httpStatus.Created.code, "Message created", {
    message: createdMessage[0],
  });
});
