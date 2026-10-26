import { AppError } from "../../domain/entities/app-error";
import type { Page, ProductRepository, ReservationInput, ReservationRepository, ReservationView } from "../../domain/repositories/repositories";

export class ReservationService {
  constructor(private readonly reservations: ReservationRepository, private readonly products: ProductRepository) {}
  async create(userId: string, input: ReservationInput): Promise<ReservationView> {
    if (input.productId !== undefined && !await this.products.findById(input.productId)) {
      throw new AppError(404, "El producto solicitado no existe.", "PRODUCT_NOT_FOUND");
    }
    return this.reservations.create(userId, input);
  }
  mine(userId: string, page: number, limit: number): Promise<Page<ReservationView>> {
    return this.reservations.listByUser(userId, page, limit);
  }
  all(page: number, limit: number): Promise<Page<ReservationView>> {
    return this.reservations.listAll(page, limit);
  }
}
