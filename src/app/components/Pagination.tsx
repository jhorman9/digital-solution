import Link from "next/link";

export default function Pagination({ page, total, basePath, query = {}, pageSize = 10 }: { page: number; total: number; basePath: string; query?: Record<string, string | undefined>; pageSize?: number }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  const href = (nextPage: number) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => { if (value) params.set(key, value); });
    params.set("page", String(nextPage));
    return `${basePath}?${params.toString()}`;
  };
  return (
    <nav className="pagination" aria-label="Paginación">
      {page > 1 ? <Link className="btn ghost small-btn" href={href(page - 1)} scroll={false}>Anterior</Link> : <span className="btn ghost small-btn disabled-button" aria-disabled="true">Anterior</span>}
      <span aria-live="polite" aria-atomic="true">Página {page} de {totalPages}</span>
      {page < totalPages ? <Link className="btn ghost small-btn" href={href(page + 1)} scroll={false}>Siguiente</Link> : <span className="btn ghost small-btn disabled-button" aria-disabled="true">Siguiente</span>}
    </nav>
  );
}
