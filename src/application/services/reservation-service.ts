import { AppError } from "../../domain/entities/app-error";
import type { AuthenticatedUser } from "../../domain/entities/entities";
import type { Page, ProductRepository, ReservationInput, ReservationRepository, ReservationUpdateInput, ReservationView } from "../../domain/repositories/repositories";

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
  async findById(id: string, actor: AuthenticatedUser): Promise<ReservationView> {
    const reservation = await this.reservations.findById(id, actor.id, actor.role === "admin");
    if (!reservation) throw new AppError(404, "No se encontró la reserva solicitada.", "RESERVATION_NOT_FOUND");
    return reservation;
  }
  all(page: number, limit: number): Promise<Page<ReservationView>> {
    return this.reservations.listAll(page, limit);
  }
  async update(id: string, actor: AuthenticatedUser, input: ReservationUpdateInput): Promise<ReservationView> {
    if (input.productId !== undefined && input.productId !== null && !await this.products.findById(input.productId)) {
      throw new AppError(404, "El producto solicitado no existe.", "PRODUCT_NOT_FOUND");
    }
    const updated = await this.reservations.update(id, actor.id, actor.role === "admin", input);
    if (!updated) throw new AppError(404, "No se encontró la reserva solicitada.", "RESERVATION_NOT_FOUND");
    return updated;
  }
  async delete(id: string, actor: AuthenticatedUser): Promise<void> {
    const deleted = await this.reservations.delete(id, actor.id, actor.role === "admin");
    if (!deleted) throw new AppError(404, "No se encontró la reserva solicitada.", "RESERVATION_NOT_FOUND");
  }
}
