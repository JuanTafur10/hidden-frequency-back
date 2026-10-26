import { PrismaClient, ProductCategory, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const products = [
  { id: 1, title: "Daft Punk - Discovery", category: ProductCategory.VINILOS, price: 250000, description: "Edición especial 2LP del clásico de 2001. Estado: Mint (Nuevo).", imageUrl: "assets/images/daft-punk.jpg" },
  { id: 2, title: "Boss DS-1 Distortion", category: ProductCategory.PEDALES, price: 350000, description: "El pedal de distorsión más clásico. Tono agresivo para guitarra y sintes.", imageUrl: "assets/images/boss-DS-1.jpg" },
  { id: 3, title: "Korg Minilogue XD", category: ProductCategory.INSTRUMENTOS, price: 980000, description: "Sintetizador analógico polifónico de 4 voces con efectos digitales.", imageUrl: "assets/images/korg.jpg" },
  { id: 4, title: "MF DOOM - Madvillainy", category: ProductCategory.VINILOS, price: 420000, description: "Obra maestra del hip hop underground. Prensado de 180g.", imageUrl: "assets/images/madvillainy.jpg" },
  { id: 5, title: "Strymon BigSky", category: ProductCategory.PEDALES, price: 479000, description: "Reverb de reverberaciones algorítmicas de calidad de estudio.", imageUrl: "assets/images/strymon-bigsky.jpg" },
  { id: 6, title: "Technics SL-1200MK7", category: ProductCategory.INSTRUMENTOS, price: 598000, description: "Tornamesa profesional para DJ de tracción directa. El estándar de la industria.", imageUrl: "assets/images/Technics-SL-1200MK7-Audiofilo-Store-2.jpg" }
];

async function main(): Promise<void> {
  for (const product of products) {
    await prisma.product.upsert({ where: { id: product.id }, update: product, create: product });
  }
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('products', 'id'), GREATEST((SELECT MAX(id) FROM products), 1))`);

  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { name: process.env.SEED_ADMIN_NAME?.trim() || "Administración", passwordHash, role: UserRole.ADMIN },
      create: { name: process.env.SEED_ADMIN_NAME?.trim() || "Administración", email: adminEmail, passwordHash, role: UserRole.ADMIN }
    });
    console.info(`Administrador de seed actualizado: ${adminEmail}`);
  } else {
    console.info("No se creó administrador: define SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD localmente.");
  }
  console.info(`Catálogo sincronizado: ${products.length} productos.`);
}

main()
  .catch((error: unknown) => { console.error("Falló el seed de Hidden Frequency.", error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
