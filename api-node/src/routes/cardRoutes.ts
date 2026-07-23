import { Router } from "express";
import * as cardController from "../controllers/cardController";
import { validate } from "../middlewares/validate";
import { createCardSchema } from "../schemas/cardSchemas";

const router = Router();

router.post("/", validate(createCardSchema), cardController.createCard);

export default router;
