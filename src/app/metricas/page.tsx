import { db } from "@/lib/db";
import { date, money } from "@/lib/labels";
import AppShell from "../components/AppShell";
import MetricForm from "./metric-form";
import PrivateMoney from "../components/PrivateMoney";
import Pagination from "../components/Pagination";

export default async function Metricas({
  searchParams,
}: {
  searchParams: Promise<{
    client?: string;
    platform?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const q = await searchParams;
  const [projects, allMetrics] = await Promise.all([
    db.project.findMany({
      include: { client: true },
      orderBy: { name: "asc" },
    }),
    db.metric.findMany({
      include: { project: { include: { client: true } } },
      orderBy: { date: "desc" },
      take: 100,
    }),
  ]);
  const metrics = allMetrics.filter((metric: any) => {
    const clientMatch = !q.client || metric.project?.client?.id === q.client;
    const platformMatch =
      !q.platform ||
      String(metric.platform).toLowerCase() === q.platform.toLowerCase();
    const fromMatch = !q.from || new Date(metric.date) >= new Date(q.from);
    const toMatch =
      !q.to || new Date(metric.date) <= new Date(`${q.to}T23:59:59`);
    return clientMatch && platformMatch && fromMatch && toMatch;
  });
  const page = Math.max(1, Number(q.page) || 1);
  const pageSize = 10;
  const visibleMetrics = metrics.slice((page - 1) * pageSize, page * pageSize);
  const total = (key: string) =>
    metrics.reduce(
      (sum: number, metric: any) => sum + Number(metric[key] || 0),
      0,
    );
  const platforms = [
    ...new Set(
      allMetrics.map((metric: any) => metric.platform).filter(Boolean),
    ),
  ];
  return (
    <AppShell>
      <div className="content">
        <div className="page-head">
          <div>
            <div className="eyebrow">Marketing</div>
            <h1 className="title">Métricas</h1>
            <p className="subtitle">
              Registro manual de campañas y contenidos.
            </p>
          </div>
          <details className="details-action">
            <summary className="btn lime">＋ Registrar métricas</summary>
            <MetricForm projects={projects} />
          </details>
        </div>
        <div className="grid stats stats-four metric-stats">
          <div className="card stat">
            <div>
              <p>Inversión</p>
                <strong><PrivateMoney value={money(total("investment"))} /></strong>
            </div>
            <span className="stat-icon">$</span>
          </div>
          <div className="card stat">
            <div>
              <p>Impresiones</p>
              <strong>{total("impressions").toLocaleString("es-PA")}</strong>
            </div>
            <span className="stat-icon">◉</span>
          </div>
          <div className="card stat">
            <div>
              <p>Interacciones</p>
              <strong>{total("interactions").toLocaleString("es-PA")}</strong>
            </div>
            <span className="stat-icon">♡</span>
          </div>
          <div className="card stat">
            <div>
              <p>Publicaciones</p>
              <strong>{total("publications").toLocaleString("es-PA")}</strong>
            </div>
            <span className="stat-icon">▤</span>
          </div>
        </div>
        <form className="filter-bar card" method="get">
          <select
            name="client"
            defaultValue={q.client || ""}
            aria-label="Filtrar por cliente"
          >
            <option value="">Todos los clientes</option>
            {projects.map((project: any) => (
              <option key={project.clientId} value={project.clientId}>
                {project.client?.name || "Cliente"}
              </option>
            ))}
          </select>
          <select
            name="platform"
            defaultValue={q.platform || ""}
            aria-label="Filtrar por plataforma"
          >
            <option value="">Todas las plataformas</option>
            {platforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
          <label>
            Desde <input type="date" name="from" defaultValue={q.from || ""} />
          </label>
          <label>
            Hasta <input type="date" name="to" defaultValue={q.to || ""} />
          </label>
          <button className="btn ghost" type="submit">
            Filtrar
          </button>
          <a className="btn ghost" href="/metricas">
            Limpiar
          </a>
        </form>
        <div className="card table-card">
          <div className="card-heading">
            <div>
              <h2 className="section-title">
                Registros de campañas y contenidos
              </h2>
              <p className="subtitle">{metrics.length} registros encontrados</p>
            </div>
          </div>
          {metrics.length ? (
            <div className="table-scroll">
              <table
                className="table metrics-table"
                aria-label="Registros de campañas y contenidos"
              >
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Proyecto</th>
                    <th scope="col">Plataforma</th>
                    <th scope="col">Campaña</th>
                    <th scope="col">Inversión</th>
                    <th scope="col">Impresiones</th>
                    <th scope="col">CTR</th>
                    <th scope="col">Coste / resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleMetrics.map((metric: any) => {
                    const ctr =
                      metric.impressions && metric.clicks
                        ? `${((metric.clicks / metric.impressions) * 100).toFixed(2)}%`
                        : "—";
                    const cpr =
                      metric.investment && metric.results
                        ? money(
                            Number(metric.investment) / Number(metric.results),
                          )
                        : "—";
                    return (
                      <tr key={metric.id}>
                        <td data-label="Fecha">{date(metric.date)}</td>
                        <td data-label="Proyecto">{metric.project?.name}</td>
                        <td data-label="Plataforma">
                          <span className="pill">{metric.platform}</span>
                        </td>
                        <td data-label="Campaña">{metric.name}</td>
                        <td data-label="Inversión">
                          <PrivateMoney value={money(metric.investment)} />
                        </td>
                        <td data-label="Impresiones">
                          {Number(metric.impressions || 0).toLocaleString(
                            "es-PA",
                          )}
                        </td>
                        <td data-label="CTR">{ctr}</td>
                        <td data-label="Coste / resultado">{cpr === "—" || cpr === "â€”" ? "—" : <PrivateMoney value={cpr} />}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">
              Registra tu primera campaña o pieza de contenido para ver sus
              resultados.
            </div>
          )}
        </div>
        <Pagination page={page} total={metrics.length} basePath="/metricas" query={{ client: q.client, platform: q.platform, from: q.from, to: q.to }} />
      </div>
    </AppShell>
  );
}
