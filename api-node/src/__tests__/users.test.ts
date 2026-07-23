import request from "supertest";
import app from "../app";
import * as userRepository from "../repositories/userRepository";

jest.mock("../repositories/userRepository");

const mockedUserRepository = userRepository as jest.Mocked<typeof userRepository>;

describe("POST /users", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("creates a user with valid DTO", async () => {
    const created = {
      id: "11111111-1111-1111-1111-111111111111",
      nombre: "Ana García",
      email: "ana.garcia@example.com",
      fecha_creacion: new Date("2026-01-01T00:00:00.000Z"),
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
    expect(response.body).toMatchObject({ error: "Validation failed" });
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
    expect(response.body).toMatchObject({ error: "Validation failed" });
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
    expect(mockedUserRepository.createUser).not.toHaveBeenCalled();
  });

  it("returns 409 when email is already registered", async () => {
    mockedUserRepository.findUserByEmail.mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      nombre: "Existing",
      email: "ana.garcia@example.com",
      fecha_creacion: new Date(),
    });

    const response = await request(app).post("/users").send({
      nombre: "Ana García",
      email: "ana.garcia@example.com",
    });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe("Email already registered");
    expect(mockedUserRepository.createUser).not.toHaveBeenCalled();
  });
});
