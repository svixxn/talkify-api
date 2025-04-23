import { Request, Response } from "express";
import { db } from "../config/db";
import {
  chat_participants,
  chats,
  createChatSchema,
  inviteUsersToChatSchema,
  messages,
  NewChatParticipant,
  removeUsersFromChatSchema,
  sendMessageSchema,
  updateChatMemberSchema,
  updateChatSchema,
  users,
} from "../config/schema";
import { and, asc, desc, eq, inArray, is, ne, sql } from "drizzle-orm";
import { APIResponse } from "../utils/general";
import { defaultChatPhoto, httpStatus } from "../utils/constants";
import { asyncWrapper } from "../utils/general";
import {
  formatSystemMessageForUsers,
  getChatParticipants,
  sortChatsByLastMessage,
} from "../utils/chat";
import { deleteMany } from "../utils/cloudinary";

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
      isGroup: chats.isGroup,
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
    );

  const privateChats = userChats.filter((chat) => !chat.isGroup);

  const privateChatsWithUpdatedNames = await Promise.all(
    privateChats.map(async (prChat) => {
      const participants = await db
        .select({
          chatId: chat_participants.chatId,
          userId: chat_participants.userId,
          photo: users.avatar,
          name: users.name,
        })
        .from(chat_participants)
        .where(
          and(
            eq(chat_participants.chatId, prChat.chatId),
            ne(chat_participants.userId, currentUser.id)
          )
        )
        .leftJoin(users, eq(chat_participants.userId, users.id));

      if (participants.length > 0) {
        return {
          ...prChat,
          name: participants[0].name,
          photo: participants[0].photo,
        };
      }

      return prChat;
    })
  );

  const groupChats = userChats.filter((chat) => chat.isGroup);

  const finalChats = sortChatsByLastMessage([
    ...groupChats,
    ...privateChatsWithUpdatedNames,
  ]);

  return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message, {
    userChats: finalChats,
  });
});

export const createChat = asyncWrapper(async (req: Request, res: Response) => {
  const currentUser = res.locals.user;

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

    let createdChatId: number;

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
      createdChatId = chat[0].id;
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

      createdChatId = chat[0].id;
      await db.insert(chat_participants).values(chatParticipantsToAdd);
    }

    return APIResponse(
      res,
      httpStatus.Created.code,
      httpStatus.Created.message,
      { chatId: createdChatId }
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
  const { chatId } = req.params;

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

  const updatedChat = await db
    .update(chats)
    .set(updateSchema.data)
    .where(eq(chats.id, chatIdNumber))
    .returning();

  return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message, {
    updatedChat: updatedChat[0],
  });
});

export const deleteChatFull = asyncWrapper(
  async (req: Request, res: Response) => {
    const { chatId } = req.params;

    const chatIdNumber = parseInt(chatId);

    await db.delete(chats).where(eq(chats.id, chatIdNumber));

    return APIResponse(
      res,
      httpStatus.Deleted.code,
      "Chat deleted successfully"
    );
  }
);

export const addUsersToChat = asyncWrapper(
  async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const currentUser = res.locals.user;

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

    const usersIds = inviteUsersSchema.data.users;

    const usersNames = await db
      .select({
        name: users.name,
      })
      .from(users)
      .where(inArray(users.id, usersIds));

    const usersToInsert = usersIds.map((userId) => {
      return {
        chatId: chatIdNumber,
        userId,
      };
    });

    await db.insert(chat_participants).values(usersToInsert);

    const formattedUsersNames = usersNames.map((user) => user.name);

    const formattedSystemMessage = formatSystemMessageForUsers(
      formattedUsersNames,
      "invite"
    );

    const systemMessage = await db
      .insert(messages)
      .values({
        chatId: chatIdNumber,
        senderId: currentUser.id,
        content: formattedSystemMessage,
        isSystem: true,
        messageType: "text",
      })
      .returning();

    return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message, {
      systemMessage: {
        id: systemMessage[0].id,
        createdAt: systemMessage[0].createdAt,
        updatedAt: systemMessage[0].updatedAt,
        senderId: systemMessage[0].senderId,
        chatId: systemMessage[0].chatId,
        content: systemMessage[0].content,
        messageType: systemMessage[0].messageType,
        parentId: systemMessage[0].parentId,
        files: systemMessage[0].files,
        isSystem: systemMessage[0].isSystem,
      },
    });
  }
);

