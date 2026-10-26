import { Router } from "express";
import type { ProductImageService } from "../../application/services/product-image-service";
import { ProductImageController } from "../controllers/product-image-controller";
import { createAuthenticate, requireRole } from "../middlewares/authentication";
import { productImageUpload } from "../middlewares/product-image-upload";

export function createUploadRouter(images: ProductImageService, jwtSecret: string): Router {
  const router = Router();
  const controller = new ProductImageController(images);
  router.post("/products", createAuthenticate(jwtSecret), requireRole("admin"), productImageUpload.single("image"), controller.upload);
  return router;
}
