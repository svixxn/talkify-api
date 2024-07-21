import { NextFunction, Request, Response } from "express";

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

export function asyncWrapper(
  fn: (req: Request, res: Response, next?: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      fn(req, res, next);
    } catch (err) {
      return APIResponse(res, 500, "Internal server error", { err });
    }
  };
}
