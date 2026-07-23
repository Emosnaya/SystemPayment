import { z } from "zod";

export const createPaymentSchema = z.object({
  usuario_id: z.string().uuid("Invalid usuario_id"),
  tarjeta_id: z.string().uuid("Invalid tarjeta_id"),
  monto: z.coerce.number().positive("monto must be greater than 0"),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
