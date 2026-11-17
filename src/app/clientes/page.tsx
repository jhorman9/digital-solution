import Link from "next/link";
import { db } from "@/lib/db";
import AppShell from "../components/AppShell";
import ClientForm from "../client-form";
import { archiveClient, deleteClient, restoreClient, updateClient } from "../actions";
import DeleteCompanyButton from "./DeleteCompanyButton";
import Pagination from "../components/Pagination";

type ClientesProps = { searchParams: Promise<{ archived?: string; error?: string; page?: string }> };

export default async function Clientes({ searchParams }: ClientesProps) {
  const params = await searchParams;
  const showArchived = params.archived === "1";
  const clients = await db.client.findMany({
    where: { archived: showArchived },
    include: { _count: { select: { projects: true } } },
  });
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 10;
  const visibleClients = clients.slice((page - 1) * pageSize, page * pageSize);

  return (
    <AppShell>
      <div className="content">
        <div className="page-head">
          <div>
            <div className="eyebrow">Relaciones</div>
            <h1 className="title">Empresas</h1>
            <p className="subtitle">Empresas y contactos de tu operación.</p>
          </div>
          <div className="company-toolbar">
            <Link className="btn ghost" href={showArchived ? "/clientes" : "/clientes?archived=1"}>
              {showArchived ? "Ver activas" : "Ver archivadas"}
            </Link>
            {!showArchived && (
              <details className="details-action">
                <summary className="btn lime">＋ Nueva empresa</summary>
                <ClientForm />
              </details>
            )}
          </div>
        </div>
        {params.error && <div className="error" role="alert">{params.error}</div>}

        <div className="client-grid">
          {visibleClients.map((client: any) => (
            <article className={`client-card ${showArchived ? "archived-card" : ""}`} key={client.id}>
              <div className="client-card-top">
                <div className="avatar">
                  {client.name.split(" ").map((part: string) => part[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                {showArchived && <span className="status-pill archived-pill">Archivada</span>}
              </div>
              <h2>{client.name}</h2>
              <p>{client._count?.projects || 0} proyecto{client._count?.projects === 1 ? "" : "s"}</p>
              <div className="card-actions">
                <Link className="btn ghost small-btn" href={`/proyectos?client=${client.id}`}>Ver proyectos</Link>
                <details>
                  <summary className="btn ghost small-btn">Editar</summary>
                  <form action={updateClient} className="card-edit-form">
                    <input type="hidden" name="id" value={client.id} />
                    <div className="field"><label htmlFor={`name-${client.id}`}>Empresa</label><input id={`name-${client.id}`} name="name" defaultValue={client.name} required /></div>
                    <div className="field"><label htmlFor={`contact-${client.id}`}>Contacto</label><input id={`contact-${client.id}`} name="contactName" defaultValue={client.contactName || ""} /></div>
                    <div className="field"><label htmlFor={`email-${client.id}`}>Correo</label><input id={`email-${client.id}`} name="email" type="email" defaultValue={client.email || ""} /></div>
                    <div className="field"><label htmlFor={`phone-${client.id}`}>Teléfono</label><input id={`phone-${client.id}`} name="phone" defaultValue={client.phone || ""} /></div>
                    <div className="field"><label htmlFor={`website-${client.id}`}>Sitio web</label><input id={`website-${client.id}`} name="website" type="url" defaultValue={client.website || ""} /></div>
                    <div className="field"><label htmlFor={`notes-${client.id}`}>Notas</label><textarea id={`notes-${client.id}`} name="notes" defaultValue={client.notes || ""} rows={3} /></div>
                    <button className="btn lime" type="submit">Guardar cambios</button>
                  </form>
                </details>
              </div>
              {showArchived ? (
                <div className="company-secondary-actions">
                  <form action={restoreClient}><input type="hidden" name="id" value={client.id} /><button className="text-button" type="submit">Restaurar</button></form>
                  <form action={deleteClient}><input type="hidden" name="id" value={client.id} /><DeleteCompanyButton /></form>
                </div>
              ) : (
                <div className="company-secondary-actions">
                  <form action={archiveClient}><input type="hidden" name="id" value={client.id} /><button className="text-button" type="submit">Archivar</button></form>
                  <form action={deleteClient}><input type="hidden" name="id" value={client.id} /><DeleteCompanyButton /></form>
                </div>
              )}
            </article>
          ))}
          {!clients.length && <div className="card empty">{showArchived ? "No hay empresas archivadas." : "No hay empresas activas todavía."}</div>}
        </div>
        <Pagination page={page} total={clients.length} basePath="/clientes" query={{ archived: showArchived ? "1" : undefined }} />
      </div>
    </AppShell>
  );
}
