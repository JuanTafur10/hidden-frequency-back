import type { Request, Response } from "express";
import { AppError } from "../../domain/entities/app-error";
import type { ProductImageService } from "../../application/services/product-image-service";

export class ProductImageController {
  constructor(private readonly images: ProductImageService) {}
  upload = async (request: Request, response: Response): Promise<void> => {
    if (!request.file) throw new AppError(400, "Adjunta un archivo en el campo image.", "IMAGE_REQUIRED");
    const result = await this.images.upload({
      buffer: request.file.buffer,
      mimeType: request.file.mimetype,
      originalName: request.file.originalname
    });
    response.status(201).json({ data: result });
  };
}
