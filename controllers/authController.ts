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
import { addTimeToDate, signInJWT } from "../utils/auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { createCustomer } from "../utils/stripe";

export async function signUp(req: Request, res: Response) {
  try {
    const user = signUpUserRequest.parse(req.body);

    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, user.email));

    if (existingUser.length > 0) {
      return APIResponse(res, 400, "User with this email already exists");
    }

    const slug = slugify(req.body.name);

    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(req.body.password, salt, async function (err, hash) {
        if (err)
          return APIResponse(
            res,
            httpStatus.BadRequest.code,
            "There was a problem during hashing your password"
          );

        const stripeCustomer = await createCustomer(user.email);

        const newUser = await db
          .insert(users)
          .values({
            ...user,
            slug,
            password: hash,
            stripeCustomerId: stripeCustomer.id,
          })
          .returning({ id: users.id });

        return APIResponse(
          res,
          httpStatus.OK.code,
          "User created successfully",
          {
            userId: newUser[0].id,
          }
        );
      });
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
  const validatedBody = loginUserRequest.parse(req.body);

  try {
    const user = await db
      .select({ id: users.id, password: users.password })
      .from(users)
      .where(eq(users.email, validatedBody.email))
      .limit(1);

    if (user.length === 0) {
      return APIResponse(
        res,
        httpStatus.NotFound.code,
        "Email or password is incorrect"
      );
    }

    bcrypt.compare(
      validatedBody.password,
      user[0].password,
      function (err, result) {
        if (err)
          return APIResponse(
            res,
            httpStatus.BadRequest.code,
            "There was an error during password compare",
            err
          );

        if (!result)
          return APIResponse(
            res,
            httpStatus.BadRequest.code,
            "Email or password is incorrect"
          );

        const { token, expiresIn, error } = signInJWT(user[0].id.toString());

        const expiresInDate = addTimeToDate(expiresIn || "");

        res.cookie("authToken", token, { expires: expiresInDate });

        if (error) {
          return APIResponse(
            res,
            httpStatus.BadRequest.code,
            httpStatus.BadRequest.message,
            { error }
          );
        }

        return APIResponse(res, httpStatus.OK.code, httpStatus.OK.message, {
          userId: user[0].id,
          token,
          expiresIn,
        });
      }
    );
  } catch (e: any) {
    return APIResponse(
      res,
      httpStatus.BadRequest.code,
      httpStatus.BadRequest.message,
      e
    );
  }
}
