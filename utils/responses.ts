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
