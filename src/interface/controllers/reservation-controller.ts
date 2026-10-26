import type { Request, Response } from "express";
import type { ReservationService } from "../../application/services/reservation-service";
import { AppError } from "../../domain/entities/app-error";
import type { AuthenticatedRequest } from "../middlewares/authentication";
import type { PageQuery, ReservationBody } from "../validators/schemas";

export class ReservationController {
  constructor(private readonly reservations: ReservationService) {}
  create = async (request: Request, response: Response): Promise<void> => {
    const userId = (request as AuthenticatedRequest).authUser?.id;
    if (!userId) throw new AppError(401, "Autenticación requerida.", "UNAUTHORIZED");
    const result = await this.reservations.create(userId, request.body as ReservationBody);
    response.status(201).json({ data: result });
  };
  mine = async (request: Request, response: Response): Promise<void> => {
    const authUser = (request as AuthenticatedRequest).authUser;
    if (!authUser) throw new AppError(401, "Autenticación requerida.", "UNAUTHORIZED");
    const { page, limit } = request.query as unknown as PageQuery;
    response.status(200).json(await this.reservations.mine(authUser.id, page, limit));
  };
  all = async (request: Request, response: Response): Promise<void> => {
    const { page, limit } = request.query as unknown as PageQuery;
    response.status(200).json(await this.reservations.all(page, limit));
  };
}
