import { Router } from "express";
import * as paymentController from "../controllers/paymentController";
import { validate } from "../middlewares/validate";
import { createPaymentSchema } from "../schemas/paymentSchemas";

const router = Router();

router.post("/", validate(createPaymentSchema), paymentController.createPayment);

export default router;
