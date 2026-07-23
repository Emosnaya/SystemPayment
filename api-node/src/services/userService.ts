import { AppError } from "../errors/AppError";
import * as userRepository from "../repositories/userRepository";
import type { CreateUserInput } from "../schemas/userSchemas";
import type { User } from "../types/models";

export async function createUser(input: CreateUserInput): Promise<User> {
  const existing = await userRepository.findUserByEmail(input.email);
  if (existing) {
    throw new AppError(409, "Email already registered", { code: "CONFLICT" });
  }

  return userRepository.createUser(input.nombre, input.email);
}
