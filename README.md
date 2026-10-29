# Hidden Frequency — API backend

Hidden Frequency es una tienda de vinilos, pedales e instrumentos musicales. Este repositorio contiene el backend de la Entrega 3: una API que entrega el catálogo y guarda las solicitudes de reserva, con cuentas de usuario y administrador.

## Enlaces del proyecto

- Sitio frontend en Vercel: https://hidden-frequency.vercel.app
- API en Render: https://hidden-frequency-back.onrender.com
- Estado de la API: https://hidden-frequency-back.onrender.com/health
- Repositorio del frontend: https://github.com/JuanTafur10/hidden-frequency-front
- Repositorio del backend: https://github.com/JuanTafur10/hidden-frequency-back

El frontend conserva el dominio de la Entrega 1. La API y el sitio tienen dominios distintos porque cumplen funciones diferentes.

## Qué contiene

La API está hecha con Node.js, Express, TypeScript, Prisma y PostgreSQL. El código se organiza en cuatro capas:

- src/domain: reglas y conceptos del negocio.
- src/application: acciones como registrar una cuenta, consultar productos y crear reservas.
- src/infrastructure: conexión a PostgreSQL y operaciones con Prisma.
- src/interface: rutas, validaciones, middleware y respuestas HTTP.

La base de datos tiene usuarios, productos y reservas. Cada reserva pertenece al usuario autenticado y puede referirse a un producto o describir una solicitud personalizada. El seed carga los seis productos del catálogo original.

## Ejecutarlo en local

Necesitas Node.js 20.19 o superior y PostgreSQL instalado y activo. Los siguientes pasos se ejecutan en PowerShell desde la carpeta del repositorio.

1. Instala las dependencias:

    npm install

2. Crea una base de datos PostgreSQL vacía, por ejemplo hidden_frequency.
3. Copia la plantilla de variables:

    Copy-Item .env.example .env

4. Edita .env con tu conexión local a PostgreSQL y un secreto JWT propio. Usa localhost como FRONTEND_URL mientras ejecutas el sitio frontend en tu computador.
5. Genera Prisma, crea las tablas y carga los productos y cuentas de prueba:

    npm run prisma:generate
    npm run prisma:migrate
    npm run prisma:seed

6. Inicia la API:

    npm run dev

La API queda en http://localhost:3001. Abre http://localhost:3001/health para comprobar que responde. Para detenerla, pulsa Ctrl+C en PowerShell. npm run build compila el backend y npm test ejecuta las pruebas automatizadas.

## Variables de entorno

| Variable | Para qué sirve |
| --- | --- |
| DATABASE_URL | Dirección de conexión a PostgreSQL. |
| JWT_SECRET | Secreto privado para firmar y verificar tokens; usa al menos 32 caracteres y no lo publiques. |
| JWT_EXPIRES_IN | Tiempo de validez del token, por ejemplo 1d o 2h. |
| PORT | Puerto del servidor; localmente se usa 3001 y Render puede asignar otro. |
| FRONTEND_URL | Dominio exacto autorizado por CORS. En producción: https://hidden-frequency.vercel.app. |
| SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD | Nombre, correo y contraseña de la cuenta admin que crea o actualiza el seed. |
| SEED_USER_NAME, SEED_USER_EMAIL, SEED_USER_PASSWORD | Nombre, correo y contraseña de la cuenta user que crea o actualiza el seed. |
| CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET | Opcionales; habilitan la carga de imágenes de productos como archivos. |

No subas el archivo .env real a GitHub. La plantilla .env.example contiene valores de ejemplo, no secretos reales.

## Cuentas de prueba para la entrega

El seed crea o actualiza estas cuentas cuando se ejecuta con las variables SEED_* correspondientes. Las contraseñas se guardan con bcrypt. Son solo para el ambiente de evaluación; no las uses en otros servicios.

| Rol | Correo | Contraseña de prueba |
| --- | --- | --- |
| Admin | admin@hidden-frequency.test | HF-Admin-Demo-2026! |
| Usuario | usuario@hidden-frequency.test | HF-Usuario-Demo-2026! |

En Render, los valores de SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_USER_EMAIL y SEED_USER_PASSWORD deben coincidir con la tabla y el seed debe haberse ejecutado para crear las cuentas. El seed requiere contraseñas de al menos 12 bytes.

## Rutas principales

Las listas de productos y reservas usan una respuesta paginada con pagination y data. El catálogo permite combinar texto, categoría y rango de precios.

