"use client";

import { useEffect } from "react";

type Deadline = { id: string; expenseDate: string; days: number | null; concept: string; clientName: string };

function todayInPanama() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Panama", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function notify(title: string, body: string) {
  if (Notification.permission !== "granted") return;
  const registration = await navigator.serviceWorker.ready.catch(() => null);
  if (registration?.showNotification) {
    await registration.showNotification(title, { body, icon: "/icons/icon.svg", badge: "/icons/icon.svg", tag: `${title}-${body}`, data: { url: "/marketing" } });
  } else {
    new Notification(title, { body, icon: "/icons/icon.svg" });
  }
}

export default function DeadlineNotificationWatcher() {
  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (cancelled || !("Notification" in window) || Notification.permission !== "granted") return;
      const response = await fetch("/api/marketing/deadlines", { cache: "no-store" });
      if (!response.ok || cancelled) return;
      const data = (await response.json()) as { deadlines?: Deadline[] };
      const today = todayInPanama();
      const tomorrow = addDays(today, 1);
      for (const deadline of data.deadlines || []) {
        const end = addDays(deadline.expenseDate.slice(0, 10), Math.max(1, Number(deadline.days || 1)) - 1);
        const kind = end === today ? "DUE" : end === tomorrow ? "DUE_TOMORROW" : null;
        if (!kind) continue;
        const storageKey = `digital-solutions:deadline-notified:${deadline.id}:${kind}:${today}`;
        if (localStorage.getItem(storageKey)) continue;
        localStorage.setItem(storageKey, "1");
        const title = kind === "DUE" ? "Publicidad vence hoy" : "Publicidad vence mañana";
        await notify(title, `${deadline.clientName} · ${deadline.concept}`);
      }
    }
    void check().catch(() => undefined);
    const interval = window.setInterval(() => void check().catch(() => undefined), 60_000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, []);

  return null;
}
