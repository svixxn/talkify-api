import jwt, { Secret } from "jsonwebtoken";

export function signInJWT(id: string): {
  token?: string;
  expiresIn?: string;
  error?: string;
} {
  if (!process.env.JWT_SECRET)
    return {
      error: "No JWT secret specified",
    };

  const JWT_SECRET: Secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_AT || "24h";

  const token = jwt.sign({ id }, JWT_SECRET, {
    expiresIn,
  });

  return {
    token,
    expiresIn,
  };
}