export const removeUsersFromChat = asyncWrapper(
  async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const currentUser = res.locals.user;

    const removeUsersSchema = removeUsersFromChatSchema.safeParse(req.body);

    if (!removeUsersSchema.success) {
      return APIResponse(
        res,
        httpStatus.BadRequest.code,
        "Validation error",
        removeUsersSchema.error
      );
    }

    const chatIdNumber = parseInt(chatId);

    const usersIds = removeUsersSchema.data.users;

    console.log(usersIds);

    const usersNames = await db
      .select({
        name: users.name,
      })
      .from(users)
      .where(inArray(users.id, usersIds));

    await db
      .delete(chat_participants)
      .where(
        and(
          inArray(chat_participants.userId, usersIds),
          eq(chat_participants.chatId, chatIdNumber)
        )
      );

    const formattedUsersNames = usersNames.map((user) => user.name);

    const formattedSystemMessage = formatSystemMessageForUsers(
      formattedUsersNames,
      "remove"
    );

    const systemMessage = await db
      .insert(messages)
      .values({
        chatId: chatIdNumber,
        senderId: currentUser.id,
        content: formattedSystemMessage,
        isSystem: true,
        messageType: "text",
      })
      .returning();

    return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message, {
      systemMessage: {
        id: systemMessage[0].id,
        createdAt: systemMessage[0].createdAt,
        updatedAt: systemMessage[0].updatedAt,
        senderId: systemMessage[0].senderId,
        chatId: systemMessage[0].chatId,
        content: systemMessage[0].content,
        messageType: systemMessage[0].messageType,
        parentId: systemMessage[0].parentId,
        files: systemMessage[0].files,
        isSystem: systemMessage[0].isSystem,
      },
    });
  }
);

export const getChatInfo = asyncWrapper(async (req: Request, res: Response) => {
  const currentUser = res.locals.user;
  const { chatId } = req.params;

  const chatIdNumber = parseInt(chatId);

  const chatInfo = await db
    .select({
      name: chats.name,
      photo: chats.photo,
      isGroup: chats.isGroup,
      description: chats.description,
    })
    .from(chats)
    .where(eq(chats.id, chatIdNumber))
    .groupBy(chats.id);

  if (!chatInfo[0].isGroup) {
    const participants = await db
      .select({
        userId: chat_participants.userId,
        name: users.name,
        avatar: users.avatar,
        description: users.bio,
      })
      .from(chat_participants)
      .leftJoin(users, eq(chat_participants.userId, users.id))
      .where(eq(chat_participants.chatId, chatIdNumber));

    const participant = participants.find(
      (participant) => participant.userId !== currentUser.id
    );

    if (participant && participant.name && participant.avatar) {
      chatInfo[0].name = participant.name;
      chatInfo[0].photo = participant.avatar;
      chatInfo[0].description = participant.description;
    }
  }

  const chatParticipants = await getChatParticipants(chatIdNumber);

  return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message, {
    chatInfo: chatInfo[0],
    participants: chatParticipants,
  });
});

export const getChatMessages = asyncWrapper(
  async (req: Request, res: Response) => {
    const currentUser = res.locals.user;
    const { chatId } = req.params;

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
        senderName: users.name,
        parentId: messages.parentId,
        files: messages.files,
        isSystem: messages.isSystem,
        isPinned: messages.isPinned,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.chatId, chatIdNumber))
      .orderBy(asc(messages.createdAt));

    const messagesWithReplies = chatMessages.map((message) => {
      if (message.parentId) {
        const parentMessage = chatMessages.find(
          (msg) => msg.id === message.parentId
        );
        if (!parentMessage) return message;

        return {
          ...message,
          parentMessage: {
            id: parentMessage.id,
            content: parentMessage.content,
            sender: parentMessage.senderName,
          },
        };
      }

      return message;
    });

    const latestPinnedMessage = await db
      .select({
        id: messages.id,
        content: messages.content,
        createdAt: messages.createdAt,
        senderId: messages.senderId,
        senderName: users.name,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        and(eq(messages.chatId, chatIdNumber), eq(messages.isPinned, true))
      )
      .orderBy(desc(messages.pinnedAt))
      .limit(1);

    return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message, {
      messages: messagesWithReplies,
      pinnedMessage: latestPinnedMessage[0],
    });
  }
);

