import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

type RequestPart = "body" | "params" | "query";
export function validateRequest(schema: ZodType, part: RequestPart) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request[part]);
    if (!result.success) {
      next(result.error);
      return;
    }
    if (part === "body") request.body = result.data;
    else if (part === "params") Object.assign(request.params, result.data);
    else Object.assign(request.query, result.data);
    next();
  };
}
