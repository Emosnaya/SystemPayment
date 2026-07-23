import "dotenv/config";

import app from "./app";
import { pool } from "./config/db";
import { env } from "./config/env";

async function start(): Promise<void> {
  // Verifica conectividad con PostgreSQL al arrancar
  await pool.query("SELECT 1");

  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
