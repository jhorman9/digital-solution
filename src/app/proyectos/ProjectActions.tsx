"use client";

import Swal from "sweetalert2";
import {
  archiveProject,
  deleteProject,
  restoreProject,
  updateProjectName,
} from "../actions";

export default function ProjectActions({
  id,
  name,
  archived = false,
}: {
  id: string;
  name: string;
  archived?: boolean;
}) {
  async function edit() {
    const result = await Swal.fire({
      title: "Cambiar título",
      input: "text",
      inputValue: name,
      inputLabel: "Nombre del proyecto",
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) =>
        value.trim().length < 2 ? "Escribe al menos 2 caracteres" : undefined,
    });
    if (!result.isConfirmed) return;
    await updateProjectName(id, result.value as string);
    await Swal.fire({
      icon: "success",
      title: "Título actualizado",
      timer: 1400,
      showConfirmButton: false,
    });
  }
  async function remove() {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar proyecto?",
      text: "Solo se podrá eliminar si no tiene historial, tareas ni métricas.",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#bd5b57",
    });
    if (!result.isConfirmed) return;
    const response = await deleteProject(id);
    if (response.ok) {
      await Swal.fire({
        icon: "success",
        title: "Proyecto eliminado",
        timer: 1400,
        showConfirmButton: false,
      });
      return;
    }
    const alternative = await Swal.fire({
      icon: "info",
      title: "No se puede eliminar",
      text: response.error,
      showCancelButton: true,
      confirmButtonText: "Archivar proyecto",
      cancelButtonText: "Cerrar",
    });
    if (alternative.isConfirmed) {
      await archiveProject(id);
      await Swal.fire({
        icon: "success",
        title: "Proyecto archivado",
        text: "Se conservó todo su historial.",
        timer: 1600,
        showConfirmButton: false,
      });
    }
  }
  async function restore() {
    const result = await Swal.fire({
      icon: "question",
      title: "¿Habilitar proyecto?",
      text: "Volverá a las vistas activas.",
      showCancelButton: true,
      confirmButtonText: "Habilitar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    await restoreProject(id);
    await Swal.fire({
      icon: "success",
      title: "Proyecto habilitado",
      timer: 1400,
      showConfirmButton: false,
    });
  }
  if (archived)
    return (
      <div className="project-actions">
        <button className="btn lime small-btn" type="button" onClick={restore}>
          Habilitar proyecto
        </button>
      </div>
    );
  return (
    <div className="project-actions">
      <button className="btn ghost small-btn" type="button" onClick={edit}>
        Editar título
      </button>
      <button
        className="btn danger-button small-btn"
        type="button"
        onClick={remove}
      >
        Eliminar
      </button>
    </div>
  );
}
