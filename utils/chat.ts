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
