import { query } from "../config/db";
import type { Card } from "../types/models";

export async function createCard(input: {
  usuario_id: string;
  titular: string;
  ultimos_cuatro: string;
  fecha_expiracion: string;
}): Promise<Card> {
  const { rows } = await query<Card>(
    `INSERT INTO tarjetas (usuario_id, titular, ultimos_cuatro, fecha_expiracion)
     VALUES ($1, $2, $3, $4::date)
     RETURNING id, usuario_id, titular, ultimos_cuatro, fecha_expiracion, fecha_creacion`,
    [input.usuario_id, input.titular, input.ultimos_cuatro, input.fecha_expiracion],
  );

  const card = rows[0];
  if (!card) {
    throw new Error("Failed to create card");
  }
  return card;
}

export async function findCardById(id: string): Promise<Card | null> {
  const { rows } = await query<Card>(
    `SELECT id, usuario_id, titular, ultimos_cuatro, fecha_expiracion, fecha_creacion
     FROM tarjetas
     WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}
