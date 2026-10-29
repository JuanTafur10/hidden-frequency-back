import { Prisma, type Product as PrismaProduct, type Reservation as PrismaReservation, type User as PrismaUser } from "../../generated/prisma/client";
import type { Product, Reservation, Role, User } from "../../domain/entities/entities";
import type { Page, PaginationInput, ProductInput, ProductRepository, ReservationInput, ReservationRepository, ReservationUpdateInput, ReservationView, RegisterInput, UserRepository } from "../../domain/repositories/repositories";
import { prisma } from "../database/prisma-client";

function mapUser(user: PrismaUser): User {
  return { id: user.id, name: user.name, email: user.email, passwordHash: user.passwordHash, role: user.role.toLowerCase() as Role, createdAt: user.createdAt };
}
function toDomainCategory(category: PrismaProduct["category"]): Product["category"] {
  switch (category) {
    case "VINILOS": return "Vinilos";
    case "PEDALES": return "Pedales";
    case "INSTRUMENTOS": return "Instrumentos";
  }
}
function toDatabaseCategory(category: Product["category"]): PrismaProduct["category"] {
  switch (category) {
    case "Vinilos": return "VINILOS";
    case "Pedales": return "PEDALES";
    case "Instrumentos": return "INSTRUMENTOS";
  }
}
function mapProduct(product: PrismaProduct): Product {
  return { id: product.id, title: product.title, category: toDomainCategory(product.category), price: Number(product.price), description: product.description, imageUrl: product.imageUrl, createdAt: product.createdAt, updatedAt: product.updatedAt };
}
function pageInfo(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? mapUser(user) : null;
  }
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? mapUser(user) : null;
  }
  async create(input: RegisterInput & { passwordHash: string; role?: Role }): Promise<User> {
    const user = await prisma.user.create({ data: {
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      ...(input.role === "admin" ? { role: "ADMIN" } : {})
    } });
    return mapUser(user);
  }
}

export class PrismaProductRepository implements ProductRepository {
  async list(input: PaginationInput): Promise<Page<Product>> {
    const where: Prisma.ProductWhereInput = {
      ...(input.category ? { category: toDatabaseCategory(input.category) } : {}),
      ...(input.search ? { OR: [
        { title: { contains: input.search, mode: "insensitive" } },
        { description: { contains: input.search, mode: "insensitive" } }
      ] } : {}),
      ...(input.minPrice !== undefined || input.maxPrice !== undefined ? { price: {
        ...(input.minPrice !== undefined ? { gte: input.minPrice } : {}),
        ...(input.maxPrice !== undefined ? { lte: input.maxPrice } : {})
      } } : {})
    };
    const [rows, total] = await prisma.$transaction([
      prisma.product.findMany({ where, skip: (input.page - 1) * input.limit, take: input.limit, orderBy: { id: "asc" } }),
      prisma.product.count({ where })
    ]);
    return { pagination: pageInfo(input.page, input.limit, total), data: rows.map(mapProduct) };
  }
  async findById(id: number): Promise<Product | null> {
    const product = await prisma.product.findUnique({ where: { id } });
    return product ? mapProduct(product) : null;
  }
  async create(input: ProductInput): Promise<Product> {
    return mapProduct(await prisma.product.create({ data: {
      ...input,
      category: toDatabaseCategory(input.category),
      price: new Prisma.Decimal(input.price)
    } }));
  }
  async update(id: number, input: Partial<ProductInput>): Promise<Product | null> {
    if (!await prisma.product.findUnique({ where: { id }, select: { id: true } })) return null;
    const data: Prisma.ProductUpdateInput = {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.category ? { category: toDatabaseCategory(input.category) } : {}),
      ...(input.price !== undefined ? { price: new Prisma.Decimal(input.price) } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {})
    };
    const product = await prisma.product.update({ where: { id }, data });
    return mapProduct(product);
  }
  async delete(id: number): Promise<boolean> {
    const result = await prisma.product.deleteMany({ where: { id } });
    return result.count > 0;
  }
}

function mapReservation(row: PrismaReservation & { product: PrismaProduct | null; user?: Pick<PrismaUser, "id" | "name" | "email"> }): ReservationView {
  const reservation: Reservation = {
    id: row.id, userId: row.userId, productId: row.productId, requestedItem: row.requestedItem,
    status: row.status, notes: row.notes, createdAt: row.createdAt
  };
  return {
    ...reservation,
    product: row.product ? {
      id: row.product.id, title: row.product.title, category: toDomainCategory(row.product.category),
      price: Number(row.product.price), imageUrl: row.product.imageUrl
    } : null,
    ...(row.user ? { user: { id: row.user.id, name: row.user.name, email: row.user.email } } : {})
  };
}

export class PrismaReservationRepository implements ReservationRepository {
  async create(userId: string, input: ReservationInput): Promise<ReservationView> {
    const row = await prisma.reservation.create({
      data: { userId, productId: input.productId, requestedItem: input.requestedItem, notes: input.notes },
      include: { product: true }
    });
    return mapReservation(row);
  }
  async listByUser(userId: string, page: number, limit: number): Promise<Page<ReservationView>> {
    const where = { userId };
    const [rows, total] = await prisma.$transaction([
      prisma.reservation.findMany({ where, include: { product: true }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.reservation.count({ where })
    ]);
    return { pagination: pageInfo(page, limit, total), data: rows.map(mapReservation) };
  }
  async listAll(page: number, limit: number): Promise<Page<ReservationView>> {
    const [rows, total] = await prisma.$transaction([
      prisma.reservation.findMany({ include: { product: true, user: { select: { id: true, name: true, email: true } } }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.reservation.count()
    ]);
    return { pagination: pageInfo(page, limit, total), data: rows.map(mapReservation) };
  }
  async update(id: string, userId: string, isAdmin: boolean, input: ReservationUpdateInput): Promise<ReservationView | null> {
    const where: Prisma.ReservationWhereInput = { id, ...(isAdmin ? {} : { userId }) };
    const data: Prisma.ReservationUpdateManyMutationInput = {
      ...(input.productId !== undefined ? { productId: input.productId } : {}),
      ...(input.requestedItem !== undefined ? { requestedItem: input.requestedItem } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {})
    };
    const updated = await prisma.reservation.updateMany({ where, data });
    if (!updated.count) return null;
    const row = await prisma.reservation.findUnique({ where: { id }, include: { product: true, user: { select: { id: true, name: true, email: true } } } });
    return row ? mapReservation(row) : null;
  }
  async delete(id: string, userId: string, isAdmin: boolean): Promise<boolean> {
    const where: Prisma.ReservationWhereInput = { id, ...(isAdmin ? {} : { userId }) };
    const deleted = await prisma.reservation.deleteMany({ where });
    return deleted.count > 0;
  }
}



