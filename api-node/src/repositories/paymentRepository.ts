import { pool, query } from "../config/db";
import type { Payment, PaymentStatus } from "../types/models";

const PAYMENT_COLUMNS = `
  id, usuario_id, tarjeta_id, monto::text AS monto, estado, transaction_id,
  fecha_pago, created_at, updated_at, deleted_at
`;

export async function createPayment(input: {
  usuario_id: string;
  tarjeta_id: string;
  monto: number;
  estado: PaymentStatus;
  transaction_id: string;
}): Promise<Payment> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query<Payment>(
      `INSERT INTO pagos (usuario_id, tarjeta_id, monto, estado, transaction_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${PAYMENT_COLUMNS}`,
      [
        input.usuario_id,
        input.tarjeta_id,
        input.monto,
        input.estado,
        input.transaction_id,
      ],
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
    `SELECT ${PAYMENT_COLUMNS}
     FROM pagos
     WHERE usuario_id = $1 AND deleted_at IS NULL
     ORDER BY fecha_pago DESC`,
    [usuarioId],
  );
  return rows;
}
