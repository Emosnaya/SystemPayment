import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";

type RequestTarget = "body" | "params" | "query";

export function validate(schema: ZodType, target: RequestTarget = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new AppError(400, "Validation failed", {
            code: "VALIDATION_ERROR",
            details: error.issues,
          }),
        );
        return;
      }
      next(error);
    }
  };
}
