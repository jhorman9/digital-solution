# Digital Solutions · Operations

Panel privado en español para gestionar clientes, proyectos, tareas, entregas, seguimientos, plantillas, métricas y pagos confirmados.

## Configuración local

1. Instala Node.js 20+ y asegúrate de tener acceso a MySQL/MariaDB mediante phpMyAdmin o tu proveedor de hosting.
2. Copia `.env.example` como `.env` y completa `DATABASE_URL`, `OWNER_EMAIL`, `OWNER_PASSWORD` y `SESSION_SECRET`.
3. Instala dependencias: `npm install`.
4. Aplica el esquema y carga los datos iniciales: `npm run db:setup`.
5. Arranca el entorno: `npm run dev` y abre `http://localhost:3000`.

La aplicación usa `America/Panama`, formato `es-PA` y USD. El acceso es de un solo propietario mediante `OWNER_EMAIL` y `OWNER_PASSWORD`; la sesión se guarda en una cookie HTTP-only firmada con `SESSION_SECRET`. Nunca se guardan contraseñas, tokens ni claves API de terceros.

## Pagos

En `/pagos` puedes registrar pagos por empresa, asociarlos opcionalmente a un proyecto, marcarlos como pendientes o confirmados y consultar totales confirmados del día, semana, mes y acumulado. En `/gastos` puedes registrar en qué se utilizó el dinero y consultar el saldo operativo como ingresos confirmados menos gastos. También se muestra el desglose y los saldos por periodo en Resumen.

## Comprobaciones

```bash
npm run typecheck
npm run build
```

La aplicación usa MySQL directamente mediante `mysql2`; no utiliza Prisma. `npm run db:setup` ejecuta [`schema.sql`](./schema.sql) y el seed idempotente. Si la contraseña contiene caracteres como `:`, `?`, `#`, `/` o `@`, codifícala para URL antes de colocarla en `DATABASE_URL`.
