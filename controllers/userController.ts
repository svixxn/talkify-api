import { Request, Response } from "express";
import { db } from "../config/db";
import { users } from "../config/schema";
import { APIResponse } from "../utils/general";
import { eq } from "drizzle-orm";
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
