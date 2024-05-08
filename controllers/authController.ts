import { Request, Response } from "express";
import { db } from "../config/db";
import { NewUser, users } from "../config/schema";
import { APIResponse } from "../utils/general";
import { slugify } from "../utils/general";
import jwt from "jsonwebtoken";

import {
  isValidCreateUserRequest,
  isValidSignInRequest,
} from "../utils/validators";
import { signInJWT } from "../utils/auth";

export async function signUp(req: Request, res: Response) {
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

export async function signIn(req: Request, res: Response) {
  const { isValid, error } = isValidSignInRequest(req.body);
  if (!isValid) return APIResponse(res, 400, error);

  //  const jwtToken = signInJWT()
}
