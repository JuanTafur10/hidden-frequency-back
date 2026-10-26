import { AppError } from "../../domain/entities/app-error";
import type { Product } from "../../domain/entities/entities";
import type { Page, PaginationInput, ProductInput, ProductRepository } from "../../domain/repositories/repositories";

export class ProductService {
  constructor(private readonly products: ProductRepository) {}
  list(input: PaginationInput): Promise<Page<Product>> { return this.products.list(input); }
  async findById(id: number): Promise<Product> {
    const product = await this.products.findById(id);
    if (!product) throw new AppError(404, "Producto no encontrado.", "PRODUCT_NOT_FOUND");
    return product;
  }
  create(input: ProductInput): Promise<Product> { return this.products.create(input); }
  async update(id: number, input: Partial<ProductInput>): Promise<Product> {
    const product = await this.products.update(id, input);
    if (!product) throw new AppError(404, "Producto no encontrado.", "PRODUCT_NOT_FOUND");
    return product;
  }
  async delete(id: number): Promise<void> {
    const deleted = await this.products.delete(id);
    if (!deleted) throw new AppError(404, "Producto no encontrado.", "PRODUCT_NOT_FOUND");
  }
}
