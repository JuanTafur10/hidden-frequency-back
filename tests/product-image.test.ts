import { describe, expect, it, vi } from "vitest";
import { ProductImageService } from "../src/application/services/product-image-service";
import { AppError } from "../src/domain/entities/app-error";
import type { ProductImageStorage } from "../src/domain/repositories/product-image-storage";
import { CloudinaryProductImageStorage } from "../src/infrastructure/storage/cloudinary-product-image-storage";

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const validFile = { buffer: png, mimeType: "image/png", originalName: "producto.png" };

describe("carga de imágenes del catálogo", () => {
  it("valida el formato y entrega la imagen al almacenamiento", async () => {
    const store = vi.fn(async () => "https://res.cloudinary.com/hidden-frequency/products/test.png");
    const storage: ProductImageStorage = { store };
    const service = new ProductImageService(storage);

    await expect(service.upload(validFile)).resolves.toEqual({ imageUrl: "https://res.cloudinary.com/hidden-frequency/products/test.png" });
    expect(store).toHaveBeenCalledOnce();
  });

  it("rechaza contenido que no coincide con el MIME declarado", async () => {
    const storage: ProductImageStorage = { store: vi.fn(async () => "https://image.test/product.png") };
    const service = new ProductImageService(storage);

    await expect(service.upload({ ...validFile, buffer: Buffer.from("no es una imagen") }))
      .rejects.toMatchObject({ statusCode: 400, code: "INVALID_IMAGE" });
  });

  it("limita imágenes a 5 MB", async () => {
    const storage: ProductImageStorage = { store: vi.fn(async () => "https://image.test/product.png") };
    const service = new ProductImageService(storage);
    const tooLarge = Buffer.alloc(5 * 1024 * 1024 + 1);
    tooLarge.set(png.subarray(0, 8));

    await expect(service.upload({ ...validFile, buffer: tooLarge }))
      .rejects.toMatchObject({ statusCode: 413, code: "IMAGE_TOO_LARGE" });
  });

  it("responde que falta configurar Cloudinary en vez de simular una subida", async () => {
    const storage = new CloudinaryProductImageStorage({});
    await expect(storage.store(validFile)).rejects.toBeInstanceOf(AppError);
  });
});
