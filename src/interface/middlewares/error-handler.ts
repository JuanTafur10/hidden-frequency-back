import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../../domain/entities/app-error";

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction): void {
  if (error instanceof ZodError) {
    response.status(400).json({ error: "Solicitud inválida.", details: error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })) });
    return;
  }
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ error: error.message, ...(error.code ? { code: error.code } : {}) });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") { response.status(409).json({ error: "Ya existe un registro con esos datos." }); return; }
    if (error.code === "P2003") { response.status(400).json({ error: "La referencia enviada no existe o está en uso." }); return; }
    if (error.code === "P2025") { response.status(404).json({ error: "No se encontró el registro solicitado." }); return; }
  }
  console.error("Error inesperado en la API:", error instanceof Error ? error.message : "Error desconocido");
  response.status(500).json({ error: "Ocurrió un error interno." });
}
