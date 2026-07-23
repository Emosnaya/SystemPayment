import { query } from "../config/db";
import type { User } from "../types/models";

const USER_COLUMNS = `id, nombre, email, created_at, updated_at, deleted_at`;

export async function createUser(nombre: string, email: string): Promise<User> {
  const { rows } = await query<User>(
    `INSERT INTO usuarios (nombre, email)
     VALUES ($1, $2)
     RETURNING ${USER_COLUMNS}`,
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
    `SELECT ${USER_COLUMNS}
     FROM usuarios
     WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return rows[0] ?? null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const { rows } = await query<User>(
    `SELECT ${USER_COLUMNS}
     FROM usuarios
     WHERE email = $1 AND deleted_at IS NULL`,
    [email],
  );
  return rows[0] ?? null;
}
