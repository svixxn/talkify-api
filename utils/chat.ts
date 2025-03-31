import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { chat_participants, users } from "../config/schema";

export const sortChatsByLastMessage = (
  chats: {
    name: string | null;
    photo: string | null;
    chatId: number;
    lastMessage: string | null;
    lastMessageDate: Date | null;
    isGroup: boolean | null;
  }[]
) => {
  return chats.sort((a, b) => {
    if (a.lastMessageDate && b.lastMessageDate) {
      return a.lastMessageDate > b.lastMessageDate ? -1 : 1;
    }

    if (a.lastMessageDate && !b.lastMessageDate) {
      return -1;
    }

    if (!a.lastMessageDate && b.lastMessageDate) {
      return 1;
    }

    return 0;
  });
};

export const getChatParticipants = async (
  chatId: number
): Promise<
  {
    id: number | null;
    name: string | null;
    avatar: string | null;
    email: string | null;
    role: "user" | "moderator" | "admin" | null;
  }[]
> => {
  const participants = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar: users.avatar,
      role: chat_participants.role,
    })
    .from(chat_participants)
    .leftJoin(users, eq(chat_participants.userId, users.id))
    .where(eq(chat_participants.chatId, chatId));

  return participants;
};

export const formatSystemMessageForUsers = (
  formattedUsersNames: string[],
  type: "invite" | "remove"
) => {
  const formattedUsersNamesString = formattedUsersNames.join(", ");

  if (type === "invite")
    return (
      formattedUsersNamesString +
      " welcome to the chat! 👋 Feel free to start a conversation."
    );

  if (type === "remove")
    return (
      formattedUsersNamesString +
      ` ${
        formattedUsersNames.length > 1 ? "were" : "was"
      } removed from the chat.`
    );
};
