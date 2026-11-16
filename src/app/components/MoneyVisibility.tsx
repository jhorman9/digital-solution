"use client";

import { createContext, useContext, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const MoneyVisibilityContext = createContext({ allVisible: false, toggleAll: () => {} });

export function MoneyVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [allVisible, setAllVisible] = useState(false);
  return <MoneyVisibilityContext.Provider value={{ allVisible, toggleAll: () => setAllVisible((visible) => !visible) }}>{children}</MoneyVisibilityContext.Provider>;
}

export function MoneyVisibilityToggle() {
  const { allVisible, toggleAll } = useContext(MoneyVisibilityContext);
  return <button className="money-toggle" type="button" onClick={toggleAll} aria-pressed={allVisible} aria-label={allVisible ? "Ocultar todos los importes" : "Mostrar todos los importes"}>{allVisible ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}<span>{allVisible ? "Ocultar importes" : "Mostrar importes"}</span></button>;
}

export function useMoneyVisibility() {
  return useContext(MoneyVisibilityContext);
}
