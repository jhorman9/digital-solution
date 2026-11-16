import { db } from "@/lib/db";
import AppShell from "../../components/AppShell";
import ProjectForm from "../../project-form";
export default async function NuevoProyecto() { const clients = await db.client.findMany({ where: { archived: false }, select: { id: true, name: true }, orderBy: { name: "asc" } }); return <AppShell><div className="content"><div className="page-head"><div><div className="eyebrow">Operación</div><h1 className="title">Nuevo proyecto</h1><p className="subtitle">Define el alcance y las fechas para empezar a trabajar.</p></div></div><ProjectForm clients={clients}/></div></AppShell> }
