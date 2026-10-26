import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";
import { AuthService } from "../src/application/services/auth-service";
import { AppError } from "../src/domain/entities/app-error";
import type { User, Role } from "../src/domain/entities/entities";
import type { RegisterInput, UserRepository } from "../src/domain/repositories/repositories";

const secret = "secreto-de-prueba-largo-y-aleatorio-para-jwt";
const password = "Guitarra-Analogica-2026";
const createdAt = new Date("2026-01-01T00:00:00.000Z");

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "usuario-de-prueba",
    name: "María López",
    email: "maria@example.com",
    passwordHash: "hash-inicial",
    role: "user",
    createdAt,
    ...overrides
  };
}

function makeRepository(initialUser: User | null = null) {
  let storedUser = initialUser;
  const repository: UserRepository = {
    findByEmail: vi.fn(async (email: string) => storedUser?.email === email ? storedUser : null),
    findById: vi.fn(async (id: string) => storedUser?.id === id ? storedUser : null),
    create: vi.fn(async (input: RegisterInput & { passwordHash: string; role?: Role }) => {
      storedUser = makeUser({ name: input.name, email: input.email, passwordHash: input.passwordHash });
      return storedUser;
    })
  };
  return { repository, getStoredUser: () => storedUser };
}

describe("servicio de autenticación", () => {
  it("registra con bcrypt y nunca devuelve el hash", async () => {
    const { repository, getStoredUser } = makeRepository();
    const service = new AuthService(repository, { jwtSecret: secret, jwtExpiresIn: "1h" });

    const result = await service.register({ name: "María López", email: "maria@example.com", password });

    expect(result).not.toHaveProperty("passwordHash");
    expect(result).not.toHaveProperty("password");
    expect(await bcrypt.compare(password, getStoredUser()!.passwordHash)).toBe(true);
  });

  it("rechaza un correo duplicado con 409", async () => {
    const { repository } = makeRepository(makeUser());
    const service = new AuthService(repository, { jwtSecret: secret, jwtExpiresIn: "1h" });

    await expect(service.register({ name: "María López", email: "maria@example.com", password }))
      .rejects.toMatchObject({ statusCode: 409, code: "EMAIL_ALREADY_EXISTS" });
  });

  it("emite un JWT expirante con solo id y role como claims propios", async () => {
    const passwordHash = await bcrypt.hash(password, 4);
    const { repository } = makeRepository(makeUser({ passwordHash, role: "admin" }));
    const service = new AuthService(repository, { jwtSecret: secret, jwtExpiresIn: "1h" });

    const result = await service.login("maria@example.com", password);
    const payload = jwt.verify(result.token, secret);

    expect(typeof payload).not.toBe("string");
    if (typeof payload === "string") throw new Error("El token debe contener un objeto JWT.");
    expect(payload).toMatchObject({ id: "usuario-de-prueba", role: "admin" });
    expect(Object.keys(payload).sort()).toEqual(["exp", "iat", "id", "role"]);
    expect(result.user).not.toHaveProperty("passwordHash");
    expect(result.user).not.toHaveProperty("password");
  });

  it("usa el mismo error 401 cuando el correo o la contraseña no coinciden", async () => {
    const wrongPasswordHash = await bcrypt.hash(password, 4);
    const user = makeUser({ passwordHash: wrongPasswordHash });
    const absentUserService = new AuthService(makeRepository().repository, { jwtSecret: secret, jwtExpiresIn: "1h" });
    const wrongPasswordService = new AuthService(makeRepository(user).repository, { jwtSecret: secret, jwtExpiresIn: "1h" });

    const errors = await Promise.all([
      absentUserService.login("no-existe@example.com", password).catch((error: unknown) => error),
      wrongPasswordService.login("maria@example.com", "incorrecta").catch((error: unknown) => error)
    ]);
    expect(errors.every((error) => error instanceof AppError && error.statusCode === 401 && error.message === "Correo o contraseña incorrectos.")).toBe(true);
  });
});
