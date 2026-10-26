CREATE TYPE "user_role" AS ENUM ('admin', 'user');
CREATE TYPE "product_category" AS ENUM ('Vinilos', 'Pedales', 'Instrumentos');

CREATE TABLE "users" (
  "id" UUID NOT NULL,
  "nombre" VARCHAR(120) NOT NULL,
  "email" VARCHAR(254) NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "role" "user_role" NOT NULL DEFAULT 'user',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "products" (
  "id" SERIAL NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "category" "product_category" NOT NULL,
  "price" DECIMAL(12,2) NOT NULL,
  "description" VARCHAR(1000) NOT NULL,
  "image_url" VARCHAR(500) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "products_category_idx" ON "products"("category");
CREATE INDEX "products_price_idx" ON "products"("price");

CREATE TABLE "reservations" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "product_id" INTEGER,
  "requested_item" VARCHAR(240) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
  "notes" VARCHAR(1000),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reservations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "reservations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "reservations_user_id_created_at_idx" ON "reservations"("user_id", "created_at");
CREATE INDEX "reservations_product_id_idx" ON "reservations"("product_id");
