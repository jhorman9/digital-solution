"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { BarChart3, BriefcaseBusiness, Building2, CircleDollarSign, LayoutDashboard, Megaphone, Receipt, Settings, Settings2, WalletCards } from "lucide-react";
import { useWorkspaceSettings } from "./WorkspaceSettings";

type NavItem = readonly [string, string, LucideIcon];
type NavSection = { label: string; items: readonly NavItem[] };

const sections: readonly NavSection[] = [
  { label: "Personal", items: [["Ingresos", "/ingresos-personales", CircleDollarSign], ["Gastos", "/gastos", Receipt]] },
  { label: "Clientes", items: [["Empresas", "/clientes", Building2], ["Ingresos", "/ingresos-clientes", WalletCards], ["Publicidad", "/marketing", Megaphone]] },
  { label: "Operación", items: [["Resumen", "/", LayoutDashboard], ["Proyectos", "/proyectos", BriefcaseBusiness], ["Métricas", "/metricas", BarChart3], ["Plantillas", "/plantillas", Settings2]] },
] as const;

const allItems = [...sections.flatMap((section) => section.items), ["ConfiguraciÃ³n", "/configuracion", Settings] as const];

export default function Sidebar() {
  const pathname = usePathname();
  const { settings } = useWorkspaceSettings();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);
  return <>
    <aside className="sidebar">
      <Link href="/" className="brand brand-mark"><span className="brand-logo">{settings.logoUrl ? <img src={settings.logoUrl} alt="" /> : <BriefcaseBusiness size={17} strokeWidth={2.4} />}</span><span className="brand-copy"><strong>{settings.title}</strong><small>Espacio de trabajo</small></span></Link>
      <nav className="nav grouped-nav" aria-label="Navegación principal">{sections.map((section) => <div className="nav-group" key={section.label}><div className="eyebrow sidebar-label">{section.label}</div>{section.items.map(([label, href, Icon]) => <Link className={isActive(href) ? "active" : ""} href={href} key={href}><Icon className="nav-icon" size={16} strokeWidth={2} aria-hidden="true" />{label}</Link>)}</div>)}</nav>
      <Link className={isActive("/configuracion") ? "sidebar-settings active" : "sidebar-settings"} href="/configuracion"><Settings size={16} strokeWidth={2} aria-hidden="true" />Configuración</Link>
      <div className="sidebar-foot"><div className="profile"><strong>JN</strong><span><b>Jhorman Nieto</b><small>Digital Solutions</small></span></div></div>
    </aside>
    <MobileNavigation items={allItems} isActive={isActive} />
  </>;
}

function MobileNavigation({ items, isActive }: { items: readonly NavItem[]; isActive: (href: string) => boolean }) {
  const primary = items.filter(([, href]) => ["/", "/proyectos", "/ingresos-clientes", "/marketing"].includes(href));
  const more = items.filter(([, href]) => !primary.some(([, primaryHref]) => primaryHref === href));
  return <nav className="mobile-nav" aria-label="Navegación móvil"><div className="mobile-nav-main">{primary.map(([label, href, Icon]) => <Link className={isActive(href) ? "active" : ""} href={href} key={href}><Icon size={19} strokeWidth={2} aria-hidden="true" /><span>{label}</span></Link>)}<details className="mobile-more"><summary><Settings2 size={19} strokeWidth={2} aria-hidden="true" /><span>Más</span></summary><div className="mobile-more-menu">{more.map(([label, href, Icon]) => <Link className={isActive(href) ? "active" : ""} href={href} key={href}><Icon size={17} strokeWidth={2} aria-hidden="true" /><span>{label}</span></Link>)}</div></details></div></nav>;
}
