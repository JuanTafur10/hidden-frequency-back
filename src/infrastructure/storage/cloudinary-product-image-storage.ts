import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { AppError } from "../../domain/entities/app-error";
import type { ProductImageFile } from "../../domain/entities/product-image";
import type { ProductImageStorage } from "../../domain/repositories/product-image-storage";

export interface CloudinaryCredentials {
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
}

export class CloudinaryProductImageStorage implements ProductImageStorage {
  private readonly configured: boolean;

  constructor(credentials: CloudinaryCredentials) {
    this.configured = Boolean(credentials.cloudName && credentials.apiKey && credentials.apiSecret);
    if (this.configured) {
      cloudinary.config({ cloud_name: credentials.cloudName, api_key: credentials.apiKey, api_secret: credentials.apiSecret, secure: true });
    }
  }

  store(file: ProductImageFile): Promise<string> {
    if (!this.configured) {
      return Promise.reject(new AppError(503, "La carga de imágenes no está configurada.", "IMAGE_STORAGE_UNAVAILABLE"));
    }
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({
        folder: "hidden-frequency/products",
        public_id: randomUUID(),
        overwrite: false,
        resource_type: "image"
      }, (error, result) => {
        if (error || !result?.secure_url) {
          reject(new AppError(502, "No fue posible almacenar la imagen.", "IMAGE_STORAGE_FAILED"));
          return;
        }
        resolve(result.secure_url);
      });
      stream.end(Buffer.from(file.buffer));
    });
  }
}
