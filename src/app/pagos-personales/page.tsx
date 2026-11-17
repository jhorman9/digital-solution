import { createPersonalPayment, confirmPayment } from "@/app/actions";
import AppShell from "@/app/components/AppShell";
import { db } from "@/lib/db";
import { date, money } from "@/lib/labels";
import { requireAuth } from "@/lib/auth";
import PrivateMoney from "@/app/components/PrivateMoney";
import Pagination from "@/app/components/Pagination";

type Payment = {
  id: string;
  paymentDate: Date | string;
  amount: number | string;
  concept: string;
  status: "PENDING" | "CONFIRMED";
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
function total(rows: Payment[]) {
  return rows
    .filter((row) => row.status === "CONFIRMED")
    .reduce((sum, row) => sum + Number(row.amount), 0);
}

export default async function PersonalPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; period?: string; page?: string }>;
}) {
  await requireAuth();
  const params = await searchParams;
  const payments = (await db.payment.findMany({
    scope: "PERSONAL",
    status:
      params.status && params.status !== "ALL" ? params.status : undefined,
  })) as Payment[];
  const today = key(new Date());
  const monday = addDays(
    today,
    -(new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7,
  );
  const weekEnd = addDays(monday, 6);
  const month = today.slice(0, 7);
  const year = today.slice(0, 4);
  const inToday = (row: Payment) => key(row.paymentDate) === today;
  const inWeek = (row: Payment) =>
    key(row.paymentDate) >= monday && key(row.paymentDate) <= weekEnd;
  const inMonth = (row: Payment) => key(row.paymentDate).startsWith(month);
  const inYear = (row: Payment) => key(row.paymentDate).startsWith(year);
  const filtered = payments.filter((payment) =>
    params.period === "TODAY"
      ? inToday(payment)
      : params.period === "WEEK"
        ? inWeek(payment)
        : params.period === "MONTH"
          ? inMonth(payment)
          : params.period === "YEAR"
            ? inYear(payment)
            : true,
  );
  const page = Math.max(1, Number(params.page) || 1);
  const visiblePayments = filtered.slice((page - 1) * 10, page * 10);
  return (
    <AppShell>
      <div className="content payments-page">
        <div className="page-head">
          <div>
            <div className="eyebrow">Finanzas personales</div>
            <h1 className="title">Ingresos</h1>
            <p className="subtitle">
              Registra los pagos que te han realizado directamente a ti.
            </p>
          </div>
        </div>
        <section className="grid stats stats-four">
          <div className="card stat">
            <div>
              <p>Recibido hoy</p>
              <strong><PrivateMoney value={money(total(payments.filter(inToday)))} /></strong>
              <small>Pagos confirmados</small>
            </div>
            <span className="stat-icon">$</span>
          </div>
          <div className="card stat">
            <div>
              <p>Esta semana</p>
              <strong><PrivateMoney value={money(total(payments.filter(inWeek)))} /></strong>
              <small>Lunes a domingo</small>
            </div>
            <span className="stat-icon">↗</span>
          </div>
          <div className="card stat">
            <div>
              <p>Este mes</p>
              <strong><PrivateMoney value={money(total(payments.filter(inMonth)))} /></strong>
              <small>Mes actual</small>
            </div>
            <span className="stat-icon">◈</span>
          </div>
          <div className="card stat">
            <div>
              <p>Este año</p>
              <strong><PrivateMoney value={money(total(payments.filter(inYear)))} /></strong>
              <small>Año actual</small>
            </div>
            <span className="stat-icon">✓</span>
          </div>
        </section>
        <section className="card form-card">
          <div className="card-heading">
            <div>
              <h2 className="section-title">Registrar pago personal</h2>
              <p className="subtitle">
                Este registro no se asocia a una empresa cliente.
              </p>
            </div>
          </div>
          <form action={createPersonalPayment} className="form-grid">
            <div className="field">
              <label htmlFor="paymentDate">Fecha *</label>
              <input
                id="paymentDate"
                name="paymentDate"
                type="date"
                defaultValue={today}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="amount">Importe $ *</label>
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
              <label htmlFor="concept">Concepto *</label>
              <input
                id="concept"
                name="concept"
                placeholder="Pago recibido, honorario, comisión..."
                required
              />
            </div>
            <div className="field">
              <label htmlFor="status">Estado</label>
              <select id="status" name="status" defaultValue="CONFIRMED">
                <option value="CONFIRMED">Confirmado</option>
                <option value="PENDING">Pendiente</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="notes">Notas</label>
              <input
                id="notes"
                name="notes"
                placeholder="Referencia o comentario"
              />
            </div>
            <div className="field full">
              <button className="btn lime" type="submit">
                Guardar pago
              </button>
            </div>
          </form>
        </section>
        <section className="card table-card payment-table-card">
          <div className="card-heading">
            <div>
              <h2 className="section-title">Pagos personales</h2>
              <p className="subtitle">
                {filtered.length} registros en la vista actual.
              </p>
            </div>
            <form className="filters payment-filters" method="get">
              <select
                name="status"
                defaultValue={params.status || "ALL"}
                aria-label="Filtrar por estado"
              >
                <option value="ALL">Todos los estados</option>
                <option value="CONFIRMED">Confirmados</option>
                <option value="PENDING">Pendientes</option>
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
              aria-label="Pagos personales"
            >
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th>Importe</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {visiblePayments.map((payment) => (
                  <tr key={payment.id}>
                    <td data-label="Fecha">{date(payment.paymentDate)}</td>
                    <td data-label="Concepto">
                      <strong>{payment.concept}</strong>
                      {payment.notes && (
                        <small className="table-note">{payment.notes}</small>
                      )}
                    </td>
                    <td data-label="Importe">
                      <strong><PrivateMoney value={money(payment.amount)} /></strong>
                    </td>
                    <td data-label="Estado">
                      <span
                        className={`pill ${payment.status === "CONFIRMED" ? "green" : "amber"}`}
                      >
                        {payment.status === "CONFIRMED"
                          ? "Confirmado"
                          : "Pendiente"}
                      </span>
                    </td>
                    <td data-label="Acción">
                      <form action={confirmPayment}>
                        <input type="hidden" name="id" value={payment.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={
                            payment.status === "CONFIRMED"
                              ? "PENDING"
                              : "CONFIRMED"
                          }
                        />
                        <button className="btn ghost small-btn" type="submit">
                          {payment.status === "CONFIRMED"
                            ? "Reabrir"
                            : "Confirmar"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty">
                        Todavía no hay pagos personales registrados.
        </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        <Pagination page={page} total={filtered.length} basePath="/pagos-personales" query={{ status: params.status, period: params.period }} />
      </div>
    </AppShell>
  );
}
