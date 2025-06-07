import { NextFunction, Request, Response } from "express";
import { APIResponse } from "../utils/general";
import jwt, { Secret } from "jsonwebtoken";
import { db } from "../config/db";
import { User, users } from "../config/schema";
import { eq } from "drizzle-orm";
import { JwtDecodeSchema } from "types";
import { httpStatus } from "../utils/constants";

export async function checkAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.authToken) {
    token = req.cookies.authToken;
  }

  if (!token) {
    return APIResponse(
      res,
      httpStatus.Unauthorized.code,
      httpStatus.Unauthorized.message
    );
  }

  if (!process.env.JWT_SECRET)
    return APIResponse(
      res,
      httpStatus.BadRequest.code,
      "No jwt secret specified"
    );

  let decoded: jwt.JwtPayload | string;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return APIResponse(
      res,
      httpStatus.BadRequest.code,
      "The token has expired"
    );
  }

  if (typeof decoded === "string" || !decoded.id) {
    return APIResponse(
      res,
      httpStatus.BadRequest.code,
      "There was an issue during identifying user"
    );
  }

  const user = await db
    .select({
      id: users.id,
      name: users.name,
      age: users.age,
      avatar: users.avatar,
      slug: users.slug,
      email: users.email,
      phone: users.phone,
      bio: users.bio,
      createdAt: users.createdAt,
      stripeCustomerId: users.stripeCustomerId,
      isPremium: users.isPremium,
    })
    .from(users)
    .where(eq(users.id, decoded.id))
    .limit(1);

  if (user.length === 0) {
    return APIResponse(
      res,
      httpStatus.NotFound.code,
      "This user is not exist anymore"
    );
  }

  res.locals.user = user[0];

  next();
}
