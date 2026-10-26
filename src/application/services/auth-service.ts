import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { PublicUser, User } from "../../domain/entities/entities";
import { AppError } from "../../domain/entities/app-error";
import type { RegisterInput, UserRepository } from "../../domain/repositories/repositories";

export interface AuthConfig { jwtSecret: string; jwtExpiresIn: string }
export interface AuthResult { user: PublicUser; token: string }

function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

export class AuthService {
  constructor(private readonly users: UserRepository, private readonly config: AuthConfig) {}

  async register(input: RegisterInput): Promise<PublicUser> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) throw new AppError(409, "Ya existe una cuenta con ese correo.", "EMAIL_ALREADY_EXISTS");
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.users.create({ ...input, passwordHash });
    return toPublicUser(user);
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.users.findByEmail(email);
    const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !passwordMatches) throw new AppError(401, "Correo o contraseña incorrectos.", "INVALID_CREDENTIALS");
    const token = jwt.sign({ id: user.id, role: user.role }, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiresIn as SignOptions["expiresIn"]
    });
    return { user: toPublicUser(user), token };
  }
}


