import { Request, Response } from "express";
import { db } from "../config/db";
import { chat_participants, chats, users } from "../config/schema";
import { APIResponse } from "../utils/general";
import { and, eq, ne, sql } from "drizzle-orm";
import { httpStatus } from "../utils/constants";

export async function getAllUsers(req: Request, res: Response) {
  const allUsers = await db.select().from(users);

  return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message, {
    users: allUsers,
  });
}

export async function getUserBySlug(req: Request, res: Response) {
  const { slug } = req.params;

  const user = await db.select().from(users).where(eq(users.slug, slug));

  if (user.length <= 0) {
    return APIResponse(
      res,
      httpStatus.NotFound.code,
      "There is no user with provided slug"
    );
  }

  return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message, { user });
}

export async function getCurrentUser(req: Request, res: Response) {
  return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message, {
    user: res.locals.user,
  });
}

export async function getUsersForSearch(req: Request, res: Response) {
  // const { s } = req.query;

  // const searchValue = s || "";

  const currentUser = res.locals.user;

  const searchValue = "";

  const foundUsers = await db
    .select({
      id: users.id,
      avatar: users.avatar,
      name: users.name,
    })
    .from(users)
    .where(
      and(
        sql`(name LIKE ${`%${searchValue || ""}%`} OR email LIKE ${`%${
          searchValue || ""
        }%`}) AND ${ne(users.id, currentUser.id)}`
      )
    );

  return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message, {
    users: foundUsers,
  });
}

export async function getUsersForCreateChat(req: Request, res: Response) {
  const currentUser = res.locals.user;

  const chatsWithCurrentUser = await db
    .select({ chatId: chats.id })
    .from(chat_participants)
    .leftJoin(chats, eq(chat_participants.chatId, chats.id))
    .where(
      and(
        eq(chats.isGroup, false),
        eq(chat_participants.userId, currentUser.id)
      )
    );

  const chatsWithCurrentUserIds = chatsWithCurrentUser.map(
    (chat) => chat.chatId
  );

  if (chatsWithCurrentUserIds.length <= 0) {
    const allOtherUsers = await db
      .select({ id: users.id, avatar: users.avatar, name: users.name })
      .from(users)
      .where(ne(users.id, currentUser.id));

    return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message, {
      users: allOtherUsers,
    });
  } else {
    const allOtherUsers = await db
      .select({ id: users.id, avatar: users.avatar, name: users.name })
      .from(users)
      .where(
        sql`${users.id} NOT IN (select ${
          chat_participants.userId
        } from ${chat_participants} where ${
          chat_participants.chatId
        } IN ${chatsWithCurrentUserIds} and ${ne(
          chat_participants.userId,
          currentUser.id
        )}) and ${ne(users.id, currentUser.id)}`
      );

    return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message, {
      users: allOtherUsers,
    });
  }
}
