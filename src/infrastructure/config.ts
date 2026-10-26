import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres."),
  JWT_EXPIRES_IN: z.string().min(1).default("1d"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  FRONTEND_URL: z.string().url().transform((value) => new URL(value).origin),
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional()
});

const parsedEnvironment = environmentSchema.safeParse(process.env);
if (parsedEnvironment.success) {
  const cloudinaryValues = [parsedEnvironment.data.CLOUDINARY_CLOUD_NAME, parsedEnvironment.data.CLOUDINARY_API_KEY, parsedEnvironment.data.CLOUDINARY_API_SECRET];
  const configuredCloudinaryValues = cloudinaryValues.filter(Boolean).length;
  if (configuredCloudinaryValues !== 0 && configuredCloudinaryValues !== cloudinaryValues.length) {
    throw new Error("Configura juntas CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.");
  }
}
if (!parsedEnvironment.success) {
  const details = parsedEnvironment.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  throw new Error(`Configuración de entorno inválida: ${details}`);
}
export const env = parsedEnvironment.data;


