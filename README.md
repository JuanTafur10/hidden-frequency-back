# Hidden Frequency · API

API REST de la tienda Hidden Frequency. Backend en Node.js, Express, TypeScript, Prisma y PostgreSQL, organizado en las capas `domain`, `application`, `infrastructure` e `interface`.

## Requisitos

- Node.js 20 o superior
- PostgreSQL 15 o superior

## Configuración

1. Copia `.env.example` a `.env` y configura `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT` y `FRONTEND_URL`.
2. Instala dependencias con `npm install`.
3. Genera el cliente Prisma con `npm run prisma:generate`.
4. Aplica migraciones con `npm run prisma:deploy` (o `npm run prisma:migrate` en desarrollo).
5. Carga el catálogo real con `npm run prisma:seed`.
6. Inicia en desarrollo con `npm run dev`.

Las credenciales de administradores se definen en variables de entorno al sembrar los datos; nunca se guardan en el repositorio.
