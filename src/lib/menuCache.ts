import type { BuilderCategory, MenuData, MenuItem, MenuItemRecord } from "@/types/menu";

/** Chave onde o painel admin guarda o cardápio no modo demo/offline. */
export const MENU_CACHE_KEY = "cardapio_admin_menu_items_v3";
const LEGACY_MENU_CACHE_KEYS = ["cardapio_admin_menu_items_v2"];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMenuItemLike(value: unknown): value is MenuItem & { _id?: string } {
  return isObject(value) && typeof value.name === "string" && typeof value.price === "number";
}

function isMenuItemRecord(value: unknown): value is MenuItemRecord {
  return isMenuItemLike(value) && isObject(value) && typeof value.original_category === "string";
}

function buildMenu(listFor: (category: BuilderCategory) => MenuItem[]): MenuData {
  return {
    sizes: listFor("sizes"),
    flavors: listFor("flavors"),
    toppings: listFor("toppings"),
    addons: listFor("addons"),
    creams: listFor("creams"),
    fruits: listFor("fruits"),
    fillings: listFor("fillings"),
  };
}

/** Itens criados pelo admin no banco só têm _id; a seleção do cardápio depende de um id único. */
function withStableId<T extends { id?: string; _id?: string }>(item: T): T & { id: string } {
  return { ...item, id: item.id || item._id || "" };
}

function parseCache(key: string): MenuItemRecord[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    return Array.isArray(parsed) ? parsed.filter(isMenuItemRecord).map(withStableId) : [];
  } catch {
    return [];
  }
}

/**
 * Lê do localStorage o cardápio salvo pelo painel admin (modo demo/offline), inclusive
 * itens desativados. Devolve [] se não houver cache ou se ele estiver corrompido.
 */
export function readCachedMenuItems(): MenuItemRecord[] {
  for (const key of [MENU_CACHE_KEY, ...LEGACY_MENU_CACHE_KEYS]) {
    const items = parseCache(key);
    if (items.length > 0) return items;
  }
  return [];
}

/** Agrupa os itens ativos por etapa da montagem do açaí. */
export function groupBuilderMenu(items: MenuItemRecord[]): MenuData {
  const active = items.filter(item => item.active !== false).map(withStableId);
  return buildMenu(category => active.filter(item => item.original_category === category));
}

/** Valida e normaliza a resposta de GET /api/menu; null se não for um cardápio. */
export function normalizeMenuData(data: unknown): MenuData | null {
  if (!isObject(data) || !Array.isArray(data.sizes)) return null;
  return buildMenu(category => {
    const list = data[category];
    return Array.isArray(list) ? list.filter(isMenuItemLike).map(withStableId) : [];
  });
}
