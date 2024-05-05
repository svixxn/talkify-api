import { Request, Response } from "express";
import { db } from "../config/db";
import { NewUser, User, users } from "../config/schema";
import { isValidCreateUserRequest } from "../utils/validators";
import { CreateUserRequest } from "types";
import { APIResponse } from "../utils/responses";
import { slugify } from "../utils/slugify";
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

export async function createUser(req: Request, res: Response) {
  const { isValid, error } = isValidCreateUserRequest(req.body);
  if (!isValid) return APIResponse(res, 400, error);

  const slug = slugify(req.body.name);

  const user: NewUser = {
    name: req.body.name,
    age: req.body.age,
    slug,
  };

  try {
    await db.insert(users).values(user);

    return APIResponse(res, 200, "User created successfully", { user });
  } catch (err) {
    throw new Error(
      "There was an error while inserting data to the table 'Users'"
    );
  }
}
