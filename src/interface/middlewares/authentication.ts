import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { AppError } from "../../domain/entities/app-error";
import type { Role } from "../../domain/entities/entities";

export interface AuthenticatedRequest extends Request {
  authUser?: { id: string; role: Role };
}

export function createAuthenticate(jwtSecret: string) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const authorization = request.header("Authorization");
    const match = authorization?.match(/^Bearer\s+(.+)$/i);
    if (!match) return next(new AppError(401, "Autenticación requerida.", "UNAUTHORIZED"));
    try {
      const payload = jwt.verify(match[1], jwtSecret);
      if (typeof payload === "string") throw new Error("Invalid token payload");
      const claims = payload as JwtPayload & { role?: unknown };
      if (typeof claims.id !== "string" || (claims.role !== "admin" && claims.role !== "user")) {
        throw new Error("Invalid token claims");
      }
      (request as AuthenticatedRequest).authUser = { id: claims.id, role: claims.role };
      next();
    } catch {
      next(new AppError(401, "Token inválido o expirado.", "INVALID_TOKEN"));
    }
  };
}

export function requireRole(...roles: Role[]) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const user = (request as AuthenticatedRequest).authUser;
    if (!user) return next(new AppError(401, "Autenticación requerida.", "UNAUTHORIZED"));
    if (!roles.includes(user.role)) return next(new AppError(403, "No tienes permiso para realizar esta acción.", "FORBIDDEN"));
    next();
  };
}

