"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const MONEY_VISIBILITY_KEY = "digital-solutions:money-visible";
type MoneyVisibilityContextValue = { allVisible: boolean; toggleAll: () => void };
const MoneyVisibilityContext = createContext<MoneyVisibilityContextValue>({ allVisible: false, toggleAll: () => {} });

export function MoneyVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [allVisible, setAllVisible] = useState(false);

  useEffect(() => {
    try {
      setAllVisible(window.localStorage.getItem(MONEY_VISIBILITY_KEY) === "true");
    } catch {
      // Algunos navegadores bloquean localStorage en modo privado; se mantiene el estado en memoria.
    }

    const syncVisibility = (event: StorageEvent) => {
      if (event.key === MONEY_VISIBILITY_KEY) setAllVisible(event.newValue === "true");
    };
    window.addEventListener("storage", syncVisibility);
    return () => window.removeEventListener("storage", syncVisibility);
  }, []);

  const toggleAll = () => {
    setAllVisible((visible) => {
      const next = !visible;
      try {
        window.localStorage.setItem(MONEY_VISIBILITY_KEY, String(next));
      } catch {
        // El botón sigue funcionando durante la sesión aunque el navegador no permita persistirlo.
      }
      return next;
    });
  };

  return <MoneyVisibilityContext.Provider value={{ allVisible, toggleAll }}>{children}</MoneyVisibilityContext.Provider>;
}

export function MoneyVisibilityToggle() {
  const { allVisible, toggleAll } = useContext(MoneyVisibilityContext);
  return <button className="money-toggle" type="button" onClick={toggleAll} aria-pressed={allVisible} aria-label={allVisible ? "Ocultar todos los importes" : "Mostrar todos los importes"}>{allVisible ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}<span>{allVisible ? "Ocultar importes" : "Mostrar importes"}</span></button>;
}

export function useMoneyVisibility() {
  return useContext(MoneyVisibilityContext);
}
