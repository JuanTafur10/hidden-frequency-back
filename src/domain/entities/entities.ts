export type Role = "admin" | "user";
export type Category = "Vinilos" | "Pedales" | "Instrumentos";

export interface AuthenticatedUser {
  id: string;
  role: Role;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
}

export interface PublicUser extends Omit<User, "passwordHash"> {}

export interface Product {
  id: number;
  title: string;
  category: Category;
  price: number;
  description: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reservation {
  id: string;
  userId: string;
  productId: number | null;
  requestedItem: string;
  status: string;
  notes: string | null;
  createdAt: Date;
}
