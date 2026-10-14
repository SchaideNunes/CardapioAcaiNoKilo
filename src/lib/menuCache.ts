import type { BuilderCategory, MenuData, MenuItemRecord } from "@/types/menu";

function isMenuItemRecord(value: unknown): value is MenuItemRecord {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.name === "string" && typeof item.price === "number" && typeof item.original_category === "string";
}

/**
 * Lê do localStorage o cardápio salvo pelo painel admin (modo demo/offline).
 * Devolve [] se não houver cache ou se ele estiver corrompido.
 */
export function readCachedMenuItems(key: string): MenuItemRecord[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    return Array.isArray(parsed) ? parsed.filter(isMenuItemRecord) : [];
  } catch {
    return [];
  }
}

/** Agrupa os itens ativos por etapa da montagem do açaí. */
export function groupBuilderMenu(items: MenuItemRecord[]): MenuData {
  const active = items.filter(item => item.active !== false);
  const byCategory = (category: BuilderCategory) => active.filter(item => item.original_category === category);
  return {
    sizes: byCategory("sizes"),
    flavors: byCategory("flavors"),
    toppings: byCategory("toppings"),
    addons: byCategory("addons"),
    creams: byCategory("creams"),
    fruits: byCategory("fruits"),
    fillings: byCategory("fillings"),
  };
}