export const sendMessage = asyncWrapper(async (req: Request, res: Response) => {
  const currentUser = res.locals.user;

  const { chatId } = req.params;

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

  const newMessage = {
    ...sendMessageParseResult.data,
    chatId: chatIdNumber,
    senderId: currentUser.id,
  };

  await db.insert(messages).values(newMessage);
  return APIResponse(res, httpStatus.Created.code, "Message created");
});

export const deleteChatHistory = asyncWrapper(
  async (req: Request, res: Response) => {
    let { chatId } = req.params;

    await db.delete(messages).where(eq(messages.chatId, Number(chatId)));

    return APIResponse(res, httpStatus.Deleted.code, "Chat history deleted");
  }
);

export const deleteChatMessage = asyncWrapper(
  async (req: Request, res: Response) => {
    let { chatId, messageId } = req.params;

    if (!messageId) {
      return APIResponse(
        res,
        httpStatus.BadRequest.code,
        "Message id is required"
      );
    }

    const message = await db
      .select({ id: messages.id, files: messages.files })
      .from(messages)
      .where(
        and(
          eq(messages.chatId, Number(chatId)),
          eq(messages.id, Number(messageId))
        )
      );

    await deleteMany({
      folder: "talkify/media",
      public_ids: message[0].files,
    });

    await db
      .delete(messages)
      .where(
        and(
          eq(messages.chatId, Number(chatId)),
          eq(messages.id, Number(messageId))
        )
      );

    return APIResponse(res, httpStatus.Deleted.code, "Chat message deleted");
  }
);

export const pinMessage = asyncWrapper(async (req: Request, res: Response) => {
  let { chatId, messageId } = req.params;
  const currentUser = res.locals.user;

  if (!messageId || !chatId) {
    return APIResponse(
      res,
      httpStatus.BadRequest.code,
      "Message id and chat id is required"
    );
  }

  const currentMessage = await db
    .select({ id: messages.id, isPinned: messages.isPinned })
    .from(messages)
    .where(
      and(
        eq(messages.chatId, Number(chatId)),
        eq(messages.id, Number(messageId))
      )
    );

  const updatedMessage = await db
    .update(messages)
    .set({
      isPinned: !currentMessage[0].isPinned,
      pinnedAt: currentMessage[0].isPinned ? null : new Date(),
    })
    .where(
      and(
        eq(messages.chatId, Number(chatId)),
        eq(messages.id, Number(messageId))
      )
    )
    .returning();

  if (updatedMessage[0].isPinned) {
    const formattedSystemMessage = `${currentUser.name} pinned a message: ${
      updatedMessage[0].content && updatedMessage[0].content?.length > 20
        ? updatedMessage[0].content?.slice(0, 20) + "..."
        : updatedMessage[0].content
    }`;

    const systemMessage = await db
      .insert(messages)
      .values({
        chatId: Number(chatId),
        senderId: currentUser.id,
        content: formattedSystemMessage,
        isSystem: true,
        messageType: "text",
      })
      .returning();

    return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message, {
      systemMessage: {
        id: systemMessage[0].id,
        createdAt: systemMessage[0].createdAt,
        updatedAt: systemMessage[0].updatedAt,
        senderId: systemMessage[0].senderId,
        chatId: systemMessage[0].chatId,
        content: systemMessage[0].content,
        messageType: systemMessage[0].messageType,
        parentId: systemMessage[0].parentId,
        files: systemMessage[0].files,
        isSystem: systemMessage[0].isSystem,
      },
    });
  }

  return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message);
});

export const updateChatMember = asyncWrapper(
  async (req: Request, res: Response) => {
    const { chatId, memberId } = req.params;

    const updateChatMember = updateChatMemberSchema.safeParse(req.body);

    if (!updateChatMember.success) {
      return APIResponse(
        res,
        httpStatus.BadRequest.code,
        "Validation error",
        updateChatMember.error
      );
    }

    if (!chatId || !memberId) {
      return APIResponse(
        res,
        httpStatus.BadRequest.code,
        "Chat id and member is required"
      );
    }

    const chatIdNumber = parseInt(chatId);
    const memberIdNumber = parseInt(memberId);

    await db
      .update(chat_participants)
      .set({ ...updateChatMember.data })
      .where(
        and(
          eq(chat_participants.chatId, chatIdNumber),
          eq(chat_participants.userId, memberIdNumber)
        )
      );

    return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message);
  }
);
