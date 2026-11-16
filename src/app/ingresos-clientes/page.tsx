import { createClientRevenue } from "@/app/actions";
import AppShell from "@/app/components/AppShell";
import { db } from "@/lib/db";
import { date, money } from "@/lib/labels";
import { requireAuth } from "@/lib/auth";
import PrivateMoney from "@/app/components/PrivateMoney";

type Revenue = {
  id: string;
  clientId: string;
  revenueDate: Date | string;
  amount: number | string;
  concept: string;
  notes?: string | null;
  client: { name: string };
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
function total(rows: Revenue[]) {
  return rows.reduce((sum, row) => sum + Number(row.amount), 0);
}

export default async function ClientRevenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; period?: string }>;
}) {
  await requireAuth();
  const params = await searchParams;
  const [clients, revenues] = await Promise.all([
    db.client.findMany({ where: { archived: false } }),
    db.clientRevenue.findMany({ clientId: params.client }),
  ]);
  const rows = revenues as Revenue[];
  const today = key(new Date());
  const monday = addDays(
    today,
    -(new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7,
  );
  const weekEnd = addDays(monday, 6);
  const month = today.slice(0, 7);
  const year = today.slice(0, 4);
  const inToday = (row: Revenue) => key(row.revenueDate) === today;
  const inWeek = (row: Revenue) =>
    key(row.revenueDate) >= monday && key(row.revenueDate) <= weekEnd;
  const inMonth = (row: Revenue) => key(row.revenueDate).startsWith(month);
  const inYear = (row: Revenue) => key(row.revenueDate).startsWith(year);
  const visible = rows.filter((row) =>
    params.period === "TODAY"
      ? inToday(row)
      : params.period === "WEEK"
        ? inWeek(row)
        : params.period === "MONTH"
          ? inMonth(row)
          : params.period === "YEAR"
            ? inYear(row)
            : true,
  );
  const periods = [
    rows.filter(inToday),
    rows.filter(inWeek),
    rows.filter(inMonth),
    rows.filter(inYear),
  ];
  const byClient = (clients as any[]).map((client) => ({
    client,
    rows: rows.filter((row) => row.clientId === client.id),
  }));
  return (
    <AppShell>
      <div className="content payments-page">
        <div className="page-head">
          <div>
            <div className="eyebrow">Clientes</div>
            <h1 className="title">Ingresos</h1>
            <p className="subtitle">
              Registra el dinero total que genera cada empresa en su negocio.
            </p>
          </div>
        </div>
        <section className="grid stats stats-four">
          <div className="card stat">
            <div>
              <p>Ingresos hoy</p>
              <strong><PrivateMoney value={money(total(periods[0]))} /></strong>
              <small>Todos los clientes</small>
            </div>
            <span className="stat-icon">$</span>
          </div>
          <div className="card stat">
            <div>
              <p>Esta semana</p>
              <strong><PrivateMoney value={money(total(periods[1]))} /></strong>
              <small>Lunes a domingo</small>
            </div>
            <span className="stat-icon">↗</span>
          </div>
          <div className="card stat">
            <div>
              <p>Este mes</p>
              <strong><PrivateMoney value={money(total(periods[2]))} /></strong>
              <small>Mes actual</small>
            </div>
            <span className="stat-icon">◈</span>
          </div>
          <div className="card stat">
            <div>
              <p>Este año</p>
              <strong><PrivateMoney value={money(total(periods[3]))} /></strong>
              <small>Año actual</small>
            </div>
            <span className="stat-icon">✓</span>
          </div>
        </section>
        <section className="card form-card">
          <div className="card-heading">
            <div>
              <h2 className="section-title">Registrar ingreso de cliente</h2>
              <p className="subtitle">
                Este registro representa las ventas o ingresos del negocio del
                cliente.
              </p>
            </div>
          </div>
          <form action={createClientRevenue} className="form-grid">
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
              <label htmlFor="revenueDate">Fecha *</label>
              <input
                id="revenueDate"
                name="revenueDate"
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
            <div className="field">
              <label htmlFor="concept">Concepto *</label>
              <input
                id="concept"
                name="concept"
                placeholder="Ventas del día, servicios, reservas..."
                required
              />
            </div>
            <div className="field full">
              <label htmlFor="notes">Notas</label>
              <textarea
                id="notes"
                name="notes"
                placeholder="Detalle del ingreso o referencia"
              />
            </div>
            <div className="field full">
              <button className="btn lime" type="submit">
                Guardar ingreso
              </button>
            </div>
          </form>
        </section>
        <section className="card payment-breakdown">
          <div className="card-heading">
            <div>
              <h2 className="section-title">Resumen por empresa</h2>
              <p className="subtitle">Total generado por cada cliente.</p>
            </div>
          </div>
          <div className="payment-company-grid">
            {byClient.map(({ client, rows: clientRows }) => (
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
                    <strong><PrivateMoney value={money(total(clientRows.filter(inToday)))} /></strong>
                  </div>
                  <div>
                    <small>Semana</small>
                    <strong><PrivateMoney value={money(total(clientRows.filter(inWeek)))} /></strong>
                  </div>
                  <div>
                    <small>Mes</small>
                    <strong><PrivateMoney value={money(total(clientRows.filter(inMonth)))} /></strong>
                  </div>
                  <div>
                    <small>Año</small>
                    <strong><PrivateMoney value={money(total(clientRows.filter(inYear)))} /></strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="card table-card payment-table-card">
          <div className="card-heading">
            <div>
              <h2 className="section-title">Registro de ingresos</h2>
              <p className="subtitle">
                {visible.length} registros en la vista actual.
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
              className="table payments-table"
              aria-label="Ingresos de clientes"
            >
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Empresa</th>
                  <th>Concepto</th>
                  <th>Importe</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((revenue) => (
                  <tr key={revenue.id}>
                    <td data-label="Fecha">{date(revenue.revenueDate)}</td>
                    <td data-label="Empresa">
                      <strong>{revenue.client.name}</strong>
                    </td>
                    <td data-label="Concepto">
                      {revenue.concept}
                      {revenue.notes && (
                        <small className="table-note">{revenue.notes}</small>
                      )}
                    </td>
                    <td data-label="Importe">
                    <strong><PrivateMoney value={money(revenue.amount)} /></strong>
                    </td>
                  </tr>
                ))}
                {!visible.length && (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty">
                        Todavía no hay ingresos de clientes registrados.
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
