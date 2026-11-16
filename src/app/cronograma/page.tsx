import Link from "next/link";
import { db } from "@/lib/db";
import AppShell from "../components/AppShell";
import { date, serviceOptions } from "@/lib/labels";

export default async function Cronograma({ searchParams }: { searchParams: Promise<{ client?: string; service?: string }> }) {
  const q = await searchParams;
  const [allProjects, clients] = await Promise.all([db.project.findMany({ include: { client: true } }), db.client.findMany({ where: { archived: false } })]);
  const projects = allProjects.filter((project: any) => (!q.client || project.clientId === q.client) && (!q.service || (Array.isArray(project.services) && project.services.includes(q.service))));
  const min = projects.length ? Math.min(...projects.map((project: any) => new Date(project.startDate).getTime())) : Date.now(); const max = projects.length ? Math.max(...projects.map((project: any) => new Date(project.dueDate).getTime())) : Date.now() + 86_400_000; const span = Math.max(max - min, 86_400_000);
  return <AppShell><div className="content">
    <div className="page-head"><div><div className="eyebrow">Planificación</div><h1 className="title">Proyectos</h1><p className="subtitle">Organiza el trabajo y da seguimiento a tus entregas.</p></div><Link href="/proyectos/nuevo" className="btn lime">＋ Nuevo proyecto</Link></div>
    <div className="view-tabs"><Link href="/proyectos">▥ &nbsp;Tablero</Link><Link href="/calendario">▦ &nbsp;Calendario</Link><Link className="active" href="/cronograma">≡ &nbsp;Cronograma</Link><Link href="/proyectos?view=fichas">▤ &nbsp;Fichas</Link></div>
    <form className="filters project-filters" method="get"><select name="client" defaultValue={q.client || ""}><option value="">Todos los clientes</option>{clients.map((client: any) => <option key={client.id} value={client.id}>{client.name}</option>)}</select><select name="service" defaultValue={q.service || ""}><option value="">Todos los servicios</option>{serviceOptions.map((service) => <option key={service}>{service}</option>)}</select><button className="btn ghost" type="submit">Filtrar</button></form>
    <div className="card timeline-card"><div className="timeline-heading"><h2>Duración de proyectos</h2>{projects.length ? <span>{date(min)} — {date(max)}</span> : null}</div>{projects.length ? <div className="timeline">{projects.map((project: any) => { const left = ((new Date(project.startDate).getTime() - min) / span) * 100; const width = Math.max(2, ((new Date(project.dueDate).getTime() - new Date(project.startDate).getTime()) / span) * 100); return <div className="timeline-row" key={project.id}><div className="timeline-label"><Link href={`/proyectos/${project.id}`}><strong>{project.name}</strong></Link><span>{project.client?.name} · {date(project.startDate)} — {date(project.dueDate)}</span></div><Link href={`/proyectos/${project.id}`} className="bar-wrap" aria-label={`Abrir ${project.name}`}><span className="bar" style={{ marginLeft: `${left}%`, width: `${width}%` }} /></Link></div>; })}</div> : <div className="empty">No hay proyectos para mostrar.</div>}</div>
  </div></AppShell>;
}
