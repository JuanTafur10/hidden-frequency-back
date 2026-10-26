import cors from "cors";
import express, { type Express, type Request, type Response } from "express";
import type { AuthService } from "../application/services/auth-service";
import type { ProductService } from "../application/services/product-service";
import type { ReservationService } from "../application/services/reservation-service";
import { errorHandler } from "./middlewares/error-handler";
import { createAuthRouter } from "./routes/auth-routes";
import { createProductRouter } from "./routes/product-routes";
import { createReservationRouter } from "./routes/reservation-routes";

export interface AppDependencies {
  auth: AuthService;
  products: ProductService;
  reservations: ReservationService;
  jwtSecret: string;
  frontendUrl: string;
}

export function createApp(dependencies: AppDependencies): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: dependencies.frontendUrl, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));
  app.use(express.json({ limit: "32kb" }));
  app.get("/health", (_request: Request, response: Response) => response.status(200).json({ status: "ok" }));
  app.use("/api/auth", createAuthRouter(dependencies.auth));
  app.use("/api/products", createProductRouter(dependencies.products, dependencies.jwtSecret));
  app.use("/api/reservations", createReservationRouter(dependencies.reservations, dependencies.jwtSecret));
  app.use((_request: Request, response: Response) => response.status(404).json({ error: "Ruta no encontrada." }));
  app.use(errorHandler);
  return app;
}
