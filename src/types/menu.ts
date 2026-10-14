export const MENU_CATEGORIES = ["sizes", "flavors", "toppings", "addons", "creams", "fruits", "fillings", "ready_made"] as const;

export type MenuCategory = (typeof MENU_CATEGORIES)[number];

/** Categorias usadas nas etapas de montagem do açaí (tudo menos os prontos). */
export type BuilderCategory = Exclude<MenuCategory, "ready_made">;

/** Item do cardápio como o cliente vê. */
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  type?: string;
  image?: string;
}

/** Item como gravado no MongoDB (coleção do cardápio) e editado no painel admin. */
export interface MenuItemRecord extends MenuItem {
  _id: string;
  original_category: string;
  active: boolean;
}

/** Cardápio da montagem agrupado por etapa (formato de GET /api/menu, sem os prontos). */
export type MenuData = Record<BuilderCategory, MenuItem[]>;

/** Açaí pronto exibido em /prontos. */
export interface ReadyProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  /** Classe Tailwind de escala para enquadrar a foto no card */
  imageScale?: string;
}
