import request from "supertest";
import app from "../app";
import * as userRepository from "../repositories/userRepository";

jest.mock("../repositories/userRepository");
jest.mock("../config/db", () => ({
  pool: {
    query: jest.fn().mockResolvedValue({ rows: [{ "?column?": 1 }] }),
    on: jest.fn(),
    connect: jest.fn(),
  },
  query: jest.fn(),
}));

const mockedUserRepository = userRepository as jest.Mocked<typeof userRepository>;

describe("POST /users", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("creates a user with valid DTO", async () => {
    const created = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      nombre: "Ana García",
      email: "ana.garcia@example.com",
      created_at: new Date("2026-01-01T00:00:00.000Z"),
      updated_at: new Date("2026-01-01T00:00:00.000Z"),
      deleted_at: null,
    };

    mockedUserRepository.findUserByEmail.mockResolvedValue(null);
    mockedUserRepository.createUser.mockResolvedValue(created);

    const response = await request(app).post("/users").send({
      nombre: "Ana García",
      email: "ana.garcia@example.com",
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: created.id,
      nombre: created.nombre,
      email: created.email,
    });
    expect(mockedUserRepository.createUser).toHaveBeenCalledWith(
      "Ana García",
      "ana.garcia@example.com",
    );
  });

  it("returns 400 when nombre is missing (Zod validation)", async () => {
    const response = await request(app).post("/users").send({
      email: "ana.garcia@example.com",
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
    });
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: expect.arrayContaining(["nombre"]) }),
      ]),
    );
    expect(mockedUserRepository.createUser).not.toHaveBeenCalled();
  });

  it("returns 400 when email is invalid (Zod validation)", async () => {
    const response = await request(app).post("/users").send({
      nombre: "Ana García",
      email: "not-an-email",
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
    });
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: expect.arrayContaining(["email"]) }),
      ]),
    );
    expect(mockedUserRepository.createUser).not.toHaveBeenCalled();
  });

  it("returns 400 when body is empty (Zod validation)", async () => {
    const response = await request(app).post("/users").send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation failed");
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(mockedUserRepository.createUser).not.toHaveBeenCalled();
  });

  it("returns 409 when email is already registered", async () => {
    mockedUserRepository.findUserByEmail.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      nombre: "Existing",
      email: "ana.garcia@example.com",
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    });

    const response = await request(app).post("/users").send({
      nombre: "Ana García",
      email: "ana.garcia@example.com",
    });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      error: "Email already registered",
      code: "CONFLICT",
    });
    expect(mockedUserRepository.createUser).not.toHaveBeenCalled();
  });
});
