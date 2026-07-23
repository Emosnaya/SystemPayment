import { query } from "../config/db";
import type { User } from "../types/models";

export async function createUser(nombre: string, email: string): Promise<User> {
  const { rows } = await query<User>(
    `INSERT INTO usuarios (nombre, email)
     VALUES ($1, $2)
     RETURNING id, nombre, email, fecha_creacion`,
    [nombre, email],
  );

  const user = rows[0];
  if (!user) {
    throw new Error("Failed to create user");
  }
  return user;
}

export async function findUserById(id: string): Promise<User | null> {
  const { rows } = await query<User>(
    `SELECT id, nombre, email, fecha_creacion
     FROM usuarios
     WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const { rows } = await query<User>(
    `SELECT id, nombre, email, fecha_creacion
     FROM usuarios
     WHERE email = $1`,
    [email],
  );
  return rows[0] ?? null;
}
