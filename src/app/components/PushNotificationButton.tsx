"use client";

import { Bell, BellRing } from "lucide-react";
import { useEffect, useState } from "react";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

export default function PushNotificationButton() {
  const [supported, setSupported] = useState(true);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function checkSubscription() {
      if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelled) setSupported(false);
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!cancelled) setActive(Boolean(subscription));
    }
    void checkSubscription().catch(() => {
      if (!cancelled) setSupported(false);
    });
    return () => { cancelled = true; };
  }, []);

  async function enableNotifications() {
    setBusy(true);
    setMessage("");
    try {
      if (!supported) throw new Error("Este navegador no admite avisos push.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Permiso de avisos no concedido.");
      const registration = await navigator.serviceWorker.ready;
      const keyResponse = await fetch("/api/push/vapid-public-key");
      const keyData = (await keyResponse.json()) as { publicKey?: string; error?: string };
      if (!keyResponse.ok || !keyData.publicKey) throw new Error(keyData.error || "No se pudo preparar los avisos.");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
      });
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "No se pudo guardar la suscripción.");
      }
      setActive(true);
      setMessage("Avisos activos");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudieron activar los avisos.");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return <span className="push-status">Avisos no disponibles</span>;
  return (
    <div className="push-control">
      <button className="btn ghost push-button" type="button" onClick={enableNotifications} disabled={busy || active} aria-pressed={active}>
        {active ? <BellRing size={15} aria-hidden="true" /> : <Bell size={15} aria-hidden="true" />}
        {busy ? "Activando…" : active ? "Avisos activos" : "Activar avisos"}
      </button>
      {message && <span className="push-status" role="status" aria-live="polite">{message}</span>}
    </div>
  );
}
