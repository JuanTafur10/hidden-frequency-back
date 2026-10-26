import { AppError } from "../../domain/entities/app-error";
import type { ProductImageFile } from "../../domain/entities/product-image";
import type { ProductImageStorage } from "../../domain/repositories/product-image-storage";

const maxImageBytes = 5 * 1024 * 1024;
const supportedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function matchesDeclaredFormat(file: ProductImageFile): boolean {
  const bytes = Buffer.from(file.buffer);
  if (file.mimeType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.mimeType === "image/png") return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (file.mimeType === "image/webp") return bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  return false;
}

export class ProductImageService {
  constructor(private readonly storage: ProductImageStorage) {}

  async upload(file: ProductImageFile): Promise<{ imageUrl: string }> {
    if (!supportedMimeTypes.has(file.mimeType) || !matchesDeclaredFormat(file)) {
      throw new AppError(400, "El archivo debe ser una imagen JPEG, PNG o WebP válida.", "INVALID_IMAGE");
    }
    if (file.buffer.byteLength > maxImageBytes) {
      throw new AppError(413, "La imagen no puede superar 5 MB.", "IMAGE_TOO_LARGE");
    }
    const imageUrl = await this.storage.store(file);
    return { imageUrl };
  }
}
