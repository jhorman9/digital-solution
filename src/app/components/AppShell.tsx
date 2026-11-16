import { redirect } from "next/navigation";
import { isAuthenticated, logout } from "@/lib/auth";
import Sidebar from "./Sidebar";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  if (!(await isAuthenticated())) redirect("/login");

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <header className="topbar">
          <span className="breadcrumb">Espacio de trabajo <i>/</i> Operación</span>
          <div className="top-actions">
            <label className="search-wrap">
              <span aria-hidden="true">⌕</span>
              <input className="search" aria-label="Búsqueda global" placeholder="Buscar en el espacio..." />
              <kbd>Ctrl K</kbd>
            </label>
            <form action={async () => { "use server"; await logout(); redirect("/login"); }}>
              <button className="btn ghost logout" type="submit">Salir</button>
            </form>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
