import jwt, { Secret } from "jsonwebtoken";
import { APIResponse } from "./general";

export function signInJWT(id: string): string | { error: string } {
  if (!process.env.JWT_SECRET)
    return {
      error: "No JWT secret specified",
    };

  const JWT_SECRET: Secret = process.env.JWT_SECRET;

  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_AT || "24h",
  });
}
