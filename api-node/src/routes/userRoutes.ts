import { Router } from "express";
import * as userController from "../controllers/userController";
import { validate } from "../middlewares/validate";
import { createUserSchema, userIdParamSchema } from "../schemas/userSchemas";

const router = Router();

router.post("/", validate(createUserSchema), userController.createUser);
router.get(
  "/:id/payments",
  validate(userIdParamSchema, "params"),
  userController.getUserPayments,
);

export default router;
