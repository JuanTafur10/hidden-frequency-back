import type { Page, ReservationInput, ReservationRepository, ReservationView } from "../../domain/repositories/repositories";

export class ReservationService {
  constructor(private readonly reservations: ReservationRepository) {}
  create(userId: string, input: ReservationInput): Promise<ReservationView> {
    return this.reservations.create(userId, input);
  }
  mine(userId: string, page: number, limit: number): Promise<Page<ReservationView>> {
    return this.reservations.listByUser(userId, page, limit);
  }
  all(page: number, limit: number): Promise<Page<ReservationView>> {
    return this.reservations.listAll(page, limit);
  }
}
