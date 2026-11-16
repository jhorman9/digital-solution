"use client";

import { useState } from "react";
import { useMoneyVisibility } from "./MoneyVisibility";

export default function PrivateMoney({ value, className }: { value: number | string; className?: string }) {
  const [visible, setVisible] = useState(false);
  const { allVisible } = useMoneyVisibility();
  const isVisible = visible || allVisible;
  return <span className={`private-money ${className || ""}`.trim()}><span aria-live="polite">{isVisible ? value : "*.**"}</span><button className="money-eye" type="button" onClick={() => setVisible((current) => !current)} aria-label={isVisible ? "Ocultar importe" : "Mostrar importe"} title={isVisible ? "Ocultar importe" : "Mostrar importe"}>{isVisible ? "◉" : "◌"}</button></span>;
}
