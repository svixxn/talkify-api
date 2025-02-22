import jwt from "jsonwebtoken";

export function signInJWT(id: string): {
  token?: string;
  expiresIn?: string;
  error?: string;
} {
  try {
    const JWT_SECRET = process.env.JWT_SECRET ?? "secret";
    const expiresIn: string | number = process.env.JWT_EXPIRES_AT
      ? isNaN(Number(process.env.JWT_EXPIRES_AT))
        ? process.env.JWT_EXPIRES_AT
        : Number(process.env.JWT_EXPIRES_AT)
      : "24h";

    const token = jwt.sign(
      { id, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 },
      JWT_SECRET
    );

    return { token, expiresIn: expiresIn.toString() };
  } catch (error) {
    return { error: (error as Error).message };
  }
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
