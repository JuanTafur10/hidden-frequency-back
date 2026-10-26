import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import request from "supertest";
import type { AuthService } from "../src/application/services/auth-service";
import type { ProductService } from "../src/application/services/product-service";
import type { ReservationService } from "../src/application/services/reservation-service";
import { createApp } from "../src/interface/app";

const secret = "secreto-de-prueba-con-al-menos-32-caracteres";
const app = createApp({
  auth: {} as AuthService,
  products: { delete: async () => undefined } as unknown as ProductService,
  reservations: {} as ReservationService,
  jwtSecret: secret,
  frontendUrl: "https://hidden-frequency.vercel.app"
});

describe("protección de rutas del catálogo", () => {
  it("responde 401 cuando falta el token", async () => {
    const response = await request(app).delete("/api/products/1");
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Autenticación requerida.");
  });

  it("responde 401 cuando el token es inválido", async () => {
    const response = await request(app).delete("/api/products/1").set("Authorization", "Bearer token-invalido");
    expect(response.status).toBe(401);
  });

  it("responde 403 a un usuario autenticado sin rol admin", async () => {
    const token = jwt.sign({ id: "usuario-1", role: "user" }, secret, { expiresIn: "5m" });
    const response = await request(app).delete("/api/products/1").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  it("permite que admin ejecute la acción protegida", async () => {
    const token = jwt.sign({ id: "admin-1", role: "admin" }, secret, { expiresIn: "5m" });
    const response = await request(app).delete("/api/products/1").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(204);
  });
});
