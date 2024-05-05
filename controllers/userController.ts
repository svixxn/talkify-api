import { Request, Response } from "express";
import { db } from "../config/db";
import { NewUser, User, users } from "../config/schema";
import { isValidCreateUserRequest } from "../utils/validators";
import { CreateUserRequest } from "types";
import { APIResponse } from "../utils/responses";
import { slugify } from "../utils/slugify";

export function getUser(req: Request, res: Response) {
  res.json({ user: "John Doe" });
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

    return APIResponse(res, 200, "User created successfully");
  } catch (err) {
    throw new Error(
      "There was an error while inserting data to the table 'Users'"
    );
  }
}
