import Link from "next/link";
import { db } from "@/lib/db";
import {
  date,
  money,
  phaseLabels,
  priorityLabels,
  statusLabels,
  statusTone,
} from "@/lib/labels";
import { requireAuth } from "@/lib/auth";
import AppShell from "./components/AppShell";

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
function totalConfirmed(payments: any[]) {
  return payments
    .filter((payment) => payment.status === "CONFIRMED")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
}
function totalExpenses(expenses: any[]) {
  return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
}

export default async function Home() {
  await requireAuth();
  const now = new Date();
  const next = new Date(now);
  next.setDate(now.getDate() + 7);
  const [clients, active, overdue, upcoming, projects, payments, expenses] =
    await Promise.all([
      db.client.count({ where: { archived: false } }),
      db.project.count({
        where: { status: { in: ["IN_PROGRESS", "IN_REVIEW"] } },
      }),
      db.project.count({
        where: { dueDate: { lt: now }, status: { not: "COMPLETED" } },
      }),
      db.project.count({
        where: { status: { not: "COMPLETED" }, dueDate: { lt: next } },
      }),
      db.project.findMany({ include: { client: true, tasks: true }, take: 20 }),
      db.payment.findMany(),
      db.expense.findMany(),
    ]);
  const today = dateKey(new Date());
  const monday = addDays(
    today,
    -(new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7,
  );
  const weekEnd = addDays(monday, 6);
  const month = today.slice(0, 7);
  const todayPayments = payments.filter(
    (payment: any) => dateKey(payment.paymentDate) === today,
  );
  const weekPayments = payments.filter((payment: any) => {
    const key = dateKey(payment.paymentDate);
    return key >= monday && key <= weekEnd;
  });
  const monthPayments = payments.filter((payment: any) =>
    dateKey(payment.paymentDate).startsWith(month),
  );
  const todayExpenses = expenses.filter(
    (expense: any) => dateKey(expense.expenseDate) === today,
  );
  const weekExpenses = expenses.filter((expense: any) => {
    const key = dateKey(expense.expenseDate);
    return key >= monday && key <= weekEnd;
  });
  const monthExpenses = expenses.filter((expense: any) =>
    dateKey(expense.expenseDate).startsWith(month),
  );
  return (
    <AppShell>
      <div className="content summary-page">
        <section className="hero">
          <div>
            <div className="eyebrow hero-eyebrow">Panel de operación</div>
            <h1>Hola, Jhorman.</h1>
            <p>
              Supervisa tus clientes, proyectos, próximas entregas y cobros
              desde un solo lugar.
            </p>
          </div>
          <Link className="btn lime" href="/proyectos/nuevo">
            ＋ Nuevo proyecto
          </Link>
          <span className="hero-rings" aria-hidden="true" />
        </section>
        <div className="grid stats stats-five">
          <Link href="/proyectos?status=active" className="card stat">
            <div>
              <p>Proyectos activos</p>
              <strong>{active}</strong>
              <small>En operación</small>
            </div>
            <span className="stat-icon">▥</span>
          </Link>
          <Link href="/proyectos?status=overdue" className="card stat">
            <div>
              <p>Atrasados</p>
              <strong>{overdue}</strong>
              <small>Con fecha vencida</small>
            </div>
            <span className="stat-icon">!</span>
          </Link>
          <Link href="/proyectos?status=upcoming" className="card stat">
            <div>
              <p>Próximos</p>
              <strong>{upcoming}</strong>
              <small>En los siguientes 7 días</small>
            </div>
            <span className="stat-icon">▦</span>
          </Link>
          <Link href="/clientes" className="card stat">
            <div>
              <p>Clientes</p>
              <strong>{clients}</strong>
              <small>Empresas registradas</small>
            </div>
            <span className="stat-icon">♧</span>
          </Link>
          <Link href="/pagos" className="card stat payment-stat">
            <div>
              <p>Generado este mes</p>
              <strong>{money(totalConfirmed(monthPayments))}</strong>
              <small>
                Confirmado · {money(totalConfirmed(todayPayments))} hoy
              </small>
            </div>
            <span className="stat-icon">$</span>
          </Link>
        </div>
        <section className="card income-strip">
          <div>
            <span className="eyebrow">Saldo operativo</span>
            <h2>{money(totalConfirmed(payments) - totalExpenses(expenses))}</h2>
            <p>Ingresos confirmados menos gastos de marketing.</p>
          </div>
          <div className="income-periods">
            <div>
              <small>Hoy</small>
              <strong>
                {money(
                  totalConfirmed(todayPayments) - totalExpenses(todayExpenses),
                )}
              </strong>
            </div>
            <div>
              <small>Semana</small>
              <strong>
                {money(
                  totalConfirmed(weekPayments) - totalExpenses(weekExpenses),
                )}
              </strong>
            </div>
            <div>
              <small>Mes</small>
              <strong>
                {money(
                  totalConfirmed(monthPayments) - totalExpenses(monthExpenses),
                )}
              </strong>
            </div>
          </div>
          <div className="income-actions">
            <Link className="btn ghost small-btn" href="/pagos">
              Ver ingresos
            </Link>
            <Link className="btn lime small-btn" href="/marketing">
              Ver marketing
            </Link>
          </div>
        </section>
        <div className="page-head compact-head">
          <div>
            <h2 className="section-title">Proyectos</h2>
            <p className="subtitle">
              Seguimiento del trabajo por estado y fecha.
            </p>
          </div>
          <div className="view-tabs">
            <Link href="/proyectos">▥ &nbsp;Tablero</Link>
            <Link href="/calendario">▦ &nbsp;Calendario</Link>
            <Link href="/cronograma">≡ &nbsp;Cronograma</Link>
            <Link className="active" href="/proyectos?view=fichas">
              ▤ &nbsp;Fichas
            </Link>
          </div>
        </div>
        <div className="summary-project-grid">
          {projects.map((project: any) => {
            const total = project.tasks?.length || 0;
            const done =
              project.tasks?.filter((task: any) => task.status === "DONE")
                .length || 0;
            const service = Array.isArray(project.services)
              ? project.services[0]
              : "Servicio";
            return (
              <Link
                className="summary-project-card"
                href={`/proyectos/${project.id}`}
                key={project.id}
              >
                <div className="project-client">
                  <span className="avatar">
                    {project.client.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span>{project.client.name}</span>
                </div>
                <h3>{project.name}</h3>
                <div className="card-tags">
                  <span className="pill soft-pill">{service}</span>
                  <span
                    className={`pill ${project.priority === "HIGH" ? "amber" : "muted"}`}
                  >
                    {
                      priorityLabels[
                        project.priority as keyof typeof priorityLabels
                      ]
                    }
                  </span>
                </div>
                <div className="project-meta">
                  <span>
                    {phaseLabels[project.phase as keyof typeof phaseLabels]}
                  </span>
                  <span>{total ? `${done}/${total}` : "0/0"}</span>
                </div>
                <div className="progress">
                  <span
                    style={{ width: `${total ? (done / total) * 100 : 0}%` }}
                  />
                </div>
                <div className="project-meta">
                  <span>{date(project.dueDate)}</span>
                  <span
                    className={`status-dot ${statusTone[project.status as keyof typeof statusTone]}`}
                  >
                    {statusLabels[project.status as keyof typeof statusLabels]}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
