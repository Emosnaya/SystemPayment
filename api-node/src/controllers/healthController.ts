import type { Request, Response } from "express";
import { pool } from "../config/db";

export async function healthCheck(_req: Request, res: Response): Promise<void> {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      status: "healthy",
      service: "api-node",
      database: "up",
    });
  } catch (error) {
    console.error("Health check failed:", error);

    res.status(503).json({
      status: "unhealthy",
      service: "api-node",
      database: "down",
    });
  }
}
