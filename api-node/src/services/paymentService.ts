import axios from "axios";
import { env } from "../config/env";
import { AppError } from "../errors/AppError";
import * as cardRepository from "../repositories/cardRepository";
import * as paymentRepository from "../repositories/paymentRepository";
import * as userRepository from "../repositories/userRepository";
import type { CreatePaymentInput } from "../schemas/paymentSchemas";
import type { Payment, PaymentStatus } from "../types/models";

interface ProcessPaymentResponse {
  status: PaymentStatus;
  transaction_id: string;
}

/**
 * Consulta al microservicio Python para aprobar o rechazar el pago.
 */
export async function processPaymentWithMicroservice(
  amount: number,
  cardId: string,
): Promise<ProcessPaymentResponse> {
  try {
    const { data } = await axios.post<ProcessPaymentResponse>(
      `${env.paymentServiceUrl}/process-payment`,
      {
        amount,
        card_id: cardId,
      },
      { timeout: 10_000 },
    );

    if (data.status !== "APPROVED" && data.status !== "REJECTED") {
      throw new AppError(502, "Invalid response from payment service", {
        code: "BAD_GATEWAY",
      });
    }

    return data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      throw new AppError(502, "Payment service unavailable", {
        code: "BAD_GATEWAY",
        details: error.response?.data ?? error.message,
      });
    }

    throw error;
  }
}

export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  const user = await userRepository.findUserById(input.usuario_id);
  if (!user) {
    throw new AppError(404, "User not found", { code: "NOT_FOUND" });
  }

  const card = await cardRepository.findCardById(input.tarjeta_id);
  if (!card) {
    throw new AppError(404, "Card not found", { code: "NOT_FOUND" });
  }

  if (card.usuario_id !== input.usuario_id) {
    throw new AppError(400, "Card does not belong to the specified user", {
      code: "BAD_REQUEST",
    });
  }

  const result = await processPaymentWithMicroservice(
    input.monto,
    input.tarjeta_id,
  );

  return paymentRepository.createPayment({
    usuario_id: input.usuario_id,
    tarjeta_id: input.tarjeta_id,
    monto: input.monto,
    estado: result.status,
    transaction_id: result.transaction_id,
  });
}

export async function getPaymentsByUserId(userId: string): Promise<Payment[]> {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new AppError(404, "User not found", { code: "NOT_FOUND" });
  }

  return paymentRepository.findPaymentsByUserId(userId);
}
