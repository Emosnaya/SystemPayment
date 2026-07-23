import { AppError } from "../errors/AppError";
import * as cardRepository from "../repositories/cardRepository";
import * as userRepository from "../repositories/userRepository";
import type { CreateCardInput } from "../schemas/cardSchemas";
import type { Card } from "../types/models";

/**
 * Normaliza la fecha de expiración a YYYY-MM-DD para PostgreSQL DATE.
 * MM/YY y MM/YYYY se convierten al último día del mes.
 */
export function normalizeExpirationDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const match = value.match(/^(\d{2})\/(\d{2}|\d{4})$/);
  if (!match) {
    throw new AppError(400, "Invalid fecha_expiracion format");
  }

  const month = Number(match[1]);
  let year = Number(match[2]);

  if (month < 1 || month > 12) {
    throw new AppError(400, "Invalid expiration month");
  }

  if (year < 100) {
    year += 2000;
  }

  const lastDay = new Date(year, month, 0).getDate();
  const mm = String(month).padStart(2, "0");
  const dd = String(lastDay).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function extractLastFour(cardNumber: string): string {
  return cardNumber.slice(-4);
}

export async function createCard(input: CreateCardInput): Promise<Card> {
  const user = await userRepository.findUserById(input.usuario_id);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  return cardRepository.createCard({
    usuario_id: input.usuario_id,
    titular: input.titular,
    ultimos_cuatro: extractLastFour(input.numero_tarjeta),
    fecha_expiracion: normalizeExpirationDate(input.fecha_expiracion),
  });
}
