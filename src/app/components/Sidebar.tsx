"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = readonly [string, string, string];
type NavSection = { label: string; items: readonly NavItem[] };

const sections: readonly NavSection[] = [
  {
    label: "Personal",
    items: [
      ["Ingresos", "/ingresos-personales", "$"],
      ["Gastos", "/gastos", "−"],
    ],
  },
  {
    label: "Clientes",
    items: [
      ["Ingresos", "/ingresos-clientes", "$"],
      ["Publicidad", "/marketing", "◈"],
    ],
  },
  {
    label: "Operación",
    items: [
      ["Resumen", "/", "▦"],
      ["Proyectos", "/proyectos", "▥"],
      ["Métricas", "/metricas", "▥"],
      ["Plantillas", "/plantillas", "▤"],
    ],
  },
] as const;

const allItems = sections.flatMap((section) => section.items);

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <>
      <aside className="sidebar">
        <Link href="/" className="brand brand-mark">
          <span className="brand-logo">J</span>
          <span className="brand-copy">
            <strong>Jhorman Nieto P</strong>
            <small>Espacio de trabajo</small>
          </span>
        </Link>
        <nav className="nav grouped-nav" aria-label="Navegación principal">
          {sections.map((section) => (
            <div className="nav-group" key={section.label}>
              <div className="eyebrow sidebar-label">{section.label}</div>
              {section.items.map(([label, href, icon]) => (
                <Link
                  className={isActive(href) ? "active" : ""}
                  href={href}
                  key={href}
                >
                  <span className="nav-icon">{icon}</span>
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="profile">
            <strong>JN</strong>
            <span>
              <b>Jhorman Nieto</b>
              <small>Digital Solutions</small>
            </span>
          </div>
        </div>
      </aside>
      <nav className="mobile-nav" aria-label="Navegación móvil">
        {allItems.slice(0, 5).map(([label, href]) => (
          <Link
            className={isActive(href) ? "active" : ""}
            href={href}
            key={href}
          >
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
