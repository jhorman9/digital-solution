"use client";

import { createContext, useContext, useState } from "react";

const MoneyVisibilityContext = createContext({ allVisible: false, toggleAll: () => {} });

export function MoneyVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [allVisible, setAllVisible] = useState(false);
  return <MoneyVisibilityContext.Provider value={{ allVisible, toggleAll: () => setAllVisible((visible) => !visible) }}>{children}</MoneyVisibilityContext.Provider>;
}

export function MoneyVisibilityToggle() {
  const { allVisible, toggleAll } = useContext(MoneyVisibilityContext);
  return <button className="money-toggle" type="button" onClick={toggleAll} aria-pressed={allVisible} aria-label={allVisible ? "Ocultar todos los importes" : "Mostrar todos los importes"}>{allVisible ? "◉ Ocultar importes" : "◌ Mostrar importes"}</button>;
}

export function useMoneyVisibility() {
  return useContext(MoneyVisibilityContext);
}
