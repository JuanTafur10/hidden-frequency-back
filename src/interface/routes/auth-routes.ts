import { Router } from "express";
import type { AuthService } from "../../application/services/auth-service";
import { AuthController } from "../controllers/auth-controller";
import { validateRequest } from "../middlewares/validate-request";
import { loginSchema, registerSchema } from "../validators/schemas";

export function createAuthRouter(service: AuthService): Router {
  const router = Router();
  const controller = new AuthController(service);
  router.post("/register", validateRequest(registerSchema, "body"), controller.register);
  router.post("/login", validateRequest(loginSchema, "body"), controller.login);
  return router;
}
