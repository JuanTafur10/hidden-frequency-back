# Hidden Frequency · API REST

Backend de la tienda **Hidden Frequency**, basada en el catálogo de vinilos, pedales e instrumentos y el formulario de reserva de la Entrega 1. La API usa Node.js, Express 5, TypeScript, Prisma 7 y PostgreSQL.

## Arquitectura

El código separa responsabilidades en las cuatro capas solicitadas:

- `src/domain`: entidades, errores de dominio y contratos de repositorios.
- `src/application`: servicios de autenticación, catálogo y reservas.
- `src/infrastructure`: configuración, cliente Prisma y adaptadores PostgreSQL.
- `src/interface`: aplicación Express, controladores, routers, validadores y middleware.

Los controladores traducen HTTP a llamadas de aplicación; la lógica de acceso a datos queda en los adaptadores Prisma. El `userId` de una reserva sale exclusivamente del JWT verificado, nunca del body.

## Modelo de datos

- `users`: nombre, correo único, hash bcrypt de contraseña y rol `admin` o `user`.
- `products`: catálogo real de la Entrega 1, con categorías limitadas, precio decimal, descripción e imagen.
- `reservations`: solicitud asociada por llaves foráneas con el usuario y, si corresponde, el producto.

`productId` en una reserva es opcional: el formulario original también permite pedir un vinilo o equipo que todavía no aparece en el catálogo. La solicitud conserva el texto de lo que busca la persona aunque el producto no exista aún. Al eliminar un producto, una reserva histórica conserva su solicitud y queda con `productId` nulo.

El seed carga los seis elementos reales de `js/products.js`: Daft Punk - Discovery, Boss DS-1 Distortion, Korg Minilogue XD, MF DOOM - Madvillainy, Strymon BigSky y Technics SL-1200MK7. También puede crear un administrador si se configuran sus variables opcionales.

## Requisitos y configuración local

Se requiere Node.js 20.19 o superior y PostgreSQL. Crea una base vacía, copia `.env.example` como `.env` y reemplaza sus valores; `.env` está ignorado por Git.

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

La API local queda en `http://localhost:3001`. `npm run prisma:migrate` crea/aplica una migración en desarrollo; `npm run prisma:deploy` aplica las migraciones existentes en un despliegue. Para compilar y ejecutar pruebas:

```bash
npm run build
npm test
```

El cliente Prisma se genera durante `build` y `test`. La URL de respaldo en `prisma.config.ts` sirve únicamente para generar el cliente cuando aún no hay `.env`; las migraciones y el seed necesitan una `DATABASE_URL` válida.

### Crear el administrador de prueba

Define `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` en `.env` (la contraseña debe tener al menos 12 bytes) y ejecuta `npm run prisma:seed`. El seed guarda un hash bcrypt con 12 rondas y asigna el rol `admin`. Si esas variables no existen, solo se carga el catálogo; nunca hay una contraseña predeterminada escondida en el código.

Al desplegar, configura las mismas variables en el entorno privado de la plataforma y ejecuta el seed. Entrega el correo y la contraseña de esa cuenta de prueba por el canal privado de evaluación; no pongas secretos de producción en este repositorio.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Conexión PostgreSQL directa para Prisma y el adaptador `pg`. |
| `JWT_SECRET` | Secreto de firma JWT; mínimo 32 caracteres, distinto en cada entorno. |
| `JWT_EXPIRES_IN` | Duración del token, por ejemplo `1d` o `2h`. |
| `PORT` | Puerto HTTP; por defecto `3001` localmente. |
| `FRONTEND_URL` | URL/origen permitido por CORS, por ejemplo `https://hidden-frequency.vercel.app`. |
| `SEED_ADMIN_EMAIL` | Opcional: correo para crear/actualizar el usuario administrador. |
| `SEED_ADMIN_PASSWORD` | Opcional: contraseña del administrador, nunca guardada en el repositorio. |
| `SEED_ADMIN_NAME` | Opcional: nombre mostrado para el administrador. |

## Endpoints

Las respuestas de colección tienen la forma `{ "pagination": { "page", "limit", "total", "totalPages" }, "data": [...] }`. La paginación empieza en 1, usa 12 elementos por defecto y admite hasta 100 por página.

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Público | Crea cuenta de rol `user`; correo repetido devuelve `409`. |
| `POST` | `/api/auth/login` | Público | Devuelve usuario público y JWT expirante. |
| `GET` | `/api/products?page=1&limit=12` | Público | Catálogo paginado; filtros `category`, `search`, `minPrice`, `maxPrice` combinables. |
| `GET` | `/api/products/:id` | Público | Detalle del producto. |
| `POST` | `/api/products` | Admin | Crea producto. |
| `PUT` | `/api/products/:id` | Admin | Actualiza uno o varios campos. |
| `DELETE` | `/api/products/:id` | Admin | Borra el producto; devuelve `204`. |
| `POST` | `/api/reservations` | Usuario autenticado | Crea una solicitud para la cuenta del token. |
| `GET` | `/api/reservations/mias?page=1&limit=12` | Usuario autenticado | Lista únicamente las solicitudes propias. |
| `GET` | `/api/reservations?page=1&limit=12` | Admin | Lista todas las solicitudes con datos públicos de usuario y producto. |
| `GET` | `/health` | Público | Comprueba que el proceso HTTP está disponible. |

Las escrituras protegidas usan `Authorization: Bearer <token>`. El token lleva únicamente `id` y `role` como claims de aplicación, más `iat` y `exp` que añade JWT. Sin token, inválido o expirado se devuelve `401`; sin rol suficiente, `403`. Las credenciales incorrectas comparten el mismo mensaje `401` y ninguna respuesta incluye `password` ni `passwordHash`.

### Ejemplos de cuerpos

```json
{
  "name": "Ana Pérez",
  "email": "ana@example.com",
  "password": "una-clave-segura"
}
```

```json
{
  "title": "Daft Punk - Discovery",
  "category": "Vinilos",
  "price": 250000,
  "description": "Edición especial 2LP.",
  "imageUrl": "assets/images/daft-punk.jpg"
}
```

```json
{
  "productId": 1,
  "requestedItem": "Daft Punk - Discovery",
  "notes": "Si es posible, edición en buen estado."
}
```

Las reservas también aceptan `requestedItem` sin `productId` para solicitudes personalizadas. Los campos no admitidos se rechazan con `400`; errores de datos duplicados devuelven `409`; entidades inexistentes devuelven `404`. Los errores inesperados responden sin stack trace.

## Decisiones de implementación

1. El registro público siempre asigna rol `user`; aceptar el rol del cliente permitiría que cualquiera se creara una cuenta admin.
2. La tabla de reserva tiene una relación opcional con `products` para representar tanto reservas de un elemento conocido como pedidos bajo encargo del formulario original.
3. El JWT lleva un identificador y el rol, no email ni contraseña; el middleware central verifica el token y los routers aplican el control de rol.
4. Se fijó un adaptador PostgreSQL para Prisma 7 y la URL de conexión se lee de entorno. No se versionan credenciales.
5. El catálogo combina filtro de texto, categoría y rango de precio en el servidor; la API conserva paginación en cada consulta.

## Despliegue

En Render (o una plataforma Node equivalente), configura `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL` y las variables `SEED_ADMIN_*` privadas. Usa `npm run build` como comando de compilación, `npm start` para iniciar y ejecuta `npm run prisma:deploy` y `npm run prisma:seed` al preparar la base. En `FRONTEND_URL` debe ir el dominio de Vercel del front, sin `*`.
