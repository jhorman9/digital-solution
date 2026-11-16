"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["Resumen", "/", "▦"],
  ["Proyectos", "/proyectos", "▥"],
  ["Clientes", "/clientes", "♧"],
  ["Pagos", "/pagos", "$"],
  ["Gastos", "/gastos", "−"],
  ["Métricas", "/metricas", "▥"],
  ["Plantillas", "/plantillas", "▤"],
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  return <>
    <aside className="sidebar">
      <Link href="/" className="brand brand-mark"><span className="brand-logo">↗</span><span className="brand-copy"><strong>Digital Solutions</strong><small>Espacio de trabajo</small></span></Link>
      <div className="eyebrow sidebar-label">Operación</div>
      <nav className="nav" aria-label="Navegación principal">{items.map(([label, href, icon]) => { const active = href === "/" ? pathname === "/" : pathname.startsWith(href); return <Link className={active ? "active" : ""} href={href} key={href}><span className="nav-icon">{icon}</span>{label}</Link>; })}</nav>
      <div className="sidebar-foot"><small>Guardado en este navegador</small><div className="profile"><strong>JN</strong><span><b>Jhorman Nieto</b><small>Digital Solutions</small></span></div></div>
    </aside>
    <nav className="mobile-nav" aria-label="Navegación móvil">{items.slice(0, 5).map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</nav>
  </>;
}
