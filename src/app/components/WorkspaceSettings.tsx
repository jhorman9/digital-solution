"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type WorkspaceSettings = {
  title: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  showProjects: boolean;
};
const defaults: WorkspaceSettings = {
  title: "Jhorman Nieto P",
  logoUrl: "",
  primaryColor: "#12382f",
  accentColor: "#d9fa6c",
  showProjects: true,
};
const storageKey = "digital-solutions:workspace-settings";
const WorkspaceSettingsContext = createContext<{
  settings: WorkspaceSettings;
  save: (next: WorkspaceSettings) => void;
  reset: () => void;
}>({ settings: defaults, save: () => undefined, reset: () => undefined });

function applyTheme(settings: WorkspaceSettings) {
  const root = document.documentElement;
  root.style.setProperty("--ink", settings.primaryColor);
  root.style.setProperty("--ink-2", settings.primaryColor);
  root.style.setProperty("--lime", settings.accentColor);
}

export function WorkspaceSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<WorkspaceSettings>(defaults);
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      applyTheme(defaults);
      return;
    }
    try {
      const next = {
        ...defaults,
        ...(JSON.parse(stored) as Partial<WorkspaceSettings>),
      };
      setSettings(next);
      applyTheme(next);
    } catch {
      applyTheme(defaults);
    }
  }, []);
  const value = useMemo(
    () => ({
      settings,
      save: (next: WorkspaceSettings) => {
        setSettings(next);
        localStorage.setItem(storageKey, JSON.stringify(next));
        applyTheme(next);
      },
      reset: () => {
        setSettings(defaults);
        localStorage.removeItem(storageKey);
        applyTheme(defaults);
      },
    }),
    [settings],
  );
  return (
    <WorkspaceSettingsContext.Provider value={value}>
      {children}
    </WorkspaceSettingsContext.Provider>
  );
}

export function useWorkspaceSettings() {
  return useContext(WorkspaceSettingsContext);
}
