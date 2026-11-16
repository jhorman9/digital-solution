import Link from "next/link";
import { db } from "@/lib/db";
import { date, phaseLabels, priorityLabels, serviceOptions, statusLabels, statusTone } from "@/lib/labels";
import AppShell from "../components/AppShell";
import ProjectBoard from "./ProjectBoard";

export default async function Proyectos({ searchParams }: { searchParams: Promise<{ client?: string; service?: string; status?: string; priority?: string; view?: string }> }) {
  const q = await searchParams;
  const [allProjects, clients] = await Promise.all([db.project.findMany({ include: { client: true, tasks: true }, orderBy: { dueDate: "asc" } }), db.client.findMany({ where: { archived: false } })]);
  const today = new Date();
  const projects = allProjects.filter((project: any) => {
    const services = Array.isArray(project.services) ? project.services : [];
    const statusMatch = !q.status || (q.status === "active" ? ["IN_PROGRESS", "IN_REVIEW"].includes(project.status) : q.status === "overdue" ? project.status !== "COMPLETED" && new Date(project.dueDate) < today : project.status === q.status);
    return (!q.client || project.clientId === q.client) && (!q.service || services.includes(q.service)) && (!q.priority || project.priority === q.priority) && statusMatch;
  });
  return <AppShell><div className="content">
    <div className="page-head"><div><div className="eyebrow">Operación</div><h1 className="title">Proyectos</h1><p className="subtitle">Organiza el trabajo y da seguimiento a tus entregas.</p></div><Link href="/proyectos/nuevo" className="btn lime">＋ Nuevo proyecto</Link></div>
    <div className="view-tabs"><Link className="active" href="/proyectos">▥ &nbsp;Tablero</Link><Link href="/calendario">▦ &nbsp;Calendario</Link><Link href="/cronograma">≡ &nbsp;Cronograma</Link><Link href="/proyectos?view=fichas">▤ &nbsp;Fichas</Link></div>
    <form className="filters project-filters" method="get"><select name="client" defaultValue={q.client || ""}><option value="">Todos los clientes</option>{clients.map((client: any) => <option key={client.id} value={client.id}>{client.name}</option>)}</select><select name="service" defaultValue={q.service || ""}><option value="">Todos los servicios</option>{serviceOptions.map((service) => <option key={service} value={service}>{service}</option>)}</select><select name="status" defaultValue={q.status || ""}><option value="">Todos los estados</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}<option value="active">Activos</option><option value="overdue">Atrasados</option></select><select name="priority" defaultValue={q.priority || ""}><option value="">Toda prioridad</option>{Object.entries(priorityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><button className="btn ghost" type="submit">Filtrar</button></form>
    {q.view === "fichas" ? null : <ProjectBoard projects={projects} />}
    <div className="card table-card" style={{ marginTop: 22 }}><div className="card-heading"><div><h2 className="section-title">Fichas de proyectos</h2><p className="subtitle">{projects.length} proyectos visibles</p></div></div>{projects.length ? <div className="table-scroll"><table className="table project-table" aria-label="Fichas de proyectos"><thead><tr><th scope="col">Proyecto</th><th scope="col">Cliente</th><th scope="col">Fase</th><th scope="col">Prioridad</th><th scope="col">Estado</th><th scope="col">Entrega</th></tr></thead><tbody>{projects.map((project: any) => <tr key={project.id}><td data-label="Proyecto"><Link href={`/proyectos/${project.id}`}><strong>{project.name}</strong></Link></td><td data-label="Cliente">{project.client?.name}</td><td data-label="Fase">{phaseLabels[project.phase as keyof typeof phaseLabels]}</td><td data-label="Prioridad"><span className={`pill ${project.priority === "HIGH" ? "amber" : "muted"}`}>{priorityLabels[project.priority as keyof typeof priorityLabels]}</span></td><td data-label="Estado"><span className={`pill ${statusTone[project.status as keyof typeof statusTone]}`}>{statusLabels[project.status as keyof typeof statusLabels]}</span></td><td data-label="Entrega">{date(project.dueDate)}</td></tr>)}</tbody></table></div> : <div className="empty">No hay proyectos con estos filtros.</div>}</div>
  </div></AppShell>;
}
