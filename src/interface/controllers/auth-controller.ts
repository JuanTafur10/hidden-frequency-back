import type { Request, Response } from "express";
import type { AuthService } from "../../application/services/auth-service";
import type { RegisterBody, LoginBody } from "../validators/schemas";

export class AuthController {
  constructor(private readonly auth: AuthService) {}
  register = async (request: Request, response: Response): Promise<void> => {
    const user = await this.auth.register(request.body as RegisterBody);
    response.status(201).json({ data: user });
  };
  login = async (request: Request, response: Response): Promise<void> => {
    const input = request.body as LoginBody;
    const result = await this.auth.login(input.email, input.password);
    response.status(200).json(result);
  };
}
