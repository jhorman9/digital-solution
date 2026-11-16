import { db } from "@/lib/db";
import { serviceOptions } from "@/lib/labels";
import AppShell from "../components/AppShell";
import { createTemplate, updateTemplate } from "../actions";

export default async function Plantillas() {
  const templates = await db.checklistTemplate.findMany({
    include: { items: true },
  });

  return (
    <AppShell>
      <div className="content">
        <div className="page-head">
          <div>
            <div className="eyebrow">Estandarización</div>
            <h1 className="title">Plantillas</h1>
            <p className="subtitle">
              Checklists reutilizables para tus servicios.
            </p>
          </div>
          <details className="details-action">
            <summary className="btn lime">＋ Nueva plantilla</summary>
            <form action={createTemplate} className="card popover-form">
              <h2 className="section-title">Nueva plantilla</h2>
              <div className="field">
                <label htmlFor="template-name">Nombre</label>
                <input
                  id="template-name"
                  name="name"
                  required
                  placeholder="Checklist de estrategia"
                />
              </div>
              <div className="field">
                <label htmlFor="template-service">Servicio</label>
                <select id="template-service" name="service" required>
                  {serviceOptions.map((service) => (
                    <option key={service}>{service}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="template-items">Ítems, uno por línea</label>
                <textarea
                  id="template-items"
                  name="items"
                  rows={5}
                  required
                  placeholder="Validar alcance&#10;Revisar entregables&#10;Comprobar publicación"
                />
              </div>
              <button className="btn lime" type="submit">
                Guardar plantilla
              </button>
            </form>
          </details>
        </div>
        <div className="template-grid">
          {templates.map((template) => (
            <article className="template-card" key={template.id}>
              <span className="pill soft-pill">{template.service}</span>
              <h2>{template.name}</h2>
              <ul>
                {template.items
                  .sort((a: any, b: any) => a.position - b.position)
                  .map((item: any) => (
                    <li key={item.id}>{item.title}</li>
                  ))}
              </ul>
              <details>
                <summary className="btn ghost small-btn">Editar</summary>
                <form action={updateTemplate} className="template-edit">
                  <input type="hidden" name="id" value={template.id} />
                  <div className="field">
                    <label>Nombre</label>
                    <input name="name" defaultValue={template.name} required />
                  </div>
                  <div className="field">
                    <label>Servicio</label>
                    <select name="service" defaultValue={template.service}>
                      {serviceOptions.map((service) => (
                        <option key={service}>{service}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Ítems, uno por línea</label>
                    <textarea
                      name="items"
                      rows={5}
                      defaultValue={template.items
                        .sort((a: any, b: any) => a.position - b.position)
                        .map((item: any) => item.title)
                        .join("\n")}
                      required
                    />
                  </div>
                  <button className="btn" type="submit">
                    Guardar cambios
                  </button>
                </form>
              </details>
            </article>
          ))}
          {!templates.length && (
            <div className="card empty">No hay plantillas todavía.</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
