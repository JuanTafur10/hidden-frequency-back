import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import request from "supertest";
import type { AuthService } from "../src/application/services/auth-service";
import type { ProductService } from "../src/application/services/product-service";
import type { ProductImageService } from "../src/application/services/product-image-service";
import type { ReservationService } from "../src/application/services/reservation-service";
import { AppError } from "../src/domain/entities/app-error";
import { createApp } from "../src/interface/app";

const secret = "secreto-de-prueba-con-al-menos-32-caracteres";
let receivedPage = 0;
let receivedLimit = 0;
let reservationAuthor: string | null = null;
let updatedReservation: { id: string; actorId: string; actorRole: string; requestedItem?: string } | null = null;
let deletedReservation: { id: string; actorId: string; actorRole: string } | null = null;
let updatedProductId: number | null = null;
let updatedProductPrice: number | undefined;
const app = createApp({
  auth: {} as AuthService,
  products: {
    list: async (input: { page: number; limit: number }) => {
      receivedPage = input.page;
      receivedLimit = input.limit;
      return { pagination: { page: input.page, limit: input.limit, total: 0, totalPages: 0 }, data: [] };
    },
    update: async (id: number, input: { price?: number }) => { updatedProductId = id; updatedProductPrice = input.price; return { id, ...input }; },
    delete: async () => undefined
  } as unknown as ProductService,
  productImages: { upload: async () => ({ imageUrl: "https://res.cloudinary.com/demo/image/upload/test.png" }) } as unknown as ProductImageService,
  reservations: {
    create: async (userId: string, input: { productId?: number; requestedItem: string; notes?: string }) => {
      reservationAuthor = userId;
      return { id: "reserva-1", userId, productId: input.productId ?? null, requestedItem: input.requestedItem, status: "pending", notes: input.notes ?? null, createdAt: new Date(), product: null };
    },
    findById: async (id: string, actor: { id: string; role: string }) => {
      if (actor.role !== "admin" && actor.id !== "usuario-1") throw new AppError(404, "No se encontró la reserva solicitada.", "RESERVATION_NOT_FOUND");
      return { id, userId: "usuario-1", productId: null, requestedItem: "Solicitud", status: "pending", notes: null, createdAt: new Date(), product: null };
    },
    mine: async () => ({ pagination: { page: 1, limit: 12, total: 0, totalPages: 0 }, data: [] }),
    all: async () => ({ pagination: { page: 1, limit: 12, total: 0, totalPages: 0 }, data: [] }),
    update: async (id: string, actor: { id: string; role: string }, input: { requestedItem?: string }) => {
      updatedReservation = { id, actorId: actor.id, actorRole: actor.role, ...input };
      return { id, userId: actor.id, productId: null, requestedItem: input.requestedItem ?? "Solicitud", status: "pending", notes: null, createdAt: new Date(), product: null };
    },
    delete: async (id: string, actor: { id: string; role: string }) => {
      deletedReservation = { id, actorId: actor.id, actorRole: actor.role };
      return undefined;
    }
  } as unknown as ReservationService,
  jwtSecret: secret,
  frontendUrl: "https://hidden-frequency.vercel.app"
});

function tokenFor(role: "admin" | "user", id?: string): string {
  return jwt.sign({ id: id ?? (role === "admin" ? "admin-1" : "usuario-1"), role }, secret, { expiresIn: "5m" });
}

