import type { NextFunction, Request, Response } from "express";
import * as cardService from "../services/cardService";

export async function createCard(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const card = await cardService.createCard(req.body);
    res.status(201).json(card);
  } catch (error) {
    next(error);
  }
}
