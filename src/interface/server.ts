import { AuthService } from "../application/services/auth-service";
import { ProductService } from "../application/services/product-service";
import { ReservationService } from "../application/services/reservation-service";
import { env } from "../infrastructure/config";
import { prisma } from "../infrastructure/database/prisma-client";
import { CloudinaryProductImageStorage } from "../infrastructure/storage/cloudinary-product-image-storage";
import { ProductImageService } from "../application/services/product-image-service";
import { PrismaProductRepository, PrismaReservationRepository, PrismaUserRepository } from "../infrastructure/repositories/prisma-repositories";
import { createApp } from "./app";

const users = new PrismaUserRepository();
const products = new PrismaProductRepository();
const reservations = new PrismaReservationRepository();
const app = createApp({
  auth: new AuthService(users, { jwtSecret: env.JWT_SECRET, jwtExpiresIn: env.JWT_EXPIRES_IN }),
  products: new ProductService(products),
  reservations: new ReservationService(reservations, products),
  productImages: new ProductImageService(new CloudinaryProductImageStorage({
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET
  })),
  jwtSecret: env.JWT_SECRET,
  frontendUrl: env.FRONTEND_URL
});

const server = app.listen(env.PORT, () => console.info(`API de Hidden Frequency escuchando en el puerto ${env.PORT}.`));

function shutdown(signal: string): void {
  console.info(`Señal ${signal} recibida; cerrando la API.`);
  server.close(() => { void prisma.$disconnect().finally(() => process.exit(0)); });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));


