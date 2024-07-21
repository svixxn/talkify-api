import { Request, Response } from "express";
import { db } from "../config/db";
import {
  NewUser,
  insertUserSchema,
  signUpUserRequest,
  loginUserRequest,
  users,
} from "../config/schema";
import { APIResponse } from "../utils/general";
import { slugify } from "../utils/general";
import { httpStatus } from "../utils/constants";
import { signInJWT } from "../utils/auth";
import { eq } from "drizzle-orm";

export async function signUp(req: Request, res: Response) {
  try {
    const user = signUpUserRequest.parse(req.body);

    const slug = slugify(req.body.name);

    await db.insert(users).values({ ...user, slug });

    return APIResponse(res, httpStatus.OK.code, "User created successfully", {
      user,
    });
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
  const user = loginUserRequest.parse(req.body);

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
    res.cookie("authToken", jwtToken);

    return APIResponse(res, 200, "Success", {
      userId: user[0].id,
      token: jwtToken,
    });
  } catch (e: any) {
    return APIResponse(res, 400, "There was an issue during signing in", e);
  }
}
