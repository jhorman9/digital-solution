"use client";

import { useEffect, useState } from "react";

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function format(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-PA", { dateStyle: "medium", timeZone: "America/Panama" }).format(new Date(`${value}T12:00:00Z`));
}

export default function CampaignDatePreview() {
  const [start, setStart] = useState("");
  const [days, setDays] = useState(1);

  useEffect(() => {
    const startInput = document.getElementById("expenseDate") as HTMLInputElement | null;
    const daysInput = document.getElementById("days") as HTMLInputElement | null;
    const update = () => {
      setStart(startInput?.value || "");
      setDays(Math.max(1, Number(daysInput?.value || 1)));
    };
    update();
    startInput?.addEventListener("input", update);
    daysInput?.addEventListener("input", update);
    return () => {
      startInput?.removeEventListener("input", update);
      daysInput?.removeEventListener("input", update);
    };
  }, []);

  const end = start ? addDays(start, days - 1) : "";
  return <p className="campaign-date-preview" aria-live="polite">Inicio: <strong>{format(start)}</strong> · Finaliza: <strong>{format(end)}</strong></p>;
}
