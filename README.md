# Digital Solutions · Operations

Panel privado en español para gestionar clientes, proyectos, tareas, entregas, seguimientos, checklists y métricas de marketing.

## Configuración local

1. Instala Node.js 20+ y asegúrate de tener acceso a MySQL/MariaDB mediante phpMyAdmin o tu proveedor de hosting.
2. Copia `.env.example` como `.env` y completa `DATABASE_URL`, `OWNER_EMAIL`, `OWNER_PASSWORD` y `SESSION_SECRET`.
3. Instala dependencias: `npm install`.
4. Aplica el esquema y carga los datos iniciales: `npm run db:setup`.
5. Arranca: `npm run dev` y abre `http://localhost:3000`.

La aplicación usa `America/Panama`, formato `es-PA` y USD para métricas. El acceso es de un solo propietario mediante `OWNER_EMAIL` y `OWNER_PASSWORD`; la sesión se guarda en una cookie HTTP-only firmada con `SESSION_SECRET`. Nunca se guardan contraseñas, tokens ni claves API de terceros.

## Comprobaciones

* `npm run typecheck`
* `npm run build`

La aplicación usa MySQL directamente mediante `mysql2`; no utiliza Prisma ni migraciones generadas por Prisma. `npm run db:setup` ejecuta [schema.sql](./schema.sql) y el seed idempotente. Si la contraseña contiene caracteres como `:`, `?`, `#`, `/` o `@`, codifícala para URL antes de colocarla en `DATABASE_URL`.
