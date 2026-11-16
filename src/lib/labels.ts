export const statusLabels = {
  NOT_STARTED: "Por iniciar",
  IN_PROGRESS: "En progreso",
  IN_REVIEW: "En revisión",
  COMPLETED: "Completado",
} as const;

export const phaseLabels = {
  DISCOVERY: "Descubrimiento",
  DESIGN: "Diseño",
  DEVELOPMENT: "Desarrollo",
  CONTENT: "Contenido",
  ADVERTISING: "Publicidad",
  SUPPORT: "Soporte",
  CLOSURE: "Cierre",
} as const;

export const priorityLabels = { HIGH: "Alta", MEDIUM: "Media", LOW: "Baja" } as const;
export const statusTone = { NOT_STARTED: "muted", IN_PROGRESS: "lime", IN_REVIEW: "amber", COMPLETED: "green" } as const;

export const serviceOptions = [
  "Páginas web a medida",
  "WordPress/WooCommerce",
  "Meta Ads",
  "Facebook",
  "Instagram",
  "Fotografía",
  "Edición de video",
  "Subida de contenidos",
  "Soporte",
  "Conexiones vía API",
] as const;

export const date = (value: Date | string | number) => new Intl.DateTimeFormat("es-PA", {
  dateStyle: "medium",
  timeZone: "America/Panama",
}).format(new Date(value));

export const money = (value: number | string | null | undefined) => new Intl.NumberFormat("es-PA", {
  style: "currency",
  currency: "USD",
}).format(Number(value || 0));
