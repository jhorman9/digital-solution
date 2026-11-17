"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export default function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    const markInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onDisplayModeChange = () => setIsInstalled(standalone.matches);
    const iosStandalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

    setIsInstalled(standalone.matches || iosStandalone);
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", markInstalled);
    standalone.addEventListener("change", onDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", markInstalled);
      standalone.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  if (!installPrompt || isInstalled) return null;

  return (
    <button
      className="btn ghost install-button"
      type="button"
      onClick={async () => {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome === "accepted") setIsInstalled(true);
        setInstallPrompt(null);
      }}
    >
      <Download size={15} aria-hidden="true" />
      Instalar app
    </button>
  );
}