describe("protección y validación de rutas", () => {
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
    const response = await request(app).delete("/api/products/1").set("Authorization", `Bearer ${tokenFor("user")}`);
    expect(response.status).toBe(403);
  });

  it("permite que admin ejecute la acción protegida", async () => {
    const response = await request(app).delete("/api/products/1").set("Authorization", `Bearer ${tokenFor("admin")}`);
    expect(response.status).toBe(204);
  });

  it("conserva id y body por separado al actualizar un producto", async () => {
    const response = await request(app).put("/api/products/7")
      .set("Authorization", `Bearer ${tokenFor("admin")}`)
      .send({ price: 250000 });
    expect(response.status).toBe(200);
    expect(updatedProductId).toBe(7);
    expect(updatedProductPrice).toBe(250000);
  });
  it("aplica la paginación predeterminada cuando no se envían parámetros", async () => {
    const response = await request(app).get("/api/products");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ pagination: { page: 1, limit: 12, total: 0, totalPages: 0 }, data: [] });
    expect(receivedPage).toBe(1);
    expect(receivedLimit).toBe(12);
  });

  it("rechaza ids y consultas fuera del formato esperado", async () => {
    const invalidId = await request(app).get("/api/products/abc");
    const invalidPageSize = await request(app).get("/api/products?limit=101");
    expect(invalidId.status).toBe(400);
    expect(invalidPageSize.status).toBe(400);
  });

  it("responde 400 si el JSON está mal formado", async () => {
    const response = await request(app).post("/api/auth/register").set("Content-Type", "application/json").send("{");
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("El cuerpo JSON no es válido.");
  });

  it("responde 400 por un body de reserva que intenta indicar otro usuario", async () => {
    const response = await request(app).post("/api/reservations")
      .set("Authorization", `Bearer ${tokenFor("user")}`)
      .send({ requestedItem: "Disco solicitado", userId: "otra-persona" });
    expect(response.status).toBe(400);
    expect(reservationAuthor).toBeNull();
  });

  it("asigna la reserva al id autenticado y no al body", async () => {
    const response = await request(app).post("/api/reservations")
      .set("Authorization", `Bearer ${tokenFor("user")}`)
      .send({ productId: 1, requestedItem: "Daft Punk - Discovery" });
    expect(response.status).toBe(201);
    expect(reservationAuthor).toBe("usuario-1");
    expect(response.body.data.userId).toBe("usuario-1");
  });

  it("protege la consulta global de reservas para admin", async () => {
    const userResponse = await request(app).get("/api/reservations").set("Authorization", `Bearer ${tokenFor("user")}`);
    const adminResponse = await request(app).get("/api/reservations").set("Authorization", `Bearer ${tokenFor("admin")}`);
    expect(userResponse.status).toBe(403);
    expect(adminResponse.status).toBe(200);
  });
  it("permite editar una reserva autenticada y toma el actor del token", async () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const response = await request(app).put(`/api/reservations/${id}`)
      .set("Authorization", `Bearer ${tokenFor("user")}`)
      .send({ requestedItem: "Vinilo actualizado" });
    expect(response.status).toBe(200);
    expect(updatedReservation).toEqual({ id, actorId: "usuario-1", actorRole: "user", requestedItem: "Vinilo actualizado" });
  });
  it("consulta una reserva propia, permite que admin la vea y oculta reservas ajenas", async () => {
    const id = "33333333-3333-4333-8333-333333333333";
    const own = await request(app).get(`/api/reservations/${id}`).set("Authorization", `Bearer ${tokenFor("user")}`);
    const foreign = await request(app).get(`/api/reservations/${id}`).set("Authorization", `Bearer ${tokenFor("user", "usuario-2")}`);
    const admin = await request(app).get(`/api/reservations/${id}`).set("Authorization", `Bearer ${tokenFor("admin")}`);
    expect(own.status).toBe(200);
    expect(own.body.data.userId).toBe("usuario-1");
    expect(foreign.status).toBe(404);
    expect(admin.status).toBe(200);
  });
  it("permite a admin eliminar una reserva y rechaza la operación sin token", async () => {
    const id = "22222222-2222-4222-8222-222222222222";
    const unauthorized = await request(app).delete(`/api/reservations/${id}`);
    const adminResponse = await request(app).delete(`/api/reservations/${id}`).set("Authorization", `Bearer ${tokenFor("admin")}`);
    expect(unauthorized.status).toBe(401);
    expect(adminResponse.status).toBe(204);
    expect(deletedReservation).toEqual({ id, actorId: "admin-1", actorRole: "admin" });
  });
  it("valida el identificador y el body al modificar una reserva", async () => {
    const invalidId = await request(app).put("/api/reservations/no-es-uuid")
      .set("Authorization", `Bearer ${tokenFor("user")}`).send({ requestedItem: "Vinilo actualizado" });
    const emptyBody = await request(app).put("/api/reservations/11111111-1111-4111-8111-111111111111")
      .set("Authorization", `Bearer ${tokenFor("user")}`).send({});
    expect(invalidId.status).toBe(400);
    expect(emptyBody.status).toBe(400);
  });

  it("exige rol admin para cargar imágenes y acepta un archivo válido", async () => {
    const unauthorized = await request(app).post("/api/uploads/products").attach("image", Buffer.from("png"), { filename: "producto.png", contentType: "image/png" });
    const forbidden = await request(app).post("/api/uploads/products").set("Authorization", `Bearer ${tokenFor("user")}`).attach("image", Buffer.from("png"), { filename: "producto.png", contentType: "image/png" });
    const uploaded = await request(app).post("/api/uploads/products").set("Authorization", `Bearer ${tokenFor("admin")}`).attach("image", Buffer.from("png"), { filename: "producto.png", contentType: "image/png" });
    expect(unauthorized.status).toBe(401);
    expect(forbidden.status).toBe(403);
    expect(uploaded.status).toBe(201);
    expect(uploaded.body.data.imageUrl).toContain("cloudinary.com");
  });
  it("limita CORS al origen configurado", async () => {
    const response = await request(app).get("/api/products").set("Origin", "https://hidden-frequency.vercel.app");
    expect(response.headers["access-control-allow-origin"]).toBe("https://hidden-frequency.vercel.app");
  });
});


