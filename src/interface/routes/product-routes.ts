import { Router } from "express";
import type { ProductService } from "../../application/services/product-service";
import { ProductController } from "../controllers/product-controller";
import { createAuthenticate, requireRole } from "../middlewares/authentication";
import { validateRequest } from "../middlewares/validate-request";
import { productBodySchema, productIdSchema, productQuerySchema, productUpdateSchema } from "../validators/schemas";

export function createProductRouter(service: ProductService, jwtSecret: string): Router {
  const router = Router();
  const controller = new ProductController(service);
  const authenticate = createAuthenticate(jwtSecret);
  const adminOnly = requireRole("admin");

  router.get("/", validateRequest(productQuerySchema, "query"), controller.list);
  router.get("/:id", validateRequest(productIdSchema, "params"), controller.find);
  router.post("/", authenticate, adminOnly, validateRequest(productBodySchema, "body"), controller.create);
  router.put("/:id", authenticate, adminOnly, validateRequest(productIdSchema, "params"), validateRequest(productUpdateSchema, "body"), controller.update);
  router.delete("/:id", authenticate, adminOnly, validateRequest(productIdSchema, "params"), controller.delete);
  return router;
}
