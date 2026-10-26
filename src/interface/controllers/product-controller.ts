import type { Request, Response } from "express";
import type { ProductService } from "../../application/services/product-service";
import type { ProductBody, ProductQuery, ProductUpdateBody } from "../validators/schemas";

export class ProductController {
  constructor(private readonly products: ProductService) {}
  list = async (request: Request, response: Response): Promise<void> => {
    const result = await this.products.list(request.query as unknown as ProductQuery);
    response.status(200).json(result);
  };
  find = async (request: Request, response: Response): Promise<void> => {
    const result = await this.products.findById(Number(request.params.id));
    response.status(200).json({ data: result });
  };
  create = async (request: Request, response: Response): Promise<void> => {
    const result = await this.products.create(request.body as ProductBody);
    response.status(201).json({ data: result });
  };
  update = async (request: Request, response: Response): Promise<void> => {
    const result = await this.products.update(Number(request.params.id), request.body as ProductUpdateBody);
    response.status(200).json({ data: result });
  };
  delete = async (request: Request, response: Response): Promise<void> => {
    await this.products.delete(Number(request.params.id));
    response.status(204).send();
  };
}
