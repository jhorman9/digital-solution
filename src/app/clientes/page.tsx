import Link from "next/link";
import { db } from "@/lib/db";
import AppShell from "../components/AppShell";
import ClientForm from "../client-form";
import { archiveClient, updateClient } from "../actions";

export default async function Clientes() {
  const clients = await db.client.findMany({
    where: { archived: false },
    include: { _count: { select: { projects: true } } },
  });
  return (
    <AppShell>
      <div className="content">
        <div className="page-head">
          <div>
            <div className="eyebrow">Relaciones</div>
            <h1 className="title">Clientes</h1>
            <p className="subtitle">Empresas y contactos de tu operación.</p>
          </div>
          <details className="details-action">
            <summary className="btn lime">＋ Nuevo cliente</summary>
            <ClientForm />
          </details>
        </div>
        <div className="client-grid">
          {clients.map((client: any) => (
            <article className="client-card" key={client.id}>
              <div className="avatar">
                {client.name
                  .split(" ")
                  .map((part: string) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <h2>{client.name}</h2>
              <p>
                {client._count?.projects || 0} proyecto
                {client._count?.projects === 1 ? "" : "s"}
              </p>
              <div className="card-actions">
                <Link
                  className="btn ghost small-btn"
                  href={`/proyectos?client=${client.id}`}
                >
                  Ver proyectos
                </Link>
                <details>
                  <summary className="btn ghost small-btn">Editar</summary>
                  <form action={updateClient} className="card-edit-form">
                    <input type="hidden" name="id" value={client.id} />
                    <div className="field">
                      <label>Empresa</label>
                      <input name="name" defaultValue={client.name} required />
                    </div>
                    <div className="field">
                      <label>Contacto</label>
                      <input
                        name="contactName"
                        defaultValue={client.contactName || ""}
                      />
                    </div>
                    <div className="field">
                      <label>Correo</label>
                      <input
                        name="email"
                        type="email"
                        defaultValue={client.email || ""}
                      />
                    </div>
                    <div className="field">
                      <label>Teléfono</label>
                      <input name="phone" defaultValue={client.phone || ""} />
                    </div>
                    <div className="field">
                      <label>Sitio web</label>
                      <input
                        name="website"
                        type="url"
                        defaultValue={client.website || ""}
                      />
                    </div>
                    <div className="field">
                      <label>Notas</label>
                      <textarea
                        name="notes"
                        defaultValue={client.notes || ""}
                        rows={3}
                      />
                    </div>
                    <button className="btn lime" type="submit">
                      Guardar cambios
                    </button>
                  </form>
                </details>
              </div>
              <form action={archiveClient}>
                <input type="hidden" name="id" value={client.id} />
                <button className="text-button" type="submit">
                  Archivar
                </button>
              </form>
            </article>
          ))}
          {!clients.length && (
            <div className="card empty">No hay clientes activos todavía.</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
