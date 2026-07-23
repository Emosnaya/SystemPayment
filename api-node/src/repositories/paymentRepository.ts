import { pool, query } from "../config/db";
import type { Payment, PaymentStatus } from "../types/models";

export async function createPayment(input: {
  usuario_id: string;
  tarjeta_id: string;
  monto: number;
  estado: PaymentStatus;
}): Promise<Payment> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query<Payment>(
      `INSERT INTO pagos (usuario_id, tarjeta_id, monto, estado)
       VALUES ($1, $2, $3, $4)
       RETURNING id, usuario_id, tarjeta_id, monto::text AS monto, estado, fecha_pago`,
      [input.usuario_id, input.tarjeta_id, input.monto, input.estado],
    );

    await client.query("COMMIT");

    const payment = result.rows[0];
    if (!payment) {
      throw new Error("Failed to create payment");
    }
    return payment;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function findPaymentsByUserId(usuarioId: string): Promise<Payment[]> {
  const { rows } = await query<Payment>(
    `SELECT id, usuario_id, tarjeta_id, monto::text AS monto, estado, fecha_pago
     FROM pagos
     WHERE usuario_id = $1
     ORDER BY fecha_pago DESC`,
    [usuarioId],
  );
  return rows;
}
