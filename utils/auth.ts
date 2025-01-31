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

  console.log("JWT_SECRET", JWT_SECRET, expiresIn, id);

  const token = jwt.sign({ id }, JWT_SECRET, {
    expiresIn,
  });

  return {
    token,
    expiresIn,
  };
}

export function addTimeToDate(timeString: string) {
  const now = new Date();
  const timeUnit = timeString.slice(-1);
  const timeValue = parseInt(timeString.slice(0, -1));

  switch (timeUnit) {
    case "h":
      now.setHours(now.getHours() + timeValue);
      break;
    case "m":
      now.setMinutes(now.getMinutes() + timeValue);
      break;
    case "s":
      now.setSeconds(now.getSeconds() + timeValue);
      break;
    case "d":
      now.setDate(now.getDate() + timeValue);
      break;
    default:
      console.error("Unsupported time unit");
  }

  return now;
}
