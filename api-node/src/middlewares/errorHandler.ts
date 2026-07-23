import type { NextFunction, Request, Response } from "express";
import { DatabaseError } from "pg";
import { AppError } from "../errors/AppError";

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, "Route not found"));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof DatabaseError) {
    if (err.code === "23505") {
      res.status(409).json({ error: "Resource already exists" });
      return;
    }
    if (err.code === "23503") {
      res.status(400).json({ error: "Referenced resource does not exist" });
      return;
    }
  }

  console.error("Unhandled error:", err);

  res.status(500).json({
    error: "Internal server error",
  });
}
