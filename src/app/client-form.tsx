"use client";

import { useForm } from "react-hook-form";
import { createClient } from "./actions";

export default function ClientForm() {
  const {
    register,
    formState: { isSubmitting },
  } = useForm();
  return (
    <form action={createClient} className="card form-grid popover-form">
      <h2 className="section-title full">Nuevo cliente</h2>
      <div className="field full">
        <label>Empresa *</label>
        <input {...register("name")} required />
      </div>
      <div className="field">
        <label>Persona de contacto</label>
        <input {...register("contactName")} />
      </div>
      <div className="field">
        <label>Correo</label>
        <input {...register("email")} type="email" />
      </div>
      <div className="field">
        <label>Teléfono</label>
        <input {...register("phone")} />
      </div>
      <div className="field">
        <label>Sitio web</label>
        <input {...register("website")} type="url" />
      </div>
      <div className="field full">
        <label>Notas</label>
        <textarea {...register("notes")} rows={3} />
      </div>
      <div className="field full">
        <button className="btn lime" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar cliente"}
        </button>
      </div>
    </form>
  );
}
