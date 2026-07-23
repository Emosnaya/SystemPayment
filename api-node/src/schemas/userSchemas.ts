import { z } from "zod";

export const createUserSchema = z.object({
  nombre: z.string().trim().min(1, "nombre is required").max(150),
  email: z.string().trim().email("Invalid email").max(255),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const userIdParamSchema = z.object({
  id: z.string().uuid("Invalid user id"),
});
