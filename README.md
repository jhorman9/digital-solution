# Digital Solutions · Operations

Panel privado en español para gestionar clientes, proyectos, tareas, entregas, seguimientos, plantillas, métricas, ingresos y marketing.

## Configuración local

1. Instala Node.js 20+ y asegúrate de tener acceso a MySQL/MariaDB mediante phpMyAdmin o tu proveedor de hosting.
2. Copia `.env.example` como `.env` y completa `DATABASE_URL`, `OWNER_EMAIL`, `OWNER_PASSWORD` y `SESSION_SECRET`.
3. Instala dependencias: `npm install`.
4. Aplica el esquema y carga los datos iniciales: `npm run db:setup`.
5. Arranca el entorno: `npm run dev` y abre `http://localhost:3000`.

La aplicación usa `America/Panama`, formato `es-PA` y $. El acceso es de un solo propietario mediante `OWNER_EMAIL` y `OWNER_PASSWORD`; la sesión se guarda en una cookie HTTP-only firmada con `SESSION_SECRET`. Nunca se guardan contraseñas, tokens ni claves API de terceros.

## Pagos

En `/pagos` puedes registrar ingresos de clientes por empresa, asociarlos opcionalmente a un proyecto, marcarlos como pendientes o confirmados y consultar los totales recibidos. En `/pagos-personales` registras los pagos que te han realizado directamente a ti. En `/marketing` registras cuánto inviertes por empresa y proyecto usando la fórmula importe diario × cantidad de días (por ejemplo, $ 20 × 7 = $ 140). Marketing calcula sumas diarias, semanales, mensuales y anuales y el saldo de ingresos confirmados menos marketing. En `/gastos` registras únicamente tus gastos personales; no tienen empresa/proyecto y no se mezclan con marketing.

## Comprobaciones

```bash
npm run typecheck
npm run build
```

La aplicación usa MySQL directamente mediante `mysql2`; no utiliza Prisma. `npm run db:setup` ejecuta [`schema.sql`](./schema.sql) y el seed idempotente. Si la contraseña contiene caracteres como `:`, `?`, `#`, `/` o `@`, codifícala para URL antes de colocarla en `DATABASE_URL`.
