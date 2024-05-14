import { Request, Response } from "express";
import { db } from "../config/db";
import { NewUser, users } from "../config/schema";
import { APIResponse } from "../utils/general";
import { slugify } from "../utils/general";

import {
  isValidCreateUserRequest,
  isValidSignInRequest,
} from "../utils/validators";
import { signInJWT } from "../utils/auth";
import { eq } from "drizzle-orm";

export async function signUp(req: Request, res: Response) {
  const { isValid, error } = isValidCreateUserRequest(req.body);
  if (!isValid) return APIResponse(res, 400, error);

  const slug = slugify(req.body.name);

  const user: NewUser = {
    name: req.body.name,
    email: req.body.email,
    age: req.body.age,
    slug,
  };

  try {
    await db.insert(users).values(user);

    return APIResponse(res, 200, "User created successfully", { user });
  } catch (err: any) {
    return APIResponse(
      res,
      400,
      "There was an issue during creating a new user",
      err
    );
  }
}

export async function signIn(req: Request, res: Response) {
  const { isValid, error } = isValidSignInRequest(req.body);
  if (!isValid) return APIResponse(res, 400, error);

  try {
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, req.body.email))
      .limit(1);

    if (user.length === 0) {
      return APIResponse(res, 404, "User not found");
    }

    const jwtToken = signInJWT(user[0].id.toString());

    return APIResponse(res, 200, "Success", {
      userId: user[0].id,
      token: jwtToken,
    });
  } catch (e: any) {
    return APIResponse(res, 400, "There was an issue during signing in", e);
  }
}
