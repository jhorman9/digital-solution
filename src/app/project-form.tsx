"use client";
import { useForm } from "react-hook-form";
import { createProject } from "./actions";
import MarkdownEditor from "./components/MarkdownEditor";
const services = [
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
];
export default function ProjectForm({
  clients,
}: {
  clients: { id: string; name: string }[];
}) {
  const {
    register,
    formState: { isSubmitting },
  } = useForm();
  return (
    <form action={createProject} className="card form-grid">
      <div className="field">
        <label>Cliente *</label>
        <select {...register("clientId")} required>
          <option value="">Selecciona…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Nombre del proyecto *</label>
        <input
          {...register("name")}
          required
          placeholder="Ej. Sitio web corporativo"
        />
      </div>
      <div className="field full">
        <label>Servicios (separados por coma) *</label>
        <input
          {...register("services")}
          required
          placeholder={services.slice(0, 3).join(", ")}
        />
      </div>
      <div className="field full">
        <label>Descripción</label>
        <MarkdownEditor
          name="description"
          rows={8}
          placeholder="# Objetivo del proyecto\n\nDescribe el alcance, contexto y entregables."
        />
      </div>
      <div className="field">
        <label>Fase</label>
        <select {...register("phase")} defaultValue="DISCOVERY">
          <option value="DISCOVERY">Descubrimiento</option>
          <option value="DESIGN">Diseño</option>
          <option value="DEVELOPMENT">Desarrollo</option>
          <option value="CONTENT">Contenido</option>
          <option value="ADVERTISING">Publicidad</option>
          <option value="SUPPORT">Soporte</option>
          <option value="CLOSURE">Cierre</option>
        </select>
      </div>
      <div className="field">
        <label>Estado</label>
        <select {...register("status")} defaultValue="NOT_STARTED">
          <option value="NOT_STARTED">Por iniciar</option>
          <option value="IN_PROGRESS">En progreso</option>
          <option value="IN_REVIEW">En revisión</option>
          <option value="COMPLETED">Completado</option>
        </select>
      </div>
      <div className="field">
        <label>Prioridad</label>
        <select {...register("priority")} defaultValue="MEDIUM">
          <option value="HIGH">Alta</option>
          <option value="MEDIUM">Media</option>
          <option value="LOW">Baja</option>
        </select>
      </div>
      <div className="field">
        <label>Inicio</label>
        <input {...register("startDate")} type="date" required />
      </div>
      <div className="field">
        <label>Entrega</label>
        <input {...register("dueDate")} type="date" required />
      </div>
      <div className="field full">
        <button className="btn lime" disabled={isSubmitting}>
          Crear proyecto
        </button>
      </div>
    </form>
  );
}
