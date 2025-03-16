import { Request, Response } from "express";
import { db } from "../config/db";
import {
  chat_participants,
  chats,
  searchUsersSchema,
  users,
} from "../config/schema";
import { APIResponse } from "../utils/general";
import { and, eq, ne, sql } from "drizzle-orm";
import { httpStatus } from "../utils/constants";

export async function getAllUsers(req: Request, res: Response) {
  const allUsers = await db.select().from(users);

  return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message, {
    users: allUsers,
  });
}

export async function getUserById(req: Request, res: Response) {
  const { id } = req.params;

  if (!id) {
    return APIResponse(res, httpStatus.BadRequest.code, "User id is required");
  }

  const user = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar: users.avatar,
      slug: users.slug,
      age: users.age,
      bio: users.bio,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      phone: users.phone,
    })
    .from(users)
    .where(eq(users.id, Number(id)));

  if (user.length <= 0) {
    return APIResponse(
      res,
      httpStatus.NotFound.code,
      "There is no user with provided id"
    );
  }

  return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message, {
    user: user[0],
  });
}

export async function getCurrentUser(req: Request, res: Response) {
  return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message, {
    user: res.locals.user,
  });
}

export async function getUsersForSearch(req: Request, res: Response) {
  const currentUser = res.locals.user;

  const searchUsers = searchUsersSchema.safeParse(req.body);

  if (!searchUsers.success) {
    return APIResponse(
      res,
      httpStatus.BadRequest.code,
      "Validation error",
      searchUsers.error
    );
  }

  const { s, filtered } = searchUsers.data;

  let query = sql`(name LIKE ${`%${s || ""}%`} OR email LIKE ${`%${
    s || ""
  }%`}) AND ${ne(users.id, currentUser.id)}`;

  if (filtered) {
    query = query.append(sql`AND id NOT IN ${filtered}`);
  }

  const foundUsers = await db
    .select({
      id: users.id,
      avatar: users.avatar,
      name: users.name,
    })
    .from(users)
    .where(and(query));

  return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message, {
    users: foundUsers,
  });
}

export async function getUsersForCreateChat(req: Request, res: Response) {
  const currentUser = res.locals.user;

  console.log("here");

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
