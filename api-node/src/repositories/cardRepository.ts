import { query } from "../config/db";
import type { Card } from "../types/models";

const CARD_COLUMNS = `
  id, usuario_id, titular, ultimos_cuatro, fecha_expiracion,
  created_at, updated_at, deleted_at
`;

export async function createCard(input: {
  usuario_id: string;
  titular: string;
  ultimos_cuatro: string;
  fecha_expiracion: string;
}): Promise<Card> {
  const { rows } = await query<Card>(
    `INSERT INTO tarjetas (usuario_id, titular, ultimos_cuatro, fecha_expiracion)
     VALUES ($1, $2, $3, $4::date)
     RETURNING ${CARD_COLUMNS}`,
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
    `SELECT ${CARD_COLUMNS}
     FROM tarjetas
     WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return rows[0] ?? null;
}
