import { NextFunction, Request, Response } from "express";
import { APIResponse } from "../utils/general";
import jwt, { Secret } from "jsonwebtoken";
import { db } from "../config/db";
import { users } from "../config/schema";
import { eq } from "drizzle-orm";
import { JwtDecodeSchema } from "types";

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
  } else if (req.cookies && req.cookies._auth) {
    token = req.cookies._auth;
  }

  if (!token) {
    return APIResponse(
      res,
      401,
      "You don't have access to perform this action"
    );
  }

  if (!process.env.JWT_SECRET)
    return APIResponse(res, 400, "No jwt secret specified");

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (typeof decoded === "string" || !decoded.id) {
    return APIResponse(res, 400, "There was an issue during identifying user");
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, decoded.id))
    .limit(1);

  if (user.length === 0) {
    return APIResponse(res, 400, "This user is not exist anymore");
  }

  res.locals.user = user[0];

  next();
}
