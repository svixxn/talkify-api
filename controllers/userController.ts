import { Request, Response } from "express";
import { db } from "../config/db";
import { users } from "../config/schema";
import { APIResponse } from "../utils/general";
import { eq } from "drizzle-orm";

export async function getAllUsers(req: Request, res: Response) {
  const allUsers = await db.select().from(users);

  return APIResponse(res, 200, "success", {
    users: allUsers,
  });
}

export async function getUserBySlug(req: Request, res: Response) {
  const { slug } = req.params;

  const user = await db.select().from(users).where(eq(users.slug, slug));

  if (user.length <= 0) {
    return APIResponse(res, 400, "There is no user with provided slug");
  }

  return APIResponse(res, 200, "success", { user });
}

export async function getCurrentUser(req: Request, res: Response) {
  if (!res.locals.user) {
    return APIResponse(
      res,
      404,
      "You don't have permission to perform this action"
    );
  }

  return APIResponse(res, 200, "Success", res.locals.user);
}
