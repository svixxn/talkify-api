import { Request, Response } from "express";

export function getUser(req: Request, res: Response) {
  res.json({ user: "John Doe" });
}
