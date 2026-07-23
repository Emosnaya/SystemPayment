import type { NextFunction, Request, Response } from "express";
import { DatabaseError } from "pg";
import { AppError } from "../errors/AppError";

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, "Route not found", { code: "NOT_FOUND" }));
}

function sendError(
  res: Response,
  statusCode: number,
  payload: { error: string; code: string; details?: unknown },
): void {
  res.status(statusCode).json(payload);
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.toJSON() as {
      error: string;
      code: string;
      details?: unknown;
    });
    return;
  }

  if (err instanceof DatabaseError) {
    if (err.code === "23505") {
      sendError(res, 409, {
        error: "Resource already exists",
        code: "CONFLICT",
        details: { constraint: err.constraint },
      });
      return;
    }
    if (err.code === "23503") {
      sendError(res, 400, {
        error: "Referenced resource does not exist",
        code: "BAD_REQUEST",
        details: { constraint: err.constraint },
      });
      return;
    }
  }

  console.error("Unhandled error:", err);

  sendError(res, 500, {
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
}
