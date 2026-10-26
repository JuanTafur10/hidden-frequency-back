import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

type RequestPart = "body" | "params" | "query";
export function validateRequest(schema: ZodType, part: RequestPart) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request[part]);
    if (!result.success) {
      next(result.error);
      return;
    }
    response.locals.validated = result.data;
    if (part === "body") request.body = result.data;
    next();
  };
}
