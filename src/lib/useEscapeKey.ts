import { useEffect, useEffectEvent } from "react";

/**
 * Chama `onEscape` quando a tecla Esc é pressionada enquanto `active` for verdadeiro.
 * Para diálogos e folhas: funciona mesmo se o foco ficou no botão que abriu o diálogo.
 */
export function useEscapeKey(active: boolean, onEscape: () => void) {
  const handleEscape = useEffectEvent(onEscape);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleEscape();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active]);
}
