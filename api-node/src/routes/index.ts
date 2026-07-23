import { Router } from "express";
import cardRoutes from "./cardRoutes";
import paymentRoutes from "./paymentRoutes";
import userRoutes from "./userRoutes";

const router = Router();

router.use("/users", userRoutes);
router.use("/cards", cardRoutes);
router.use("/payments", paymentRoutes);

export default router;
