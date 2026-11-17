import Link from "next/link";
import { createExpense } from "@/app/actions";
import AppShell from "@/app/components/AppShell";
import { db } from "@/lib/db";
import { date, money } from "@/lib/labels";
import { requireAuth } from "@/lib/auth";
import PrivateMoney from "@/app/components/PrivateMoney";
import Pagination from "@/app/components/Pagination";
import CampaignDatePreview from "./CampaignDatePreview";

type Row = {
  id: string;
  clientId?: string | null;
  projectId?: string | null;
  expenseDate: Date | string;
  amount: number | string;
  dailyAmount?: number | string | null;
  days?: number | null;
  category: string;
  concept: string;
  notes?: string | null;
  client?: { name: string } | null;
  project?: { name: string } | null;
};
type CampaignStatus = "ACTIVE" | "DUE_TOMORROW" | "EXPIRED";
type Payment = {
  clientId: string;
  paymentDate: Date | string;
  amount: number | string;
  status: string;
};

function dateKey(value: Date | string) {
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
function addDays(key: string, days: number) {
  const value = new Date(`${key}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
function total(rows: Array<{ amount: number | string }>) {
  return rows.reduce((sum, row) => sum + Number(row.amount), 0);
}
function within(key: string, from: string, to: string) {
  return key >= from && key <= to;
}
function campaignEnd(row: Row) {
  return addDays(dateKey(row.expenseDate), Math.max(1, Number(row.days || 1)) - 1);
}
function campaignStatus(row: Row, today: string): CampaignStatus {
  const end = campaignEnd(row);
  if (end < today) return "EXPIRED";
  if (end === addDays(today, 1)) return "DUE_TOMORROW";
  return "ACTIVE";
}

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: Promise<{
    client?: string;
    project?: string;
    category?: string;
    period?: string;
    page?: string;
  }>;
}) {
  await requireAuth();
  const params = await searchParams;
  const [clients, projects, payments, expenses] = await Promise.all([
    db.client.findMany({ where: { archived: false } }),
    db.project.findMany({ include: { client: true } }),
    db.payment.findMany({ status: "CONFIRMED" }),
    db.expense.findMany({
      clientId: params.client,
      projectId: params.project,
      scope: "MARKETING",
    }),
  ]);
  const today = dateKey(new Date());
  const monday = addDays(
    today,
    -(new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7,
  );
  const weekEnd = addDays(monday, 6);
  const monthStart = `${today.slice(0, 7)}-01`;
  const yearStart = `${today.slice(0, 4)}-01-01`;
  const filtered = (expenses as Row[])
    .filter(
      (expense) => !params.category || expense.category === params.category,
    )
    .filter((expense) => {
      if (params.period === "TODAY")
        return dateKey(expense.expenseDate) === today;
      if (params.period === "WEEK")
        return within(dateKey(expense.expenseDate), monday, weekEnd);
      if (params.period === "MONTH")
        return dateKey(expense.expenseDate).startsWith(today.slice(0, 7));
      if (params.period === "YEAR")
        return dateKey(expense.expenseDate).startsWith(today.slice(0, 4));
      return true;
    });
  const page = Math.max(1, Number(params.page) || 1);
  const visibleExpenses = filtered.slice((page - 1) * 10, page * 10);
  const confirmed = (payments as Payment[]).filter(
    (payment) => payment.status === "CONFIRMED",
  );
  const paymentFor = (from: string, to?: string) =>
    total(
      confirmed.filter((payment) => {
        const key = dateKey(payment.paymentDate);
        return to ? within(key, from, to) : key.startsWith(from);
      }),
    );
  const expenseFor = (from: string, to?: string) =>
    total(
      (expenses as Row[]).filter((expense) => {
        const key = dateKey(expense.expenseDate);
        return to ? within(key, from, to) : key.startsWith(from);
      }),
    );
  const periods = [
    ["Hoy", paymentFor(today, today), expenseFor(today, today)],
    ["Semana", paymentFor(monday, weekEnd), expenseFor(monday, weekEnd)],
    ["Mes", paymentFor(monthStart), expenseFor(monthStart)],
    ["Año", paymentFor(yearStart), expenseFor(yearStart)],
  ] as const;
  const categories = Array.from(
    new Set((expenses as Row[]).map((expense) => expense.category)),
  ).filter(Boolean);
  const clientRows = (clients as any[]).map((client) => {
    const income = confirmed.filter(
      (payment) => payment.clientId === client.id,
    );
    const spent = (expenses as Row[]).filter(
      (expense) => expense.clientId === client.id,
    );
    const sumFor = (
      rows: Array<{ amount: number | string }>,
      from: string,
      to?: string,
    ) =>
      total(
        rows.filter((row: any) => {
          const key = dateKey(row.paymentDate || row.expenseDate);
          return to ? within(key, from, to) : key.startsWith(from);
        }),
      );
    return {
      client,
      income: [
        sumFor(income, today, today),
        sumFor(income, monday, weekEnd),
        sumFor(income, monthStart),
        sumFor(income, yearStart),
      ],
      spent: [
        sumFor(spent, today, today),
        sumFor(spent, monday, weekEnd),
        sumFor(spent, monthStart),
        sumFor(spent, yearStart),
      ],
    };
  });
  return (
    <AppShell>
      <div className="content payments-page">
        <div className="page-head">
          <div>
            <div className="eyebrow">Finanzas de operación</div>
            <h1 className="title">Marketing</h1>
            <p className="subtitle">
              Registra lo que inviertes por empresa y controla el saldo después
              de marketing.
            </p>
          </div>
          <Link href="/pagos" className="btn ghost">Ver ingresos de clientes</Link>
        </div>
        <section className="grid stats stats-four">
          <div className="card stat expense-balance-card">
            <div>
              <p>Saldo hoy</p>
              <strong><PrivateMoney value={money(periods[0][1] - periods[0][2])} /></strong>
              <small>Ingresos menos marketing</small>
            </div>
            <span className="stat-icon">$</span>
          </div>
          <div className="card stat expense-balance-card">
            <div>
              <p>Saldo semana</p>
              <strong><PrivateMoney value={money(periods[1][1] - periods[1][2])} /></strong>
              <small>Lunes a domingo</small>
            </div>
            <span className="stat-icon">↗</span>
          </div>
          <div className="card stat expense-balance-card">
            <div>
              <p>Saldo mes</p>
              <strong><PrivateMoney value={money(periods[2][1] - periods[2][2])} /></strong>
              <small>Mes actual</small>
            </div>
            <span className="stat-icon">◈</span>
          </div>
          <div className="card stat expense-balance-card">
            <div>
              <p>Saldo año</p>
              <strong><PrivateMoney value={money(periods[3][1] - periods[3][2])} /></strong>
              <small>Año actual</small>
            </div>
            <span className="stat-icon">✓</span>
          </div>
        </section>
        <section className="card financial-callout">
          <div>
            <span className="eyebrow">Resultado operativo</span>
            <h2><PrivateMoney value={money(total(confirmed) - total(expenses as Row[]))} /></h2>
            <p>
              Ingresos de clientes confirmados menos inversión de marketing
              registrada.
            </p>
          </div>
          <div className="financial-callout-meta">
            <span>
              Ingresos confirmados <strong><PrivateMoney value={money(total(confirmed))} /></strong>
            </span>
            <span>
              Marketing gastado{" "}
              <strong><PrivateMoney value={money(total(expenses as Row[]))} /></strong>
            </span>
          </div>
        </section>
        <section className="card form-card">
          <div className="card-heading">
            <div>
              <h2 className="section-title">Registrar marketing</h2>
              <p className="subtitle">
                Ejemplo: $ 20 diarios durante 7 días = $ 140.
              </p>
            </div>
          </div>
          <form action={createExpense} className="form-grid">
            <div className="field">
              <label htmlFor="clientId">Empresa *</label>
              <select id="clientId" name="clientId" required>
                <option value="">Selecciona una empresa</option>
                {(clients as any[]).map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="projectId">Proyecto</label>
              <select id="projectId" name="projectId" defaultValue="">
                <option value="">Sin proyecto específico</option>
                {(projects as any[]).map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.client?.name} · {project.name}
                  </option>
                ))}
              </select>
            </div>
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
            <div className="field full">
              <CampaignDatePreview />
            </div>
            <div className="field">
              <label htmlFor="category">Plataforma o categoría *</label>
              <input
                id="category"
                name="category"
                placeholder="Meta Ads, impresión, producción..."
                required
              />
            </div>
            <div className="field">
              <label htmlFor="dailyAmount">Gasto diario $ *</label>
              <input
                id="dailyAmount"
                name="dailyAmount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="20.00"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="days">Cantidad de días *</label>
              <input
                id="days"
                name="days"
                type="number"
                min="1"
                max="366"
                step="1"
                defaultValue="1"
                required
              />
            </div>
            <div className="field full">
              <label htmlFor="concept">Concepto *</label>
              <input
                id="concept"
                name="concept"
                placeholder="Campaña de promoción, pauta semanal..."
                required
              />
            </div>
            <div className="field full">
              <label htmlFor="notes">Notas</label>
              <textarea
                id="notes"
                name="notes"
                placeholder="Audiencia, referencia o detalle del gasto"
              />
            </div>
            <div className="field full">
              <button className="btn lime" type="submit">
                Guardar gasto de marketing
              </button>
            </div>
          </form>
        </section>
        <section className="card payment-breakdown">
          <div className="card-heading">
            <div>
              <h2 className="section-title">Cuenta por empresa</h2>
              <p className="subtitle">
                Ingresos confirmados, marketing y saldo por periodo.
              </p>
            </div>
          </div>
          <div className="payment-company-grid">
            {clientRows.map(({ client, income, spent }) => (
              <article className="payment-company" key={client.id}>
                <div className="project-client">
                  <span className="avatar">
                    {client.name.slice(0, 2).toUpperCase()}
                  </span>
                  <strong>{client.name}</strong>
                </div>
                <div className="payment-company-values">
                  <div>
                    <small>Hoy</small>
                    <strong><PrivateMoney value={money(income[0] - spent[0])} /></strong>
                  </div>
                  <div>
                    <small>Semana</small>
                    <strong><PrivateMoney value={money(income[1] - spent[1])} /></strong>
                  </div>
                  <div>
                    <small>Mes</small>
                    <strong><PrivateMoney value={money(income[2] - spent[2])} /></strong>
                  </div>
                  <div>
                    <small>Año</small>
                    <strong><PrivateMoney value={money(income[3] - spent[3])} /></strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="card table-card expense-table-card">
          {(() => {
            const dueTomorrow = (expenses as Row[]).filter((expense) => campaignStatus(expense, today) === "DUE_TOMORROW").length;
            const expired = (expenses as Row[]).filter((expense) => campaignStatus(expense, today) === "EXPIRED").length;
            return dueTomorrow || expired ? <div className="campaign-alert" role="status">{dueTomorrow > 0 && <span className="pill amber">{dueTomorrow} publicidad vence mañana</span>}{expired > 0 && <span className="pill danger-pill">{expired} publicidad vencida</span>}</div> : null;
          })()}
          <div className="card-heading">
            <div>
              <h2 className="section-title">Gastos de marketing</h2>
              <p className="subtitle">
                {filtered.length} registros en la vista actual.
              </p>
            </div>
            <form className="filters payment-filters" method="get">
              <select
                name="client"
                defaultValue={params.client || ""}
                aria-label="Filtrar por empresa"
              >
                <option value="">Todas las empresas</option>
                {(clients as any[]).map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <select
                name="project"
                defaultValue={params.project || ""}
                aria-label="Filtrar por proyecto"
              >
                <option value="">Todos los proyectos</option>
                {(projects as any[]).map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
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
              aria-label="Gastos de marketing"
            >
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Finaliza</th>
                  <th>Empresa</th>
                  <th>Proyecto</th>
                  <th>Fórmula</th>
                  <th>Concepto</th>
                  <th>Categoría</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {visibleExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td data-label="Fecha">{date(expense.expenseDate)}</td>
                    <td data-label="Finaliza">{date(campaignEnd(expense))}</td>
                    <td data-label="Empresa">
                      <strong>{expense.client?.name || "Sin empresa"}</strong>
                    </td>
                    <td data-label="Proyecto">
                      {expense.project?.name || "Sin proyecto"}
                    </td>
                    <td data-label="Fórmula">
                      {expense.dailyAmount
                        ? <><PrivateMoney value={money(expense.dailyAmount)} /> × {expense.days || 1} día(s)</>
                        : <PrivateMoney value={money(expense.amount)} />}
                    </td>
                    <td data-label="Concepto">
                      {expense.concept}
                      {expense.notes && (
                        <small className="table-note">{expense.notes}</small>
                      )}
                    </td>
                    <td data-label="Categoría">
                      <span className="pill soft-pill">{expense.category}</span>
                    </td>
                    <td data-label="Total">
                      <strong><PrivateMoney value={money(expense.amount)} /></strong>
                    </td>
                    <td data-label="Estado">
                      {campaignStatus(expense, today) === "EXPIRED" ? <span className="pill danger-pill">Vencido</span> : campaignStatus(expense, today) === "DUE_TOMORROW" ? <span className="pill amber">Vence mañana</span> : <span className="pill green">Activo</span>}
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty">
                        No hay gastos de marketing para los filtros
                        seleccionados.
        </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        <Pagination page={page} total={filtered.length} basePath="/marketing" query={{ client: params.client, project: params.project, category: params.category, period: params.period }} />
      </div>
    </AppShell>
  );
}
