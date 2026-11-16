"use client";

import { useForm } from "react-hook-form";
import { createMetric } from "../actions";

export default function MetricForm({
  projects,
}: {
  projects: { id: string; name: string; client?: { name: string } }[];
}) {
  const {
    register,
    formState: { isSubmitting },
  } = useForm();
  return (
    <form
      action={createMetric}
      className="card form-grid popover-form metric-form"
    >
      <h2 className="section-title full">Registrar métrica</h2>
      <div className="field">
        <label>Proyecto *</label>
        <select {...register("projectId")} required>
          <option value="">Selecciona...</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Fecha *</label>
        <input type="date" {...register("date")} required />
      </div>
      <div className="field">
        <label>Plataforma *</label>
        <input
          {...register("platform")}
          placeholder="Meta Ads, Instagram..."
          required
        />
      </div>
      <div className="field">
        <label>Campaña o contenido *</label>
        <input {...register("name")} required />
      </div>
      {[
        ["investment", "Inversión"],
        ["impressions", "Impresiones"],
        ["reach", "Alcance"],
        ["clicks", "Clics"],
        ["results", "Resultados"],
        ["interactions", "Interacciones"],
        ["publications", "Publicaciones"],
      ].map(([key, label]) => (
        <div className="field" key={key}>
          <label>{label}</label>
          <input type="number" min="0" step="any" {...register(key)} />
        </div>
      ))}
      <div className="field full">
        <button className="btn lime" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar métrica"}
        </button>
      </div>
    </form>
  );
}
