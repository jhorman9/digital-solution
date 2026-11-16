import Link from "next/link";
import { db } from "@/lib/db";
import AppShell from "../components/AppShell";
import { serviceOptions } from "@/lib/labels";

export default async function Calendario({ searchParams }: { searchParams: Promise<{ month?: string; client?: string; service?: string }> }) {
  const q = await searchParams;
  const selected = q.month ? new Date(`${q.month}-01T12:00:00`) : new Date();
  const year = selected.getFullYear(); const month = selected.getMonth();
  const [projects, clients] = await Promise.all([db.project.findMany({ include: { client: true, tasks: true, followUps: true } }), db.client.findMany({ where: { archived: false } })]);
  const filtered = projects.filter((project: any) => (!q.client || project.clientId === q.client) && (!q.service || (Array.isArray(project.services) && project.services.includes(q.service))));
  const firstMondayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstMondayIndex + days }, (_, index) => index < firstMondayIndex ? null : index - firstMondayIndex + 1);
  const monthLabel = new Intl.DateTimeFormat("es-PA", { month: "long", year: "numeric", timeZone: "America/Panama" }).format(new Date(year, month, 1));
  const monthValue = `${year}-${String(month + 1).padStart(2, "0")}`;
  const previous = new Date(year, month - 1, 1); const next = new Date(year, month + 1, 1);
  const valueFor = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const events = filtered.flatMap((project: any) => [{ date: project.startDate, label: `Inicio · ${project.name}`, id: project.id, type: "start" }, { date: project.dueDate, label: `Entrega · ${project.name}`, id: project.id, type: "due" }, ...project.tasks.filter((task: any) => task.dueDate).map((task: any) => ({ date: task.dueDate, label: `Tarea · ${task.title}`, id: project.id, type: "task" })), ...project.followUps.map((followUp: any) => ({ date: followUp.date, label: `Seguimiento · ${followUp.title}`, id: project.id, type: "follow" }))]);
  return <AppShell><div className="content">
    <div className="page-head"><div><div className="eyebrow">Planificación</div><h1 className="title">Proyectos</h1><p className="subtitle">Organiza el trabajo y da seguimiento a tus entregas.</p></div><Link href="/proyectos/nuevo" className="btn lime">＋ Nuevo proyecto</Link></div>
    <div className="view-tabs"><Link href="/proyectos">▥ &nbsp;Tablero</Link><Link className="active" href={`/calendario?month=${monthValue}`}>▦ &nbsp;Calendario</Link><Link href="/cronograma">≡ &nbsp;Cronograma</Link><Link href="/proyectos?view=fichas">▤ &nbsp;Fichas</Link></div>
    <form className="filters project-filters" method="get"><input type="hidden" name="month" value={monthValue} /><select name="client" defaultValue={q.client || ""}><option value="">Todos los clientes</option>{clients.map((client: any) => <option key={client.id} value={client.id}>{client.name}</option>)}</select><select name="service" defaultValue={q.service || ""}><option value="">Todos los servicios</option>{serviceOptions.map((service) => <option key={service}>{service}</option>)}</select><button className="btn ghost" type="submit">Filtrar</button></form>
    <div className="card calendar-card"><div className="calendar-toolbar"><h2>{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</h2><div className="filters"><Link className="btn ghost small-btn" href={`/calendario?month=${valueFor(previous)}`}>Anterior</Link><Link className="btn ghost small-btn" href="/calendario">Hoy</Link><Link className="btn ghost small-btn" href={`/calendario?month=${valueFor(next)}`}>Siguiente</Link></div></div><div className="calendar calendar-modern">{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => <div className="day day-label" key={day}>{day}</div>)}{cells.map((day, index) => <div className="day" key={index}>{day && <><strong>{day}</strong>{events.filter((event: any) => { const eventDate = new Date(event.date); return eventDate.getFullYear() === year && eventDate.getMonth() === month && eventDate.getDate() === day; }).map((event: any, eventIndex: number) => <Link className={`event ${event.type}`} key={`${event.id}-${eventIndex}`} href={`/proyectos/${event.id}`}>{event.label}</Link>)}</>}</div>)}</div></div>
  </div></AppShell>;
}
