import type { Category, Product, Reservation, Role, User } from "../entities/entities";

export interface PaginationInput { page: number; limit: number; category?: Category; search?: string; minPrice?: number; maxPrice?: number }
export interface Page<T> { pagination: { page: number; limit: number; total: number; totalPages: number }; data: T[] }
export interface ProductInput { title: string; category: Category; price: number; description: string; imageUrl: string }
export interface RegisterInput { name: string; email: string; password: string }
export interface ReservationInput { productId?: number; requestedItem: string; notes?: string }
export interface ReservationUpdateInput { productId?: number | null; requestedItem?: string; notes?: string | null }
export interface ReservationView extends Reservation { product: Pick<Product, "id" | "title" | "category" | "price" | "imageUrl"> | null; user?: { id: string; name: string; email: string } }

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(input: RegisterInput & { passwordHash: string; role?: Role }): Promise<User>;
}
export interface ProductRepository {
  list(input: PaginationInput): Promise<Page<Product>>;
  findById(id: number): Promise<Product | null>;
  create(input: ProductInput): Promise<Product>;
  update(id: number, input: Partial<ProductInput>): Promise<Product | null>;
  delete(id: number): Promise<boolean>;
}
export interface ReservationRepository {
  create(userId: string, input: ReservationInput): Promise<ReservationView>;
  findById(id: string, userId: string, isAdmin: boolean): Promise<ReservationView | null>;
  listByUser(userId: string, page: number, limit: number): Promise<Page<ReservationView>>;
  listAll(page: number, limit: number): Promise<Page<ReservationView>>;
  update(id: string, userId: string, isAdmin: boolean, input: ReservationUpdateInput): Promise<ReservationView | null>;
  delete(id: string, userId: string, isAdmin: boolean): Promise<boolean>;
}
