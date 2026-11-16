"use client";

import Swal from "sweetalert2";

export default function DeleteCompanyButton() {
  return (
    <button
      className="btn ghost small-btn danger-button"
      type="button"
      aria-label="Eliminar empresa"
      onClick={async (event) => {
        const form = event.currentTarget.form;
        const result = await Swal.fire({
          title: "¿Eliminar empresa?",
          text: "Solo se puede eliminar si no tiene historial asociado. Para conservar su información, puedes archivarla.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Sí, eliminar",
          cancelButtonText: "Cancelar",
          reverseButtons: true,
          focusCancel: true,
          confirmButtonColor: "#bd5b57",
          cancelButtonColor: "#12382f",
        });

        if (result.isConfirmed) {
          form?.requestSubmit();
        }
      }}
    >
      Eliminar
    </button>
  );
}
