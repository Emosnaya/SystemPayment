import type { NextFunction, Request, Response } from "express";
import * as paymentService from "../services/paymentService";
import * as userService from "../services/userService";

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

export async function getUserPayments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payments = await paymentService.getPaymentsByUserId(
      req.params.id as string,
    );
    res.status(200).json(payments);
  } catch (error) {
    next(error);
  }
}