| Método y ruta | Acceso | Función |
| --- | --- | --- |
| POST /api/auth/register | Público | Registra una cuenta user; correo repetido: 409. |
| POST /api/auth/login | Público | Comprueba credenciales y devuelve un JWT con vencimiento. |
| GET /api/products?page=1&limit=12 | Público | Lista y filtra productos. |
| GET /api/products/:id | Público | Consulta un producto. |
| POST /api/products | Admin | Crea un producto. |
| PUT /api/products/:id | Admin | Edita un producto. |
| DELETE /api/products/:id | Admin | Elimina un producto. |
| POST /api/reservations | Usuario autenticado | Crea una reserva a nombre de la persona del token. |
| GET /api/reservations/:id | Dueño de la reserva o admin | Consulta una reserva individual; no revela reservas ajenas. |
| GET /api/reservations/mias | Usuario autenticado | Consulta solo las reservas propias. |
| GET /api/reservations | Admin | Consulta todas las reservas. |
| PUT /api/reservations/:id | Dueño de la reserva o admin | Actualiza el producto, el artículo solicitado o las notas. |
| DELETE /api/reservations/:id | Dueño de la reserva o admin | Elimina una reserva propia o, como admin, cualquier reserva. |
| POST /api/uploads/products | Admin | Sube un archivo de imagen a Cloudinary. |
| GET /health | Público | Comprueba que la API está activa. |

## Decisiones técnicas

### Flujo de inicio de sesión

1. La persona envía correo y contraseña desde el formulario del frontend.
2. El frontend manda POST /api/auth/login a su ruta de Next.js; esta reenvía la solicitud a la API de Render.
3. El backend busca el correo y compara la contraseña con el hash bcrypt almacenado. Si coincide, firma un JWT con id y role, usando JWT_SECRET y la expiración configurada.
4. La ruta de Next.js guarda el JWT en la cookie hf_session y el perfil público en hf_user. Al refrescar la página, el frontend recupera el perfil desde la sesión.
5. En una petición protegida, el cliente HTTP envía Authorization: Bearer <token>. La ruta de Next reenvía el token al backend.
6. El proxy del frontend limita las rutas privadas para mejorar la experiencia, pero el backend vuelve a validar la firma y vencimiento del JWT con un middleware centralizado y aplica el rol requerido antes de responder.

### Dónde se guarda el token y cuál es el riesgo

El frontend guarda el JWT en la cookie hf_session. En producción la cookie usa Secure y SameSite=Lax, pero no HttpOnly: el cliente del navegador necesita leerla para enviar Authorization. Esto permite que un ataque XSS pueda robar el token si logra ejecutar código en el sitio. La cookie mantiene la sesión al refrescar; el backend sigue siendo quien decide si cada operación está autorizada. No se debe publicar el valor del token.

### Cuándo responde 401 y cuándo 403

- 401 Unauthorized: no se envió un token válido o ya venció. Por ejemplo, GET /api/reservations/mias sin iniciar sesión.
- 403 Forbidden: el token es válido, pero el rol no tiene permiso. Por ejemplo, una cuenta user que intenta DELETE /api/products/1; esa operación requiere rol admin.

El registro asigna rol user y no permite escoger admin. Un correo repetido al registrarse devuelve 409; las credenciales inválidas en login responden 401 con el mismo mensaje genérico.

### Uso de IA

Usé IA como apoyo para entender la rúbrica, organizar las capas del backend, resolver errores de configuración de PostgreSQL y Render, y revisar tipos, validaciones y pruebas. Contrasté las sugerencias con el código y corregí instrucciones que no coincidían con el proyecto, incluyendo la URL de conexión, el comando de inicio en Render y los datos reales del catálogo. La IA fue una herramienta de apoyo; revisé el resultado y tomé las decisiones finales.

## Despliegue

El backend se ejecuta en Render con PostgreSQL. En el entorno de Render deben configurarse DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, FRONTEND_URL y las variables SEED_* de las cuentas de evaluación. Las variables de Cloudinary son necesarias para habilitar la carga de imágenes.

- Build Command: npm install && npm run build
- Start Command, después de preparar la base: npm run prisma:deploy && npm start

Render está conectado al repositorio hidden-frequency-back y despliega los cambios de main. Vercel publica el frontend desde hidden-frequency-front en el mismo dominio de la Entrega 1.

## Evidencia de una petición protegida en Network

La captura muestra el sitio en producción, la ruta Mis reservas y la solicitud GET /api/reservations/mias. El encabezado Authorization es visible y el valor del token quedó fuera del recorte para no publicarlo.

![Petición protegida con Authorization en Network](docs/captura-network.png)
