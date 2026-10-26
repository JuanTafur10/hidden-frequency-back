import type { Request, Response } from "express";
import type { ProductService } from "../../application/services/product-service";
import type { ProductBody, ProductQuery, ProductUpdateBody } from "../validators/schemas";

export class ProductController {
  constructor(private readonly products: ProductService) {}
  list = async (request: Request, response: Response): Promise<void> => {
    const result = await this.products.list(response.locals.validated as ProductQuery);
    response.status(200).json(result);
  };
  find = async (request: Request, response: Response): Promise<void> => {
    const result = await this.products.findById(Number((response.locals.validated as { id: number }).id));
    response.status(200).json({ data: result });
  };
  create = async (request: Request, response: Response): Promise<void> => {
    const result = await this.products.create(response.locals.validated as ProductBody);
    response.status(201).json({ data: result });
  };
  update = async (request: Request, response: Response): Promise<void> => {
    const result = await this.products.update(Number((response.locals.validated as { id: number }).id), response.locals.validated as ProductUpdateBody);
    response.status(200).json({ data: result });
  };
  delete = async (request: Request, response: Response): Promise<void> => {
    await this.products.delete(Number((response.locals.validated as { id: number }).id));
    response.status(204).send();
  };
}

