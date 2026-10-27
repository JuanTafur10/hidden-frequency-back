# Hidden Frequency — backend

Backend de **Hidden Frequency**, una tienda de vinilos, pedales e instrumentos musicales. Esta API prepara el catálogo y las solicitudes de reserva de la Entrega 1 para trabajar con cuentas y una base de datos.

**Enlaces del proyecto**

- Frontend en Vercel: [https://hidden-frequency.vercel.app](https://hidden-frequency.vercel.app) *(confirma que esta sea la URL del frontend actualizado para la Entrega 3).* 
- API en Render: **pendiente de pegar la URL pública del servicio**. Puedes comprobarla agregando `/health`; debe responder que el servicio está disponible.
- Repositorio frontend: [hidden-frequency-front](https://github.com/JuanTafur10/hidden-frequency-front).

> Antes de entregar, sustituye la nota de Render por el enlace real que aparece en el servicio `hidden-frequency-back` de Render. No inventes el dominio: abre el servicio y copia su URL pública.

## Qué contiene

La API está escrita con Node.js, Express, TypeScript, Prisma y PostgreSQL. El código está separado en cuatro carpetas para que sea fácil ubicar cada responsabilidad:

- `src/domain`: reglas y contratos del negocio.
- `src/application`: acciones como registrar, iniciar sesión, consultar productos y crear reservas.
- `src/infrastructure`: conexión a PostgreSQL y acceso a los datos con Prisma.
- `src/interface`: rutas HTTP, validaciones y controles de acceso.

La base tiene usuarios (`users`), productos (`products`) y reservas (`reservations`). Una reserva se relaciona con su usuario y puede relacionarse con un producto; también permite escribir una solicitud personalizada. El seed carga los seis productos del catálogo original de la Entrega 1.

## Ejecutarlo en tu computador

Necesitas Node.js 20.19 o superior y PostgreSQL instalado y activo. En Windows puedes hacer los pasos desde **PowerShell**, dentro de la carpeta `hidden-frequency-back`.

1. Instala las dependencias:

   ```powershell
   npm install
   ```

2. Crea una base de datos vacía en PostgreSQL, por ejemplo `hidden_frequency`.
3. Copia `.env.example` y llama a la copia `.env`:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Abre `.env` y coloca la dirección de tu PostgreSQL, un secreto JWT de al menos 32 caracteres y la URL permitida del frontend. Las variables están explicadas abajo. No compartas ni subas `.env`.
5. Crea las tablas y carga los productos y las cuentas de prueba:

   ```powershell
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

6. Arranca el servidor:

   ```powershell
   npm run dev
   ```

La API local queda en `http://localhost:3001`. Abre `http://localhost:3001/health` para comprobar que está activa. Para detenerla, vuelve a la ventana de PowerShell y presiona `Ctrl+C`.

Para compilar una versión de producción ejecuta `npm run build`; para ejecutar las pruebas automatizadas ejecuta `npm test`.

### Variables de entorno

| Variable | Para qué sirve |
| --- | --- |
| `DATABASE_URL` | Dirección de conexión a PostgreSQL. |
| `JWT_SECRET` | Clave privada para firmar y comprobar los tokens. Usa una distinta en local y Render, de al menos 32 caracteres. |
| `JWT_EXPIRES_IN` | Tiempo de validez del token, por ejemplo `1d` o `2h`. |
| `PORT` | Puerto del servidor; localmente se usa `3001`. Render puede asignar su propio puerto. |
| `FRONTEND_URL` | Dirección exacta del frontend autorizada para conectarse a la API. No uses `*`. |
| `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Opcionales, en conjunto crean o actualizan la cuenta admin al ejecutar el seed. |
| `SEED_USER_NAME`, `SEED_USER_EMAIL`, `SEED_USER_PASSWORD` | Opcionales, en conjunto crean o actualizan una cuenta user al ejecutar el seed. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Opcionales; necesarias para guardar imágenes de productos como archivos. Son privadas. |

El seed requiere que cada contraseña de prueba tenga al menos 12 bytes. Las guarda cifradas con bcrypt. Para preparar ambas cuentas, define las tres variables `SEED_ADMIN_*` y las tres `SEED_USER_*` en `.env` antes de correr `npm run prisma:seed`. El seed puede volver a ejecutarse: sincroniza el catálogo y actualiza esas cuentas con los valores configurados.

### Cuentas de prueba para la entrega

Estas credenciales son **solo para la base de demostración de la entrega**. Configura los mismos valores en las variables `SEED_*` de Render y luego ejecuta el seed allí. No uses estas cuentas en una tienda real ni reutilices sus claves en otros servicios.

| Rol | Correo | Contraseña de demostración |
| --- | --- | --- |
| Admin | `admin@hidden-frequency.test` | `HF-Admin-Demo-2026!` |
| User | `usuario@hidden-frequency.test` | `HF-Usuario-Demo-2026!` |

> Pendiente para ti: registra estas cuentas en las variables privadas de Render (`SEED_ADMIN_*` y `SEED_USER_*`) y vuelve a ejecutar el seed. Si eliges otras contraseñas, cambia también esta tabla para que coincida. La contraseña no está predefinida en el código.

## Rutas principales

Las listas responden con paginación y datos, por ejemplo `{ "pagination": { "page": 1, "limit": 12, "total": 6, "totalPages": 1 }, "data": [...] }`. Puedes combinar `search`, `category`, `minPrice` y `maxPrice` en productos.

| Método y ruta | Quién puede usarla | Qué hace |
| --- | --- | --- |
| `POST /api/auth/register` | Cualquiera | Registra una cuenta `user`; correo repetido: `409`. |
| `POST /api/auth/login` | Cualquiera | Comprueba las credenciales y devuelve un token con vencimiento. |
| `GET /api/products?page=1&limit=12` | Cualquiera | Lista y filtra productos. |
| `GET /api/products/:id` | Cualquiera | Muestra un producto. |
| `POST`, `PUT /api/products` y `DELETE /api/products/:id` | Admin | Crea, modifica o elimina productos. En `PUT` se indica el id en la ruta: `PUT /api/products/:id`. |
| `POST /api/reservations` | Usuario con sesión | Crea una solicitud a nombre del usuario autenticado. |
| `GET /api/reservations/mias` | Usuario con sesión | Muestra solo sus solicitudes. |
| `GET /api/reservations` | Admin | Muestra todas las solicitudes. |
| `POST /api/uploads/products` | Admin | Sube una imagen (`multipart/form-data`, campo `image`) a Cloudinary. |
| `GET /health` | Cualquiera | Comprueba que el servidor responde. |

Para las rutas privadas se envía el token en el encabezado `Authorization: Bearer <token>`. El backend obtiene el usuario de ese token; no acepta que el cliente elija a nombre de quién se registra una reserva.

## Decisiones explicadas

### Qué pasa cuando alguien inicia sesión

La persona envía su correo y contraseña a `POST /api/auth/login`. La API busca la cuenta y compara la contraseña con el hash guardado. Si coinciden, firma un token que contiene el id y el rol y tiene una fecha de vencimiento; responde con el token y los datos públicos de la cuenta. Para abrir una ruta privada, el cliente debe enviar ese token en `Authorization`. El middleware del backend comprueba que siga vigente y después revisa el rol que necesita esa ruta. Si no se puede comprobar el token responde `401`; si la cuenta sí está autenticada pero no tiene el rol necesario responde `403`.

**Estado de la integración del navegador:** revisé el repositorio `hidden-frequency-front` disponible y todavía contiene el sitio original en HTML, CSS y JavaScript; no tiene formulario de login, no consume esta API ni guarda un token. Por eso el flujo de navegador y la captura Network de una petición protegida aún están pendientes de la migración del frontend a Next.js. El backend por sí solo no guarda el token del navegador.

Cuando integres la sesión, documenta aquí el lugar elegido para guardar el token. Guardarlo en `localStorage` permite conservar la sesión al refrescar, pero un script malicioso que logre ejecutarse en el sitio podría leerlo; una cookie `HttpOnly` reduce ese riesgo porque JavaScript no puede leerla. No afirmes que ya está implementado hasta comprobarlo en el frontend.

### Diferencia entre `401` y `403`

- `401` quiere decir que la solicitud no presentó una sesión válida: no envió token, el token es inválido o venció. Ejemplo: `DELETE /api/products/1` sin `Authorization`.
- `403` quiere decir que el token sí identifica a una cuenta, pero esa cuenta no tiene permiso. Ejemplo real: un usuario con rol `user` intenta `DELETE /api/products/1`; solo `admin` puede borrar productos.

El registro no permite escoger el rol: las cuentas nuevas siempre quedan como `user`. El correo ya registrado produce `409`, y el login responde el mismo `401` tanto si el correo no existe como si la contraseña es incorrecta.

### Uso de IA

Usé IA como apoyo para revisar la rúbrica, ordenar el trabajo del backend, aclarar errores de configuración de PostgreSQL y Render, y preparar documentación y comandos de prueba. Revisé los cambios contra el código y corregí instrucciones que no coincidían con el proyecto, como la URL de conexión de la base y los datos reales del catálogo. La IA fue una ayuda; la revisión y las decisiones finales del proyecto son mías.

## Despliegue en Render

El servicio de Render debe estar conectado al repositorio de GitHub. En sus variables privadas configura la conexión de PostgreSQL, un `JWT_SECRET` propio, `JWT_EXPIRES_IN`, `FRONTEND_URL` con el dominio real de Vercel y las seis variables `SEED_ADMIN_*` / `SEED_USER_*` para las cuentas de evaluación. Las variables de Cloudinary son necesarias solo si vas a usar la carga de imágenes.

Comandos del servicio:

- Build: `npm install && npm run build`
- Start, después de preparar la base: `npm run prisma:deploy && npm start`
- Preparación inicial: aplicar migraciones y ejecutar `npm run prisma:seed` una vez, con variables `SEED_*` configuradas.

Después de un push a `main`, Render despliega automáticamente si la conexión con GitHub y el auto-deploy están activos. Abre la URL pública del servicio y revisa `/health` y los logs del deploy.

## Captura de Network pendiente

La rúbrica pide una captura de una petición protegida del navegador con `Authorization`. No la incluyas como si existiera todavía: el frontend disponible aún no inicia sesión ni llama a esta API.

Cuando termines la integración del frontend:

1. Inicia sesión como el usuario de prueba y abre las herramientas del navegador con `F12`.
2. Selecciona **Network/Red**, realiza una acción que consulte `GET /api/reservations/mias` y abre esa petición.
3. En **Headers/Encabezados → Request Headers**, comprueba que aparece `Authorization: Bearer …`.
4. Oculta el valor del token en la captura (no lo publiques) y guarda la imagen como `docs/captura-network.png`.
5. Añade aquí: `![Petición protegida en Network](docs/captura-network.png)`.

Hasta tener esa imagen y el frontend conectado, el punto de captura y las decisiones de sesión no están listos para entregar.

