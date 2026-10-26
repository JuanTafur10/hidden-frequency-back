import { z } from "zod";

const categorySchema = z.enum(["Vinilos", "Pedales", "Instrumentos"]);
const positivePrice = z.coerce.number().finite().positive().max(1000000000);
const passwordSchema = z.string().min(8).max(1024).refine((value) => Buffer.byteLength(value, "utf8") <= 72, "La contraseña no puede superar 72 bytes.");
const imageUrlSchema = z.string().trim().min(1).max(500).refine((value) =>
  value.startsWith("assets/") || (value.startsWith("/") && !value.startsWith("//")) || /^https?:\/\/\S+$/i.test(value),
  "Usa una ruta local o una URL HTTP/HTTPS para la imagen."
);

export const registerSchema = z.object({
  name: z.string().trim().min(3).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: passwordSchema
}).strict();

export const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: passwordSchema
}).strict();

export const productBodySchema = z.object({
  title: z.string().trim().min(2).max(180),
  category: categorySchema,
  price: positivePrice,
  description: z.string().trim().min(5).max(1000),
  imageUrl: imageUrlSchema
}).strict();

export const productUpdateSchema = productBodySchema.partial().refine((body) => Object.keys(body).length > 0, "Envía al menos un campo para actualizar.").strict();

export const productIdSchema = z.object({ id: z.coerce.number().int().positive() }).strict();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
  category: categorySchema.optional(),
  search: z.string().trim().min(1).max(100).optional(),
  minPrice: positivePrice.optional(),
  maxPrice: positivePrice.optional()
}).strict().refine((query) => query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice, {
  message: "minPrice no puede ser mayor que maxPrice."
});

export const reservationBodySchema = z.object({
  productId: z.coerce.number().int().positive().optional(),
  requestedItem: z.string().trim().min(3).max(240),
  notes: z.string().trim().max(1000).optional()
}).strict();

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12)
}).strict();

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
export type ProductBody = z.infer<typeof productBodySchema>;
export type ProductUpdateBody = z.infer<typeof productUpdateSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
export type ReservationBody = z.infer<typeof reservationBodySchema>;
export type PageQuery = z.infer<typeof pageQuerySchema>;

