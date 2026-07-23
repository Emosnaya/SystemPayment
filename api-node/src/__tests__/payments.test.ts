import axios from "axios";
import request from "supertest";
import app from "../app";
import * as cardRepository from "../repositories/cardRepository";
import * as paymentRepository from "../repositories/paymentRepository";
import * as userRepository from "../repositories/userRepository";

jest.mock("axios");
jest.mock("../repositories/userRepository");
jest.mock("../repositories/cardRepository");
jest.mock("../repositories/paymentRepository");
jest.mock("../config/db", () => ({
  pool: {
    query: jest.fn().mockResolvedValue({ rows: [{ "?column?": 1 }] }),
    on: jest.fn(),
    connect: jest.fn(),
  },
  query: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedUserRepository = userRepository as jest.Mocked<typeof userRepository>;
const mockedCardRepository = cardRepository as jest.Mocked<typeof cardRepository>;
const mockedPaymentRepository =
  paymentRepository as jest.Mocked<typeof paymentRepository>;

const userId = "550e8400-e29b-41d4-a716-446655440000";
const cardId = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";

describe("POST /payments", () => {
  beforeEach(() => {
    mockedUserRepository.findUserById.mockResolvedValue({
      id: userId,
      nombre: "Ana García",
      email: "ana.garcia@example.com",
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    });

    mockedCardRepository.findCardById.mockResolvedValue({
      id: cardId,
      usuario_id: userId,
      titular: "Ana García",
      ultimos_cuatro: "1111",
      fecha_expiracion: new Date("2028-12-31"),
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns 201 with APPROVED when Python microservice approves", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        status: "APPROVED",
        transaction_id: "tx-approved-001",
      },
    });

    mockedPaymentRepository.createPayment.mockResolvedValue({
      id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      usuario_id: userId,
      tarjeta_id: cardId,
      monto: "150.75",
      estado: "APPROVED",
      transaction_id: "tx-approved-001",
      fecha_pago: new Date("2026-01-01T00:00:00.000Z"),
      created_at: new Date("2026-01-01T00:00:00.000Z"),
      updated_at: new Date("2026-01-01T00:00:00.000Z"),
      deleted_at: null,
    });

    const response = await request(app).post("/payments").send({
      usuario_id: userId,
      tarjeta_id: cardId,
      monto: 150.75,
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      estado: "APPROVED",
      transaction_id: "tx-approved-001",
      usuario_id: userId,
      tarjeta_id: cardId,
    });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "http://localhost:8000/process-payment",
      { amount: 150.75, card_id: cardId },
      expect.objectContaining({ timeout: 10_000 }),
    );
    expect(mockedPaymentRepository.createPayment).toHaveBeenCalledWith({
      usuario_id: userId,
      tarjeta_id: cardId,
      monto: 150.75,
      estado: "APPROVED",
      transaction_id: "tx-approved-001",
    });
  });

  it("returns 201 with REJECTED when Python microservice rejects", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        status: "REJECTED",
        transaction_id: "tx-rejected-001",
      },
    });

    mockedPaymentRepository.createPayment.mockResolvedValue({
      id: "8f14e45f-ceea-467c-9a4e-6c3e5c8f1a2b",
      usuario_id: userId,
      tarjeta_id: cardId,
      monto: "99.00",
      estado: "REJECTED",
      transaction_id: "tx-rejected-001",
      fecha_pago: new Date("2026-01-01T00:00:00.000Z"),
      created_at: new Date("2026-01-01T00:00:00.000Z"),
      updated_at: new Date("2026-01-01T00:00:00.000Z"),
      deleted_at: null,
    });

    const response = await request(app).post("/payments").send({
      usuario_id: userId,
      tarjeta_id: cardId,
      monto: 99,
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      estado: "REJECTED",
      transaction_id: "tx-rejected-001",
    });
    expect(mockedPaymentRepository.createPayment).toHaveBeenCalledWith({
      usuario_id: userId,
      tarjeta_id: cardId,
      monto: 99,
      estado: "REJECTED",
      transaction_id: "tx-rejected-001",
    });
  });

  it("returns 400 when DTO fails Zod validation", async () => {
    const response = await request(app).post("/payments").send({
      usuario_id: "not-a-uuid",
      tarjeta_id: cardId,
      monto: -10,
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
    });
    expect(mockedAxios.post).not.toHaveBeenCalled();
    expect(mockedPaymentRepository.createPayment).not.toHaveBeenCalled();
  });
});
