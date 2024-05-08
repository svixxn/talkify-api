import { Response } from "express";

export function APIResponse(
  res: Response,
  status: number,
  message: string,
  options?: { [key: string]: any }
) {
  res.status(status).json({
    message,
    ...options,
  });
}

export function slugify(name: string) {
  return name.replace(/ /g, "-").toLowerCase();
}
