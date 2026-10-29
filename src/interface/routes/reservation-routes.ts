import { Router } from "express";
import type { ReservationService } from "../../application/services/reservation-service";
import { ReservationController } from "../controllers/reservation-controller";
import { createAuthenticate, requireRole } from "../middlewares/authentication";
import { validateRequest } from "../middlewares/validate-request";
import { pageQuerySchema, reservationBodySchema, reservationIdSchema, reservationUpdateSchema } from "../validators/schemas";

export function createReservationRouter(service: ReservationService, jwtSecret: string): Router {
  const router = Router();
  const controller = new ReservationController(service);
  const authenticate = createAuthenticate(jwtSecret);
  router.post("/", authenticate, validateRequest(reservationBodySchema, "body"), controller.create);
  router.get("/mias", authenticate, validateRequest(pageQuerySchema, "query"), controller.mine);
  router.get("/", authenticate, requireRole("admin"), validateRequest(pageQuerySchema, "query"), controller.all);
  router.put("/:id", authenticate, validateRequest(reservationIdSchema, "params"), validateRequest(reservationUpdateSchema, "body"), controller.update);
  router.delete("/:id", authenticate, validateRequest(reservationIdSchema, "params"), controller.delete);
  return router;
}
