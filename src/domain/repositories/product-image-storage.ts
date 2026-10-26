import type { ProductImageFile } from "../entities/product-image";

export interface ProductImageStorage {
  store(file: ProductImageFile): Promise<string>;
}
