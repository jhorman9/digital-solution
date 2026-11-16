import { createPersonalExpense } from "@/app/actions";
import AppShell from "@/app/components/AppShell";
import { db } from "@/lib/db";
import { date, money } from "@/lib/labels";
import { requireAuth } from "@/lib/auth";
import PrivateMoney from "@/app/components/PrivateMoney";

type Expense = {
  id: string;
  expenseDate: Date | string;
  amount: number | string;
  category: string;
  concept: string;
  notes?: string | null;
};
function key(value: Date | string) {
  if (typeof value === "string") return value.slice(0, 10);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Panama",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
function addDays(value: string, days: number) {
  const dateValue = new Date(`${value}T00:00:00Z`);
  dateValue.setUTCDate(dateValue.getUTCDate() + days);
  return dateValue.toISOString().slice(0, 10);
}
function total(rows: Expense[]) {
  return rows.reduce((sum, row) => sum + Number(row.amount), 0);
}

export default async function PersonalExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; period?: string }>;
}) {
  await requireAuth();
  const params = await searchParams;
  const expenses = (await db.expense.findMany({
    scope: "PERSONAL",
  })) as Expense[];
  const today = key(new Date());
  const monday = addDays(
    today,
    -(new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7,
  );
  const weekEnd = addDays(monday, 6);
  const month = today.slice(0, 7);
  const year = today.slice(0, 4);
  const inToday = (row: Expense) => key(row.expenseDate) === today;
  const inWeek = (row: Expense) =>
    key(row.expenseDate) >= monday && key(row.expenseDate) <= weekEnd;
  const inMonth = (row: Expense) => key(row.expenseDate).startsWith(month);
  const inYear = (row: Expense) => key(row.expenseDate).startsWith(year);
  const filtered = expenses
    .filter(
      (expense) => !params.category || expense.category === params.category,
    )
    .filter((expense) =>
      params.period === "TODAY"
        ? inToday(expense)
        : params.period === "WEEK"
          ? inWeek(expense)
          : params.period === "MONTH"
            ? inMonth(expense)
            : params.period === "YEAR"
              ? inYear(expense)
              : true,
    );
  const categories = Array.from(
    new Set(expenses.map((expense) => expense.category)),
  );
  return (
    <AppShell>
      <div className="content expenses-page">
        <div className="page-head">
          <div>
            <div className="eyebrow">Finanzas personales</div>
            <h1 className="title">Gastos</h1>
            <p className="subtitle">
              Registra tus gastos personales sin mezclarlos con el marketing de
              tus clientes.
            </p>
          </div>
          <details className="details-action">
            <summary className="btn lime">＋ Registrar gasto</summary>
            <form
              action={createPersonalExpense}
              className="card popover-form form-grid expense-form"
            >
              <h2 className="section-title full">Nuevo gasto personal</h2>
              <div className="field">
                <label htmlFor="expenseDate">Fecha *</label>
                <input
                  id="expenseDate"
                  name="expenseDate"
                  type="date"
                  defaultValue={today}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="amount">Importe USD *</label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="field full">
                <label htmlFor="concept">¿En qué gastaste? *</label>
                <input
                  id="concept"
                  name="concept"
                  placeholder="Comida, transporte, herramienta personal..."
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="category">Categoría *</label>
                <select
                  id="category"
                  name="category"
                  defaultValue="Operación"
                  required
                >
                  <option>Operación</option>
                  <option>Software</option>
                  <option>Transporte</option>
                  <option>Impuestos</option>
                  <option>Proveedores</option>
                  <option>Personal</option>
                  <option>Otro</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="notes">Notas</label>
                <input
                  id="notes"
                  name="notes"
                  placeholder="Detalle o referencia"
                />
              </div>
              <div className="field full">
                <button className="btn lime" type="submit">
                  Guardar gasto personal
                </button>
              </div>
            </form>
          </details>
        </div>
        <section className="grid stats stats-four expense-stats">
          <div className="card stat expense-balance-card">
            <div>
              <p>Gastado hoy</p>
              <strong><PrivateMoney value={money(total(expenses.filter(inToday)))} /></strong>
              <small>Gastos personales</small>
            </div>
            <span className="stat-icon negative">$</span>
          </div>
          <div className="card stat expense-balance-card">
            <div>
              <p>Esta semana</p>
              <strong><PrivateMoney value={money(total(expenses.filter(inWeek)))} /></strong>
              <small>Lunes a domingo</small>
            </div>
            <span className="stat-icon negative">↗</span>
          </div>
          <div className="card stat expense-balance-card">
            <div>
              <p>Este mes</p>
              <strong><PrivateMoney value={money(total(expenses.filter(inMonth)))} /></strong>
              <small>Mes actual</small>
            </div>
            <span className="stat-icon negative">◈</span>
          </div>
          <div className="card stat expense-balance-card">
            <div>
              <p>Este año</p>
              <strong><PrivateMoney value={money(total(expenses.filter(inYear)))} /></strong>
              <small>Año actual</small>
            </div>
            <span className="stat-icon negative">✓</span>
          </div>
        </section>
        <section className="card financial-callout">
          <div>
            <span className="eyebrow">Gasto personal acumulado</span>
            <h2><PrivateMoney value={money(total(expenses))} /></h2>
            <p>
              Esta cifra no se mezcla con la inversión de marketing de tus
              clientes.
            </p>
          </div>
          <div className="financial-callout-meta">
            <span>
              Registros <strong>{expenses.length}</strong>
            </span>
            <span>
              Este mes <strong><PrivateMoney value={money(total(expenses.filter(inMonth)))} /></strong>
            </span>
          </div>
        </section>
        <section className="card table-card expense-table-card">
          <div className="card-heading">
            <div>
              <h2 className="section-title">Registro de gastos personales</h2>
              <p className="subtitle">
                {filtered.length} registros en la vista actual.
              </p>
            </div>
            <form className="filters payment-filters" method="get">
              <select
                name="category"
                defaultValue={params.category || ""}
                aria-label="Filtrar por categoría"
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                name="period"
                defaultValue={params.period || "ALL"}
                aria-label="Filtrar por periodo"
              >
                <option value="ALL">Todo el tiempo</option>
                <option value="TODAY">Hoy</option>
                <option value="WEEK">Esta semana</option>
                <option value="MONTH">Este mes</option>
                <option value="YEAR">Este año</option>
              </select>
              <button className="btn ghost small-btn" type="submit">
                Filtrar
              </button>
            </form>
          </div>
          <div className="table-scroll">
            <table
              className="table expenses-table"
              aria-label="Gastos personales"
            >
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Categoría</th>
                  <th>Concepto</th>
                  <th>Notas</th>
                  <th>Importe</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((expense) => (
                  <tr key={expense.id}>
                    <td data-label="Fecha">{date(expense.expenseDate)}</td>
                    <td data-label="Categoría">
                      <span className="pill muted">{expense.category}</span>
                    </td>
                    <td data-label="Concepto">
                      <strong>{expense.concept}</strong>
                    </td>
                    <td data-label="Notas">{expense.notes || "—"}</td>
                    <td data-label="Importe">
                      <strong><PrivateMoney value={money(expense.amount)} /></strong>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty">
                        Todavía no hay gastos personales registrados.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
