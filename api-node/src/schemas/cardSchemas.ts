import { z } from "zod";

const cardNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{13,19}$/, "card_number must be 13–19 digits");

const expirationSchema = z
  .string()
  .trim()
  .regex(
    /^(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}|\d{2}\/\d{4})$/,
    "fecha_expiracion must be YYYY-MM-DD, MM/YY or MM/YYYY",
  );

export const createCardSchema = z.object({
  usuario_id: z.string().uuid("Invalid usuario_id"),
  titular: z.string().trim().min(1, "titular is required").max(150),
  numero_tarjeta: cardNumberSchema,
  fecha_expiracion: expirationSchema,
});

export type CreateCardInput = z.infer<typeof createCardSchema>;
