import React, { useState, useEffect, useEffectEvent, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Home,
  Box, 
  PlusCircle,
  Layers,
  BarChart3,
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Image as ImageIcon, 
  Check, 
  X, 
  AlertTriangle,
  Upload,
  Sparkles,
  LayoutGrid,
  Droplets,
  Milk,
  Apple,
  Cookie,
  ShoppingBag,
  LogOut,
  RefreshCw,
  MoreHorizontal,
  CreditCard,
  Wallet,
  QrCode,
  MapPin,
  Clock,
  ArrowRight,
  Bike,
  ChevronDown,
  Store,
  Banknote,
  Receipt
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { menuData as localFallbackData, readyMadeProducts } from "@/data/menu";
import type { MenuItemRecord } from "@/types/menu";
import type { OrderRecord, OrderStatus } from "@/types/order";
import { normalizeDeliveryMethod, normalizePaymentMethod, normalizeOrderStatus, nextOrderStatus, orderStatusLabel, DELIVERY_LABELS, PAYMENT_LABELS } from "@/lib/orders";
import { DEMO_TOKEN } from "@/lib/demo";
import { MENU_CACHE_KEY, readCachedMenuItems } from "@/lib/menuCache";
import { computeOrderMetrics, earliestReportStart, filterOrdersByPeriod, type ReportPeriod } from "@/lib/reports";
import { apiUrl } from "@/lib/api";
import { formatBRL } from "@/lib/whatsapp";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export const CATEGORIES_CONFIG = [
  { key: "all", label: "Todos os Itens", shortLabel: "Todos", Icon: LayoutGrid },
  { key: "sizes", label: "Tamanhos de Potes", shortLabel: "Potes", Icon: Layers },
  { key: "flavors", label: "Sabores de Açaí", shortLabel: "Sabores", Icon: Sparkles },
  { key: "toppings", label: "Coberturas", shortLabel: "Coberturas", Icon: Droplets },
  { key: "addons", label: "Adicionais", shortLabel: "Adicionais", Icon: PlusCircle },
  { key: "creams", label: "Cremes", shortLabel: "Cremes", Icon: Milk },
  { key: "fruits", label: "Frutas Frescas", shortLabel: "Frutas", Icon: Apple },
  { key: "fillings", label: "Recheios Especiais", shortLabel: "Recheios", Icon: Cookie },
  { key: "ready_made", label: "Prontos para Levar", shortLabel: "Prontos", Icon: ShoppingBag },
];

export function resolveItemImage(item: Partial<MenuItemRecord>): string {
  if (item.image && item.image.trim() !== '') {
    return item.image;
  }
  const id = item.id || item._id || '';

  // Tamanhos de potes
  if (id === 'pot_360') return '/assets/items/Açai_350ml.webp';
  if (id === 'pot_500') return '/assets/items/Açai_500ml.webp';
  if (id === 'pot_750') return '/assets/items/Açai_750ml.webp';
  if (id === 'pot_1l') return '/assets/items/POTE_LITRO.webp';

  // Produtos prontos
  if (item.original_category === 'ready_made' || id.startsWith('500ml_') || id.startsWith('1l_') || id.startsWith('2l_')) {
    return `/assets/${id}.webp`;
  }

  // Complementos, frutas, cremes, recheios, adicionais, coberturas e sabores
  if (id) {
    return `/assets/items/${id}.webp`;
  }

  return '';
}

// Id provisório de itens criados no painel; ao salvar no servidor ele é trocado pelo _id do banco
function createLocalItemId(): string {
  return "item_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

type OrderFilter = "all" | "open" | "delivery" | "pickup" | "pix" | "card" | "cash";

// Cor da etiqueta de cada status (chapada, sem sombra)
const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  new: "bg-[#F0DF58] text-[#120714] border-[#120714]",
  preparing: "bg-[#F58220]/10 text-[#F58220] border-[#F58220]/60",
  ready: "bg-[#F8EEA6]/10 text-[#F8EEA6] border-[#F8EEA6]/60",
  done: "bg-white/[0.06] text-white/75 border-white/20",
  cancelled: "bg-transparent text-white/45 border-white/10 line-through",
};

// Classes do sistema 2D (DESIGN.md), as mesmas da montagem e da /prontos
const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F0DF58]";
const pillBase = "inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border-2 px-4 text-sm font-bold transition-colors duration-200 ease-out";
const pillIdle = "border-white/10 bg-[#2f1729] text-white/80 hover:border-white/30 hover:text-white";
const pillOn = "border-[#120714] bg-[#F0DF58] text-[#120714]";
const roundGhost = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white/20 text-white/80 transition-colors duration-200 ease-out hover:border-white/50 hover:text-white lg:h-10 lg:w-10";
const primaryBtn = "inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-[#120714] bg-[#F0DF58] px-5 font-heading text-[22px] uppercase leading-none text-[#120714] transition-colors duration-200 ease-out hover:bg-[#F8EEA6]";
const panelCard = "rounded-[28px] border-2 border-white/10 bg-[#2f1729]";
const sideLink = "flex min-h-11 items-center gap-3 rounded-full border-2 border-transparent px-4 text-left text-sm font-semibold text-white/75 transition-colors duration-200 ease-out hover:border-white/20 hover:text-white disabled:opacity-60";

type AdminTab = "overview" | "menu" | "orders" | "reports";

const NAV_TABS: { key: AdminTab; label: string; short: string; Icon: typeof Home }[] = [
  { key: "overview", label: "Visão Geral", short: "Início", Icon: Home },
  { key: "menu", label: "Gestão do Cardápio", short: "Cardápio", Icon: Box },
  { key: "orders", label: "Pedidos do Dia", short: "Pedidos", Icon: Receipt },
  { key: "reports", label: "Relatórios", short: "Relatórios", Icon: BarChart3 },
];

function PageHeader({ title, hint, children }: { title: string; hint: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-balance font-heading text-[clamp(2.5rem,9vw,3.5rem)] uppercase leading-[0.9] text-white">{title}</h2>
        <p className="mt-2 text-[15px] text-white/75">{hint}</p>
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}

const orderChip = "inline-flex items-center gap-1.5 rounded-full border-2 border-white/10 px-3 py-1 text-[13px] font-bold text-white/80";

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

// Número de resumo (pedidos e relatórios); o rótulo nomeia o grupo para leitores de tela
function StatCard({ label, value, note, gold, className }: { label: string; value: string; note?: string; gold?: boolean; className?: string }) {
  return (
    <div role="group" aria-label={label} className={cn("rounded-[24px] border-2 border-white/10 bg-[#2f1729] p-3 xs:p-4 sm:p-5", className)}>
      <p className="text-[13px] font-bold leading-tight text-white/75">{label}</p>
      <p className={cn("mt-1.5 whitespace-nowrap font-heading text-[clamp(1.5rem,7vw,2.5rem)] leading-none", gold ? "text-[#F0DF58]" : "text-white")}>
        {value}
      </p>
      {note && <p className="mt-1.5 text-[13px] leading-snug text-white/60">{note}</p>}
    </div>
  );
}

// Atalho da visão geral: número grande e o caminho para a aba que resolve
function OverviewTile({ label, value, hint, highlight, onClick }: { label: string; value: string; hint: string; highlight?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-2 rounded-[28px] border-2 p-5 text-left transition-colors duration-200 ease-out",
        focusRing,
        highlight ? "border-[#120714] bg-[#F0DF58] text-[#120714] hover:bg-[#F8EEA6]" : "border-white/10 bg-[#2f1729] text-white hover:border-white/30"
      )}
    >
      <span className="flex w-full items-center justify-between gap-3 text-sm font-bold">
        {label}
        <ArrowRight size={18} aria-hidden="true" />
      </span>
      <span className="whitespace-nowrap font-heading text-[clamp(2.5rem,10vw,3.5rem)] leading-none">{value}</span>
      <span className={cn("text-[13px]", highlight ? "text-[#120714]/75" : "text-white/60")}>{hint}</span>
    </button>
  );
}

const fieldLabel = "block text-sm font-bold text-white/80";
const fieldInput = "h-12 w-full rounded-2xl border-2 border-white/10 bg-[#2f1729] px-4 text-base text-white caret-[#F0DF58] transition-colors placeholder:text-white/40 focus:border-[#F0DF58] focus:outline-none";

// Categorias do formulário de item (as chaves são as do servidor, ver validateMenuItem)
const ITEM_CATEGORY_OPTIONS: [string, string][] = [
  ["sizes", "Tamanho de pote"],
  ["flavors", "Sabor de açaí"],
  ["toppings", "Cobertura"],
  ["addons", "Adicional"],
  ["creams", "Creme"],
  ["fruits", "Fruta"],
  ["fillings", "Recheio"],
  ["ready_made", "Pronto para levar"],
];

const LOCAL_STORAGE_KEY = MENU_CACHE_KEY;

const demoOrders: OrderRecord[] = [
  {
    _id: "demo_1",
    total: 35.50,
    paymentMethod: "Pix",
    deliveryMethod: "Entrega",
    items: ["Pote de 500ml", "Morango", "Leite em pó", "Calda de Chocolate"],
    createdAt: new Date().toISOString(),
    status: "new",
    address: { street: "Av. Principal", neighborhood: "Centro", number: "120" }
  },
  {
    _id: "demo_2",
    total: 22.00,
    paymentMethod: "Dinheiro",
    deliveryMethod: "Retirada",
    items: ["Pote de 360ml", "Granola tradicional", "Mel"],
    createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
    status: "preparing"
  },
  {
    _id: "demo_3",
    total: 38.00,
    paymentMethod: "Cartão",
    deliveryMethod: "Entrega",
    items: ["Açaí Zero Açúcar 1L (Pronto)"],
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    address: { street: "Rua das Flores", neighborhood: "Jardim América", number: "45" },
    status: "ready"
  },
  {
    _id: "demo_4",
    total: 42.50,
    paymentMethod: "Pix",
    deliveryMethod: "Entrega",
    items: ["Pote de 750ml", "Nutella", "Leite em pó", "Morango", "Banana"],
    createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
    address: { street: "Rua Santos Dumont", neighborhood: "Vila Nova", number: "302" },
    status: "done"
  }
];

// Cardápio do modo demo/offline: cache do admin no navegador ou, na falta dele, os dados estáticos
function getInitialFallbackItems(): MenuItemRecord[] {
  const cached = readCachedMenuItems();
  if (cached.length > 0) {
    return cached.map(item => ({
      ...item,
      image: item.image || resolveItemImage(item)
    }));
  }

  const formatted: MenuItemRecord[] = [];
  Object.entries(localFallbackData).forEach(([cat, items]) => {
    items.forEach((i) => {
      formatted.push({
        _id: i.id,
        id: i.id,
        name: i.name,
        price: i.price,
        category: i.category,
        original_category: cat,
        image: i.image || resolveItemImage({ id: i.id, original_category: cat }),
        description: i.description || '',
        type: i.type || '',
        active: true
      });
    });
  });

  // Adiciona itens prontos como categoria ready_made
  readyMadeProducts.forEach(r => {
    formatted.push({
      _id: r.id,
      id: r.id,
      name: r.name,
      price: r.price,
      category: "Pronto",
      original_category: "ready_made",
      image: r.image,
      active: true
    });
  });

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formatted));
  return formatted;
}

type AdminData = { menuItems: MenuItemRecord[]; orders: OrderRecord[] };

// Busca cardápio (inclusive desativados) e pedidos no servidor. Lança se o servidor estiver inacessível.
async function fetchAdminData(token: string): Promise<AdminData | "unauthorized"> {
  const headers = { Authorization: `Bearer ${token}` };
  const [menuRes, ordersRes] = await Promise.all([
    fetch(apiUrl("/api/admin/menu"), { headers }),
    fetch(`${apiUrl("/api/admin/orders")}?from=${encodeURIComponent(earliestReportStart(new Date()).toISOString())}`, { headers })
  ]);

  if (menuRes.status === 401 || ordersRes.status === 401) return "unauthorized";

  const backendItems: unknown = await menuRes.json();
  const menuItems = Array.isArray(backendItems) && backendItems.length > 0
    ? backendItems.map((item: MenuItemRecord) => ({ ...item, image: item.image || resolveItemImage(item) }))
    : getInitialFallbackItems();
  return { menuItems, orders: await ordersRes.json() };
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("menu");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  // Filtros da aba de pedidos
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  // Pedido aguardando a confirmação de cancelamento
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  // Filtro de período da aba de relatórios
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("today");
  // Momento de referência para "hoje" e para os períodos; renovado ao sincronizar
  const [now, setNow] = useState(() => new Date());

  const token = localStorage.getItem("adminToken");
  const isDemo = token === DEMO_TOKEN;

  const [menuItems, setMenuItems] = useState<MenuItemRecord[]>(() => (isDemo ? getInitialFallbackItems() : []));
  const [orders, setOrders] = useState<OrderRecord[]>(() => (isDemo ? demoOrders : []));
  const [loading, setLoading] = useState(!isDemo);
  const [syncing, setSyncing] = useState(false);
  
  // Modals & Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemRecord | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItemRecord | null>(null);
  const [savingItem, setSavingItem] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const navigate = useNavigate();

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/login");
  };

  // Bloquear scroll de fundo quando modal estiver aberto
  useEffect(() => {
    if (modalOpen || itemToDelete || mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen, itemToDelete, mobileDrawerOpen]);

  // Busca cardápio e pedidos no servidor e aplica no estado. Lança se o servidor estiver inacessível.
  // Aplica no estado o resultado de fetchAdminData; token expirado volta para o login
  const applyServerData = (result: AdminData | "unauthorized"): "ok" | "unauthorized" => {
    if (result === "unauthorized") {
      handleLogout();
      return "unauthorized";
    }
    setMenuItems(result.menuItems);
    setOrders(result.orders);
    return "ok";
  };

  // Busca cardápio e pedidos no servidor e aplica no estado. Lança se o servidor estiver inacessível.
  const loadFromServer = async () => applyServerData(await fetchAdminData(token ?? ""));

  /**
   * Envia uma alteração do cardápio ao servidor. Offline (ou no modo demo) a alteração
   * fica só no estado local; se o servidor recusar, avisa e recarrega o estado real do banco.
   */
  const sendAdminChange = async (
    path: `/${string}`,
    init: RequestInit
  ): Promise<{ status: "saved"; data: unknown } | { status: "local" | "rejected" }> => {
    if (!token || token === DEMO_TOKEN) return { status: "local" };

    let res: Response;
    try {
      res = await fetch(apiUrl(path), {
        ...init,
        headers: { "Content-Type": "application/json", ...init.headers, Authorization: `Bearer ${token}` }
      });
    } catch {
      console.warn("Backend offline, alteração salva localmente no Modo Demo.");
      return { status: "local" };
    }

    if (res.status === 401) {
      handleLogout();
      return { status: "rejected" };
    }
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      showToast(data?.error || "O servidor recusou a alteração.", "error");
      await loadFromServer().catch(() => undefined);
      return { status: "rejected" };
    }
    return { status: "saved", data: await res.json().catch(() => null) };
  };

  const onServerData = useEffectEvent(applyServerData);

  // Carrega os dados ao abrir o painel (offline cai para os dados locais do modo demo), ou manda para o login sem token
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (isDemo) return;
    fetchAdminData(token)
      .then(result => onServerData(result))
      .catch(() => {
        console.log("Modo Demo Admin: Carregando banco de dados local sincronizado.");
        setMenuItems(getInitialFallbackItems());
        setOrders(demoOrders);
      })
      .finally(() => setLoading(false));
  }, [token, isDemo, navigate]);

  // Ação manual com feedback visual interativo
  const handleSyncData = async () => {
    setSyncing(true);
    setNow(new Date());
    try {
      if (token === DEMO_TOKEN) {
        await new Promise(res => setTimeout(res, 600)); // Delay para sensação tátil de sincronização
        setMenuItems(getInitialFallbackItems());
        setOrders(demoOrders);
        showToast("Dados sincronizados com sucesso!", "success");
      } else if (await loadFromServer() === "ok") {
        showToast("Dados sincronizados com sucesso!", "success");
      }
    } catch {
      console.log("Modo Demo Admin: Sincronização local.");
      setMenuItems(getInitialFallbackItems());
      setOrders(demoOrders);
      showToast("Dados sincronizados localmente!", "info");
    } finally {
      setSyncing(false);
    }
  };

  // Salvar no estado e sincronizar local/backend
  const saveItemsState = (newItems: MenuItemRecord[]) => {
    setMenuItems(newItems);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newItems));
  };

  // Quick Inline Update (Preço / Estoque)
  const updateItemQuick = async (id: string, updates: Partial<MenuItemRecord>) => {
    const updatedList = menuItems.map(item => item._id === id ? { ...item, ...updates } : item);
    saveItemsState(updatedList);

    const result = await sendAdminChange(`/api/admin/menu/${id}`, { method: "PUT", body: JSON.stringify(updates) });
    if (result.status !== "rejected") showToast("Item atualizado com sucesso!");
  };

  // Salvar Item do Modal (Criar ou Atualizar Completo)
  const handleSaveItemModal = async (formData: Partial<MenuItemRecord>) => {
    setSavingItem(true);
    try {
      if (editingItem) {
        // Modo Edição
        const updatedItem: MenuItemRecord = {
          ...editingItem,
          ...formData,
          name: formData.name || editingItem.name,
          price: typeof formData.price === 'number' ? formData.price : editingItem.price,
          category: formData.category || editingItem.category,
          original_category: formData.original_category || editingItem.original_category,
          image: formData.image !== undefined ? formData.image : editingItem.image,
          active: formData.active !== undefined ? formData.active : editingItem.active,
        };

        const updatedList = menuItems.map(i => i._id === editingItem._id ? updatedItem : i);
        saveItemsState(updatedList);

        const result = await sendAdminChange(`/api/admin/menu/${editingItem._id}`, { method: "PUT", body: JSON.stringify(formData) });
        if (result.status !== "rejected") showToast(`Item "${updatedItem.name}" atualizado!`);
      } else {
        // Modo Criação
        const newId = createLocalItemId();
        const newItem: MenuItemRecord = {
          _id: newId,
          id: newId,
          name: formData.name || "Novo Produto",
          price: formData.price || 0,
          category: formData.category || "Personalizado",
          original_category: formData.original_category || "addons",
          image: formData.image || "",
          description: formData.description || "",
          type: formData.type || "",
          active: formData.active !== false,
        };

        const updatedList = [newItem, ...menuItems];
        saveItemsState(updatedList);

        const result = await sendAdminChange("/api/admin/menu", { method: "POST", body: JSON.stringify(newItem) });
        if (result.status === "saved") {
          // Troca o id provisório pelo _id gerado no banco para que edições futuras acertem o item
          const savedId = (result.data as { item?: { _id?: string } } | null)?.item?._id;
          if (savedId) saveItemsState(updatedList.map(i => i._id === newId ? { ...i, _id: savedId } : i));
        }
        if (result.status !== "rejected") showToast(`Novo item "${newItem.name}" adicionado com sucesso!`);
      }

      setModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error(err);
      showToast("Erro ao salvar item.", "error");
    } finally {
      setSavingItem(false);
    }
  };

  // Muda o status de um pedido (atualiza a tela na hora; o servidor confirma ou o painel recarrega)
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setCancelingOrderId(null);
    setOrders(prev => prev.map(o => (o._id === orderId ? { ...o, status } : o)));
    const result = await sendAdminChange(`/api/admin/orders/${orderId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    if (result.status !== "rejected") showToast(`Pedido #${orderId.slice(-6).toUpperCase()} atualizado.`);
  };

  // Excluir Item
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    const targetId = itemToDelete._id;
    const targetName = itemToDelete.name;

    const updatedList = menuItems.filter(i => i._id !== targetId);
    saveItemsState(updatedList);

    const result = await sendAdminChange(`/api/admin/menu/${targetId}`, { method: "DELETE" });
    if (result.status !== "rejected") showToast(`Item "${targetName}" removido do cardápio!`);
    setItemToDelete(null);
  };

  // Filtragem dos Itens do Cardápio
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchCategory = selectedCategory === "all" || item.original_category === selectedCategory;
      const matchStatus = 
        statusFilter === "all" ? true :
        statusFilter === "active" ? item.active !== false :
        item.active === false;
      
      const matchSearch = searchQuery.trim() === "" || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.original_category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCategory && matchStatus && matchSearch;
    });
  }, [menuItems, selectedCategory, statusFilter, searchQuery]);

  // Pedidos de hoje (aba "Pedidos do Dia") e do período escolhido nos relatórios
  const todayOrders = useMemo(() => filterOrdersByPeriod(orders, "today", now), [orders, now]);
  const todayMetrics = useMemo(() => computeOrderMetrics(todayOrders), [todayOrders]);
  const reportMetrics = useMemo(
    () => computeOrderMetrics(filterOrdersByPeriod(orders, reportPeriod, now)),
    [orders, reportPeriod, now]
  );

  const openOrdersCount = useMemo(
    () => todayOrders.filter(o => ["new", "preparing", "ready"].includes(normalizeOrderStatus(o.status))).length,
    [todayOrders]
  );

  // Filtragem dos Pedidos do Dia
  const filteredOrders = useMemo(() => {
    return todayOrders.filter(order => {
      if (orderFilter === "all") return true;
      if (orderFilter === "open") return ["new", "preparing", "ready"].includes(normalizeOrderStatus(order.status));
      if (orderFilter === "delivery" || orderFilter === "pickup") {
        return normalizeDeliveryMethod(order.deliveryMethod) === orderFilter;
      }
      return normalizePaymentMethod(order.paymentMethod) === orderFilter;
    });
  }, [todayOrders, orderFilter]);

  // Contadores de estatísticas gerais do cardápio
  const stats = useMemo(() => {
    const total = menuItems.length;
    const active = menuItems.filter(i => i.active !== false).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [menuItems]);

  // Contadores de itens por categoria individual
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: menuItems.length };
    CATEGORIES_CONFIG.forEach(cat => {
      if (cat.key !== "all") {
        counts[cat.key] = menuItems.filter(i => i.original_category === cat.key).length;
      }
    });
    return counts;
  }, [menuItems]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#241220] flex flex-col items-center justify-center">
        <RefreshCw className="text-[#F0DF58] animate-spin mb-4" size={48} />
        <span className="font-heading text-xl text-white uppercase tracking-widest">Sincronizando Painel...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] w-full max-w-full flex-col overflow-x-hidden bg-[#241220] pb-24 font-sans text-white lining-nums tabular-nums selection:bg-[#F0DF58] selection:text-[#120714] md:flex-row md:pb-0">
      {/* Aviso rápido */}
      {toast && (
        <div
          role="status"
          className={cn(
            "fixed inset-x-4 bottom-24 z-[140] flex items-center gap-3 rounded-2xl border-2 bg-[#2f1729] px-4 py-3 text-sm font-semibold text-white sm:left-auto sm:right-6 sm:max-w-sm md:bottom-6",
            toast.type === "error" ? "border-[#F58220]" : "border-[#F0DF58]"
          )}
        >
          {toast.type === "error"
            ? <AlertTriangle size={18} className="shrink-0 text-[#F58220]" aria-hidden="true" />
            : <Check size={18} className="shrink-0 text-[#F0DF58]" aria-hidden="true" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ================= VÉU DO MENU NO CELULAR ================= */}
      {mobileDrawerOpen && (
        <div
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-[110] bg-[#120714]/75 md:hidden"
        />
      )}

      {/* ================= BARRA LATERAL (DESKTOP) / GAVETA (CELULAR) ================= */}
      <aside
        aria-label="Menu do painel"
        className={cn(
          "fixed inset-y-0 left-0 z-[120] flex w-72 max-w-[85vw] shrink-0 flex-col gap-6 overflow-y-auto border-r-2 border-[#120714] bg-[#2f1729] p-5 transition-transform duration-300 ease-out motion-reduce:transition-none",
          "md:visible md:sticky md:top-0 md:h-[100dvh] md:w-72 md:translate-x-0",
          mobileDrawerOpen ? "visible translate-x-0" : "invisible -translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/assets/Logo açai.webp" alt="Logo Açaí no Kilo" className="h-12 w-12 shrink-0 object-contain" />
            <div>
              <h1 className="font-heading text-[28px] uppercase leading-[0.9] text-[#F0DF58]">Admin Painel</h1>
              <p className="mt-1 text-xs font-bold text-white/60">Açaí no Kilo</p>
            </div>
          </div>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Fechar menu"
            className={cn(roundGhost, focusRing, "md:hidden")}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Seções do painel" className="flex flex-col gap-1.5">
          {NAV_TABS.map(({ key, label, Icon }) => {
            const on = activeTab === key;
            const badge = key === "menu" ? stats.total : key === "orders" ? openOrdersCount : null;
            return (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setMobileDrawerOpen(false); }}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-full border-2 px-4 text-sm font-bold transition-colors duration-200 ease-out",
                  focusRing,
                  on ? "border-[#120714] bg-[#F0DF58] text-[#120714]" : "border-transparent text-white/75 hover:border-white/20 hover:text-white"
                )}
              >
                <Icon size={18} aria-hidden="true" />
                <span className="flex-1 text-left">{label}</span>
                {badge !== null && (
                  <span className={cn(
                    "min-w-7 rounded-full px-2 text-center font-heading text-base leading-6",
                    on ? "bg-[#120714] text-[#F0DF58]" : "bg-white/10 text-white/80"
                  )}>
                    {badge}
                    {key === "orders" && <span className="sr-only"> em aberto</span>}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col gap-1.5 border-t-2 border-white/10 pt-5">
          <p className="px-4 pb-1 text-xs font-bold text-white/60">Atalhos</p>
          <button
            onClick={() => { setEditingItem(null); setModalOpen(true); setMobileDrawerOpen(false); }}
            className={cn(sideLink, focusRing)}
          >
            <PlusCircle size={18} className="text-[#F0DF58]" aria-hidden="true" />
            Adicionar item
          </button>
          <button
            onClick={() => { handleSyncData(); setMobileDrawerOpen(false); }}
            disabled={syncing}
            className={cn(sideLink, focusRing)}
          >
            <RefreshCw size={18} className={cn(syncing && "animate-spin text-[#F0DF58] motion-reduce:animate-none")} aria-hidden="true" />
            {syncing ? "Sincronizando..." : "Sincronizar dados"}
          </button>
        </div>

        <div className="mt-auto border-t-2 border-white/10 pt-5">
          <button
            onClick={handleLogout}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-white/20 text-sm font-bold text-white/80 transition-colors duration-200 ease-out hover:border-[#F58220] hover:text-[#F58220]",
              focusRing
            )}
          >
            <LogOut size={18} aria-hidden="true" /> Sair do painel
          </button>
        </div>
      </aside>

      {/* ================= CONTEÚDO PRINCIPAL ================= */}
      <main className="mx-auto w-full min-w-0 max-w-[1400px] flex-1 space-y-6 px-4 pb-10 sm:px-6 md:px-8 md:pt-8 lg:px-10">
        {/* ================= CABEÇALHO NO CELULAR ================= */}
        <div className="sticky top-0 z-[90] -mx-4 flex items-center justify-between gap-3 border-b-2 border-[#120714] bg-[#241220] px-4 py-3 sm:-mx-6 sm:px-6 md:hidden">
          <div className="flex items-center gap-2.5">
            <img src="/assets/Logo açai.webp" alt="" className="h-11 w-11 object-contain" />
            <div>
              <p className="font-heading text-2xl uppercase leading-none text-[#F0DF58]">Painel</p>
              <p className="text-xs font-bold text-white/60">Açaí no Kilo</p>
            </div>
          </div>
          <button
            onClick={() => { setEditingItem(null); setModalOpen(true); }}
            aria-label="Adicionar item"
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#120714] bg-[#F0DF58] text-[#120714] transition-colors duration-200 ease-out hover:bg-[#F8EEA6]",
              focusRing
            )}
          >
            <Plus size={22} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* ======================= ABA: GESTÃO DO CARDÁPIO ========================= */}
        {/* ========================================================================= */}
        {activeTab === "menu" && (
          <div className="space-y-5">
            <PageHeader title="Cardápio" hint="Preços, fotos e o que aparece para o cliente.">
              <button
                onClick={() => { setEditingItem(null); setModalOpen(true); }}
                className={cn(primaryBtn, focusRing, "hidden md:inline-flex")}
              >
                <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
                Novo item
              </button>
            </PageHeader>

            {/* Categorias: faixa rolável no celular, quebra de linha a partir do tablet */}
            <div
              role="group"
              aria-label="Categorias"
              className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0"
            >
              {CATEGORIES_CONFIG.map(cat => {
                const on = selectedCategory === cat.key;
                const CategoryIcon = cat.Icon;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    aria-pressed={on}
                    className={cn(pillBase, focusRing, "shrink-0", on ? pillOn : pillIdle)}
                  >
                    <CategoryIcon size={16} aria-hidden="true" />
                    <span aria-hidden="true">{cat.shortLabel}</span>
                    <span className="sr-only">{cat.label}</span>
                    <span className={cn(
                      "rounded-full px-1.5 font-heading text-base leading-5",
                      on ? "bg-[#120714] text-[#F0DF58]" : "bg-white/10 text-white/80"
                    )}>
                      {categoryCounts[cat.key] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Busca e situação */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} aria-hidden="true" />
                <input
                  type="text"
                  aria-label="Buscar item"
                  placeholder="Nome ou categoria"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 w-full rounded-full border-2 border-white/10 bg-[#2f1729] pl-11 pr-12 text-base text-white caret-[#F0DF58] transition-colors placeholder:text-white/40 focus:border-[#F0DF58] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    aria-label="Limpar busca"
                    className={cn("absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white/60 hover:text-white", focusRing)}
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                )}
              </div>
              <div role="group" aria-label="Situação dos itens" className="flex flex-wrap gap-2">
                {([
                  ["all", "Todos", stats.total],
                  ["active", "Ativos", stats.active],
                  ["inactive", "Desativados", stats.inactive],
                ] as const).map(([key, label, count]) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    aria-pressed={statusFilter === key}
                    className={cn(pillBase, focusRing, statusFilter === key ? pillOn : pillIdle)}
                  >
                    {label} <span className="font-heading text-base leading-none">{count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de itens */}
            {filteredItems.length === 0 ? (
              <div className={cn(panelCard, "px-6 py-12 text-center")}>
                <p className="text-[15px] text-white/75">Nenhum item encontrado com os filtros selecionados.</p>
                <button
                  onClick={() => { setSelectedCategory("all"); setStatusFilter("all"); setSearchQuery(""); }}
                  className={cn(pillBase, pillIdle, focusRing, "mt-4")}
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                {filteredItems.map(item => {
                  const itemImg = item.image || resolveItemImage(item);
                  const isProduct = item.original_category === "sizes" || item.original_category === "ready_made";
                  const isActive = item.active !== false;

                  return (
                    <li
                      key={item._id}
                      className="flex flex-wrap items-center gap-3 rounded-[24px] border-2 border-white/10 bg-[#2f1729] p-3 min-[360px]:flex-nowrap"
                    >
                      {/* Foto: adesivo redondo para ingredientes, quadro para potes e prontos */}
                      <div className={cn(
                        "flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden bg-[#3a1d33]",
                        isProduct ? "rounded-2xl" : "rounded-full border-[3px] border-[#F8EEA6]",
                        !isActive && "opacity-50"
                      )}>
                        {itemImg ? (
                          <img
                            src={itemImg}
                            alt=""
                            loading="lazy"
                            className={cn("h-full w-full", isProduct ? "object-contain p-1" : "scale-[1.4] object-cover")}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <ImageIcon className="text-white/30" size={22} aria-hidden="true" />
                        )}
                      </div>

                      <div className={cn("min-w-0 flex-1", !isActive && "opacity-60")}>
                        <p className="truncate text-xs font-bold text-white/60">{item.category || item.original_category}</p>
                        <h3 className="mt-0.5 line-clamp-2 font-sans text-[15px] font-bold leading-snug tracking-normal text-white">
                          {item.name}
                        </h3>
                        <p className="mt-1 font-heading text-xl leading-none text-[#F0DF58]">{formatBRL(item.price)}</p>
                      </div>

                      {/* Situação e ações: linha própria abaixo de 360px, coluna à direita a partir daí */}
                      <div className="flex w-full items-center justify-between gap-2 border-t-2 border-white/10 pt-3 min-[360px]:w-auto min-[360px]:flex-col min-[360px]:items-end min-[360px]:border-t-0 min-[360px]:pt-0">
                        <button
                          onClick={() => updateItemQuick(item._id, { active: !isActive })}
                          title={isActive ? "Clique para desativar" : "Clique para ativar"}
                          className={cn(
                            "relative inline-flex h-9 items-center gap-1.5 rounded-full border-2 px-3 text-xs font-bold transition-colors duration-200 ease-out after:absolute after:-inset-1 after:content-['']",
                            focusRing,
                            isActive ? "border-white/20 text-white/85 hover:border-white/50" : "border-[#F58220]/60 text-[#F58220] hover:border-[#F58220]"
                          )}
                        >
                          <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", isActive ? "bg-[#F0DF58]" : "bg-[#F58220]")} />
                          {isActive ? "Ativo" : "Desativado"}
                        </button>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => { setEditingItem(item); setModalOpen(true); }}
                            aria-label={`Editar ${item.name}`}
                            className={cn(roundGhost, focusRing)}
                          >
                            <Edit3 size={16} aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => setItemToDelete(item)}
                            aria-label={`Excluir ${item.name}`}
                            className={cn(roundGhost, focusRing, "hover:border-[#F58220] hover:text-[#F58220]")}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ======================= ABA: PEDIDOS DO DIA ============================= */}
        {/* ========================================================================= */}
        {activeTab === "orders" && (
          <div className="space-y-5">
            <PageHeader title="Pedidos do dia" hint="Pedidos feitos hoje pelo site. Avance cada um até concluir.">
              <button
                onClick={handleSyncData}
                disabled={syncing}
                aria-label="Sincronizar pedidos"
                className={cn(pillBase, pillIdle, focusRing, "px-3 disabled:opacity-60 sm:px-4")}
              >
                <RefreshCw size={16} className={cn(syncing && "animate-spin text-[#F0DF58] motion-reduce:animate-none")} aria-hidden="true" />
                <span className="hidden sm:inline">{syncing ? "Sincronizando..." : "Sincronizar"}</span>
              </button>
            </PageHeader>

            <div className="grid grid-cols-6 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Faturamento hoje" value={formatBRL(todayMetrics.totalRevenue)} gold className="col-span-6 sm:col-span-1" />
              <StatCard label="Total de pedidos" value={String(todayOrders.length)} className="col-span-2 sm:col-span-1" />
              <StatCard label="Para entrega" value={String(todayMetrics.deliveryCount)} className="col-span-2 sm:col-span-1" />
              <StatCard label="Retirada no balcão" value={String(todayMetrics.pickupCount)} className="col-span-2 sm:col-span-1" />
            </div>

            {/* Filtros: faixa rolável no celular */}
            <div
              role="group"
              aria-label="Filtrar pedidos"
              className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0"
            >
              {([
                { key: "all", label: `Todos (${todayOrders.length})` },
                { key: "open", label: `Em aberto (${openOrdersCount})` },
                { key: "delivery", label: `Entrega (${todayMetrics.deliveryCount})`, Icon: Bike },
                { key: "pickup", label: `Retirada (${todayMetrics.pickupCount})`, Icon: Store },
                { key: "pix", label: "Pix", Icon: QrCode },
                { key: "card", label: "Cartão", Icon: CreditCard },
                { key: "cash", label: "Dinheiro", Icon: Banknote },
              ] satisfies { key: OrderFilter; label: string; Icon?: typeof Bike }[]).map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setOrderFilter(key)}
                  aria-pressed={orderFilter === key}
                  className={cn(pillBase, focusRing, "shrink-0", orderFilter === key ? pillOn : pillIdle)}
                >
                  {Icon && <Icon size={16} aria-hidden="true" />}
                  {label}
                </button>
              ))}
            </div>

            {/* Lista de pedidos */}
            {filteredOrders.length === 0 ? (
              <div className={cn(panelCard, "px-6 py-12 text-center")}>
                <Receipt className="mx-auto mb-3 text-white/30" size={36} aria-hidden="true" />
                <p className="text-[15px] text-white/75">
                  {todayOrders.length === 0 ? "Nenhum pedido hoje ainda." : "Nenhum pedido com o filtro selecionado."}
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {filteredOrders.map(order => {
                  const delivery = normalizeDeliveryMethod(order.deliveryMethod);
                  const payment = normalizePaymentMethod(order.paymentMethod);
                  const status = normalizeOrderStatus(order.status);
                  const next = nextOrderStatus(status);
                  const isOpen = status !== "done" && status !== "cancelled";
                  const isDelivery = delivery === "delivery";
                  const PaymentIcon = payment === "pix" ? QrCode : payment === "card" ? CreditCard : payment === "cash" ? Banknote : Wallet;
                  const dateFormatted = new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });

                  return (
                    <li key={order._id} className={cn(panelCard, "p-4 sm:p-5", !isOpen && "border-white/5")}>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <span className={cn("rounded-full border-2 px-3 py-0.5 text-xs font-bold", ORDER_STATUS_STYLES[status])}>
                          {orderStatusLabel(status, delivery)}
                        </span>
                        <span className="font-heading text-xl leading-none text-white">#{order._id.slice(-6).toUpperCase()}</span>
                        <span className="flex items-center gap-1 text-sm text-white/60">
                          <Clock size={14} aria-hidden="true" /> {dateFormatted}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className={orderChip}>
                          {isDelivery ? <Bike size={14} aria-hidden="true" /> : <Store size={14} aria-hidden="true" />}
                          {delivery ? DELIVERY_LABELS[delivery] : (order.deliveryMethod || "Retirada")}
                        </span>
                        <span className={orderChip}>
                          <PaymentIcon size={14} aria-hidden="true" />
                          <span className="sr-only">Pagamento: </span>
                          {payment ? PAYMENT_LABELS[payment] : (order.paymentMethod || "No balcão")}
                        </span>
                      </div>

                      {/* Itens do pedido, separados por ponto */}
                      <ul className="mt-3 flex flex-wrap gap-x-1.5 gap-y-1 text-[15px] leading-snug text-white/85">
                        {order.items?.map((item, idx) => (
                          <li key={idx} className="after:ml-1.5 after:text-white/30 after:content-['·'] last:after:content-none">
                            {item}
                          </li>
                        ))}
                      </ul>

                      {isDelivery && order.address && (
                        <p className="mt-2 flex items-start gap-1.5 text-sm text-white/60">
                          <MapPin size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                          <span>{order.address.street}, {order.address.number || 'S/N'} - {order.address.neighborhood}</span>
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t-2 border-white/10 pt-4">
                        <p className="flex items-baseline gap-2">
                          <span className="text-[13px] font-bold text-white/60">Total</span>
                          <span className="font-heading text-[28px] leading-none text-[#F0DF58]">{formatBRL(Number(order.total) || 0)}</span>
                        </p>

                        {isOpen && (
                          <div className="flex w-full flex-wrap gap-2 xs:w-auto">
                            {cancelingOrderId === order._id ? (
                              <>
                                <button
                                  onClick={() => updateOrderStatus(order._id, "cancelled")}
                                  className={cn("h-11 flex-1 rounded-full border-2 border-[#120714] bg-[#F58220] px-4 text-sm font-bold text-[#120714] xs:flex-none", focusRing)}
                                >
                                  Confirmar cancelamento
                                </button>
                                <button
                                  onClick={() => setCancelingOrderId(null)}
                                  className={cn("h-11 flex-1 rounded-full border-2 border-white/20 px-4 text-sm font-bold text-white transition-colors hover:border-white/50 xs:flex-none", focusRing)}
                                >
                                  Voltar
                                </button>
                              </>
                            ) : (
                              <>
                                {next && (
                                  <button
                                    onClick={() => updateOrderStatus(order._id, next)}
                                    aria-label={`Marcar como ${orderStatusLabel(next, delivery).toLowerCase()}`}
                                    className={cn(primaryBtn, focusRing, "h-11 flex-1 px-4 text-xl xs:flex-none")}
                                  >
                                    {orderStatusLabel(next, delivery)} <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
                                  </button>
                                )}
                                <button
                                  onClick={() => setCancelingOrderId(order._id)}
                                  aria-label="Cancelar pedido"
                                  className={cn("h-11 rounded-full border-2 border-white/20 px-4 text-sm font-bold text-white/75 transition-colors hover:border-[#F58220] hover:text-[#F58220]", focusRing)}
                                >
                                  Cancelar
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ======================= ABA: RELATÓRIOS & ANALYTICS ==================== */}
        {/* ========================================================================= */}
        {activeTab === "reports" && (
          <div className="space-y-5">
            <PageHeader title="Relatórios & desempenho" hint="Faturamento, itens mais pedidos e formas de pagamento." />

            <div role="group" aria-label="Período" className="grid grid-cols-3 gap-2 sm:inline-flex">
              {([
                ["today", "Hoje"],
                ["week", "7 dias"],
                ["month", "Mês"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setReportPeriod(key)}
                  aria-pressed={reportPeriod === key}
                  className={cn(pillBase, focusRing, reportPeriod === key ? pillOn : pillIdle)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-6 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Faturamento bruto"
                value={formatBRL(reportMetrics.totalRevenue)}
                note={`Baseado em ${plural(reportMetrics.totalOrdersCount, "pedido", "pedidos")}`}
                gold
                className="col-span-6 sm:col-span-1"
              />
              <StatCard
                label="Ticket médio"
                value={formatBRL(reportMetrics.avgTicket)}
                note="Média por pedido"
                className="col-span-3 sm:col-span-1"
              />
              <StatCard
                label="Total de pedidos"
                value={String(reportMetrics.totalOrdersCount)}
                note={reportMetrics.cancelledCount > 0
                  ? `${plural(reportMetrics.cancelledCount, "cancelado", "cancelados")} fora da conta`
                  : "Sem contar cancelados"}
                className="col-span-3 sm:col-span-1"
              />
              <StatCard
                label="Pedidos para entrega"
                value={reportMetrics.totalOrdersCount > 0
                  ? `${Math.round((reportMetrics.deliveryCount / reportMetrics.totalOrdersCount) * 100)}%`
                  : "0%"}
                note={`${plural(reportMetrics.deliveryCount, "entrega", "entregas")} · ${plural(reportMetrics.pickupCount, "retirada", "retiradas")}`}
                className="col-span-6 sm:col-span-1"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {/* Itens mais pedidos */}
              <section aria-labelledby="report-top-items" className={cn(panelCard, "p-5")}>
                <h3 id="report-top-items" className="font-heading text-[28px] uppercase leading-none text-white">Mais pedidos</h3>
                <p className="mt-1 text-[13px] text-white/60">Em quantos pedidos cada item apareceu</p>

                {reportMetrics.topItems.length === 0 ? (
                  <p className="py-8 text-center text-[15px] text-white/60">Nenhum pedido no período.</p>
                ) : (
                  <ol className="mt-4 space-y-3">
                    {reportMetrics.topItems.map((item, idx) => {
                      const maxCount = reportMetrics.topItems[0]?.count || 1;
                      const pct = Math.round((item.count / maxCount) * 100);

                      return (
                        <li key={item.name}>
                          <div className="flex items-baseline justify-between gap-3 text-sm">
                            <span className="flex min-w-0 items-baseline gap-2 font-semibold text-white/90">
                              <span className="w-6 shrink-0 font-heading text-lg leading-none text-[#F0DF58]">{idx + 1}</span>
                              <span className="truncate">{item.name}</span>
                            </span>
                            <span className="shrink-0 text-white/60">{plural(item.count, "pedido", "pedidos")}</span>
                          </div>
                          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-[#F0DF58]" style={{ width: `${pct}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>

              {/* Formas de pagamento */}
              <section aria-labelledby="report-payments" className={cn(panelCard, "p-5")}>
                <h3 id="report-payments" className="font-heading text-[28px] uppercase leading-none text-white">Divisão por forma de pagamento</h3>
                <p className="mt-1 text-[13px] text-white/60">Retiradas pagas no balcão ficam fora desta divisão</p>

                <ul className="mt-4 space-y-2">
                  {([
                    ["pix", "Pix", QrCode],
                    ["card", "Cartão", CreditCard],
                    ["cash", "Dinheiro", Banknote],
                  ] as const).map(([key, label, Icon]) => {
                    const m = reportMetrics[key];
                    const share = reportMetrics.totalRevenue > 0 ? Math.round((m.revenue / reportMetrics.totalRevenue) * 100) : 0;
                    return (
                      <li key={key} className="flex items-center gap-3 rounded-2xl border-2 border-white/10 p-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3a1d33] text-white/85">
                          <Icon size={18} aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-white">{label}</p>
                          <p className="text-[13px] text-white/60">{plural(m.count, "pedido", "pedidos")} · {share}%</p>
                        </div>
                        <span className="whitespace-nowrap font-heading text-2xl leading-none text-white">{formatBRL(m.revenue)}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ======================= ABA: VISÃO GERAL ================================ */}
        {/* ========================================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            <PageHeader title="Visão geral" hint="Como está o dia na loja." />

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
              <OverviewTile
                label="Pedidos em aberto"
                value={String(openOrdersCount)}
                hint={openOrdersCount > 0 ? "Toque para ver e avançar os pedidos" : "Nada esperando agora"}
                highlight={openOrdersCount > 0}
                onClick={() => { setOrderFilter(openOrdersCount > 0 ? "open" : "all"); setActiveTab("orders"); }}
              />
              <OverviewTile
                label="Faturamento hoje"
                value={formatBRL(todayMetrics.totalRevenue)}
                hint={`${plural(todayMetrics.totalOrdersCount, "pedido", "pedidos")} hoje`}
                onClick={() => { setReportPeriod("today"); setActiveTab("reports"); }}
              />
              <OverviewTile
                label="Itens desativados"
                value={String(stats.inactive)}
                hint={stats.inactive > 0 ? `De ${stats.total} itens, ocultos para o cliente` : `Todos os ${stats.total} itens aparecem no cardápio`}
                onClick={() => { setSelectedCategory("all"); setStatusFilter(stats.inactive > 0 ? "inactive" : "all"); setActiveTab("menu"); }}
              />
            </div>
          </div>
        )}
      </main>

      {/* ================= NAVEGAÇÃO INFERIOR (CELULAR) ================= */}
      <nav
        aria-label="Seções do painel"
        className="fixed inset-x-0 bottom-0 z-[100] grid grid-cols-5 border-t-2 border-[#120714] bg-[#2f1729] px-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 md:hidden"
      >
        {NAV_TABS.map(({ key, short, Icon }) => {
          const on = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold transition-colors",
                focusRing,
                on ? "text-white" : "text-white/60 hover:text-white"
              )}
            >
              <span className={cn(
                "relative flex h-8 w-14 items-center justify-center rounded-full border-2 transition-colors",
                on ? "border-[#120714] bg-[#F0DF58] text-[#120714]" : "border-transparent"
              )}>
                <Icon size={18} aria-hidden="true" />
                {key === "orders" && openOrdersCount > 0 && (
                  <span className="absolute -right-1.5 -top-2 min-w-5 rounded-full bg-[#120714] px-1 text-center font-heading text-sm leading-5 text-[#F0DF58]">
                    {openOrdersCount}
                    <span className="sr-only"> em aberto</span>
                  </span>
                )}
              </span>
              <span>{short}</span>
            </button>
          );
        })}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className={cn("flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold text-white/60 transition-colors hover:text-white", focusRing)}
        >
          <span className="flex h-8 w-14 items-center justify-center">
            <MoreHorizontal size={18} aria-hidden="true" />
          </span>
          <span>Mais</span>
        </button>
      </nav>

      {/* ================= MODAL DE CRIAÇÃO / EDIÇÃO ================= */}
      {modalOpen && (
        <ItemModal 
          item={editingItem}
          onClose={() => { setModalOpen(false); setEditingItem(null); }}
          onSave={handleSaveItemModal}
          loading={savingItem}
        />
      )}

      {/* ================= CONFIRMAÇÃO DE EXCLUSÃO ================= */}
      {itemToDelete && (
        <div
          className="fixed inset-0 z-[130] flex items-end justify-center bg-[#120714]/75 p-4 sm:items-center"
          onKeyDown={(e) => { if (e.key === "Escape") setItemToDelete(null); }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-item-title"
            aria-describedby="delete-item-desc"
            className="w-full max-w-md space-y-6 rounded-[32px] border-2 border-white/10 bg-[#2f1729] p-6"
          >
            <div>
              <h2 id="delete-item-title" className="font-heading text-[34px] uppercase leading-[0.95] text-white">
                Excluir item?
              </h2>
              <p id="delete-item-desc" className="mt-2 text-[15px] leading-relaxed text-white/75">
                Tem certeza que deseja excluir <strong className="text-white">"{itemToDelete.name}"</strong>? Ele sai do cardápio dos clientes.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 xs:flex-row">
              <button
                onClick={() => setItemToDelete(null)}
                autoFocus
                className={cn("h-12 w-full rounded-full border-2 border-white/20 xs:flex-1 px-4 text-sm font-bold text-white transition-colors hover:border-white/50", focusRing)}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className={cn("h-12 w-full rounded-full border-2 border-[#120714] bg-[#F58220] xs:flex-1 px-4 text-sm font-bold text-[#120714]", focusRing)}
              >
                Excluir definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= COMPONENTE MODAL DE ITEM ================= */
interface ItemModalProps {
  item: MenuItemRecord | null;
  onClose: () => void;
  onSave: (data: Partial<MenuItemRecord>) => void;
  loading: boolean;
}

function ItemModal({ item, onClose, onSave, loading }: ItemModalProps) {
  const [name, setName] = useState(item?.name || "");
  const [price, setPrice] = useState(item?.price?.toString() || "0");
  const [category, setCategory] = useState(item?.category || "Adicional");
  const [originalCategory, setOriginalCategory] = useState(item?.original_category || "addons");
  const [image, setImage] = useState(item ? (item.image || resolveItemImage(item)) : "");
  const [description, setDescription] = useState(item?.description || "");
  const [type, setType] = useState(item?.type || "");
  const [active, setActive] = useState(item ? item.active !== false : true);

  // Manipular upload local de imagem
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      price: parseFloat(price) || 0,
      category,
      original_category: originalCategory,
      image: image.trim(),
      description: description.trim(),
      type: type.trim(),
      active
    });
  };

  const isProduct = originalCategory === 'sizes' || originalCategory === 'ready_made';

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-[#120714]/75 sm:items-center sm:p-4"
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-modal-title"
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[32px] border-2 border-b-0 border-white/10 bg-[#241220] sm:max-w-xl sm:rounded-[32px] sm:border-b-2"
      >
        <div className="flex items-start justify-between gap-4 border-b-2 border-[#120714] px-5 pb-4 pt-5 sm:px-6">
          <div className="min-w-0">
            <h2 id="item-modal-title" className="font-heading text-[34px] uppercase leading-[0.95] text-[#F0DF58]">
              {item ? "Editar item" : "Adicionar novo item"}
            </h2>
            <p className="mt-1 truncate text-sm text-white/75">{item ? item.name : "Preencha as informações do produto"}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className={cn(roundGhost, focusRing)}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            {/* Imagem */}
            <fieldset className="space-y-3">
              <legend className={fieldLabel}>Imagem do produto</legend>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden bg-[#3a1d33]",
                  isProduct ? "rounded-2xl" : "rounded-full border-[3px] border-[#F8EEA6]"
                )}>
                  {image ? (
                    <img
                      src={image}
                      alt="Prévia da imagem"
                      className={cn("h-full w-full", isProduct ? "object-contain p-1.5" : "scale-[1.4] object-cover")}
                    />
                  ) : (
                    <ImageIcon className="text-white/30" size={28} aria-hidden="true" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <label htmlFor="item-image" className="sr-only">Caminho ou URL da imagem</label>
                  <input
                    id="item-image"
                    type="text"
                    placeholder="/assets/items/fr_morango.webp"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className={fieldInput}
                  />
                  <label className={cn(pillBase, pillIdle, "cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#F0DF58]")}>
                    <Upload size={16} aria-hidden="true" /> Escolher arquivo
                    <input type="file" accept="image/*" onChange={handleImageFile} className="sr-only" />
                  </label>
                </div>
              </div>
              <p className="flex items-start gap-2 text-[13px] leading-relaxed text-white/60">
                <Sparkles size={14} className="mt-0.5 shrink-0 text-[#F0DF58]" aria-hidden="true" />
                <span>
                  <strong className="text-white/80">Dica de performance:</strong> use imagens .webp otimizadas (menos de 30KB) para carregar rápido no celular.
                </span>
              </p>
            </fieldset>

            {/* Nome */}
            <div className="space-y-1.5">
              <label htmlFor="item-name" className={fieldLabel}>Nome do item</label>
              <input
                id="item-name"
                type="text"
                required
                placeholder="Ex: Açaí c/ Morango Especial"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldInput}
              />
            </div>

            {/* Categoria e rótulo */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="item-category" className={fieldLabel}>Categoria</label>
                <div className="relative">
                  <select
                    id="item-category"
                    value={originalCategory}
                    onChange={(e) => {
                      setOriginalCategory(e.target.value);
                      const selectedCat = CATEGORIES_CONFIG.find(c => c.key === e.target.value);
                      if (selectedCat && selectedCat.key !== 'all') {
                        setCategory(selectedCat.label);
                      }
                    }}
                    className={cn(fieldInput, "appearance-none pr-10")}
                  >
                    {ITEM_CATEGORY_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value} className="bg-[#241220]">{label}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/60" aria-hidden="true" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="item-label" className={fieldLabel}>Rótulo de exibição</label>
                <input
                  id="item-label"
                  type="text"
                  placeholder="Ex: Adicional, Cobertura, Fruta"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={fieldInput}
                />
              </div>
            </div>

            {/* Preço e volume */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="item-price" className={fieldLabel}>Preço (R$)</label>
                <div className="relative">
                  <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-heading text-lg text-[#F0DF58]">R$</span>
                  <input
                    id="item-price"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={cn(fieldInput, "pl-11 font-heading text-xl")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="item-type" className={fieldLabel}>Volume / tipo <span className="font-normal text-white/60">(opcional)</span></label>
                <input
                  id="item-type"
                  type="text"
                  placeholder="Ex: 50ml, 100ml, Pote"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={fieldInput}
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <label htmlFor="item-description" className={fieldLabel}>Descrição <span className="font-normal text-white/60">(opcional)</span></label>
              <input
                id="item-description"
                type="text"
                placeholder="Ex: Açaí puro batido sem conservantes"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={fieldInput}
              />
            </div>

            {/* Disponibilidade */}
            <div className="flex items-center justify-between gap-4 rounded-[24px] border-2 border-white/10 bg-[#2f1729] p-4">
              <div>
                <p id="item-active-label" className="text-sm font-bold text-white">Disponível no cardápio</p>
                <p id="item-active-hint" className="mt-0.5 text-[13px] text-white/60">Desligado, o item fica oculto para os clientes.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={active}
                aria-labelledby="item-active-label"
                aria-describedby="item-active-hint"
                onClick={() => setActive(!active)}
                className={cn(
                  "relative h-8 w-14 shrink-0 rounded-full border-2 transition-colors duration-200 after:absolute after:-inset-1.5 after:content-['']",
                  focusRing,
                  active ? "border-[#120714] bg-[#F0DF58]" : "border-white/20 bg-white/10"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-0.5 top-0.5 h-6 w-6 rounded-full transition-transform duration-200 motion-reduce:transition-none",
                    active ? "translate-x-6 bg-[#120714]" : "translate-x-0 bg-white/70"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Ações fixas na base da folha */}
          <div className="flex gap-2 border-t-2 border-[#120714] bg-[#2f1729] px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className={cn("h-14 flex-1 rounded-full border-2 border-white/20 text-sm font-bold text-white transition-colors hover:border-white/50", focusRing)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn(primaryBtn, focusRing, "h-14 flex-[1.4] text-2xl disabled:opacity-60")}
            >
              {loading
                ? <RefreshCw className="animate-spin motion-reduce:animate-none" size={20} aria-hidden="true" />
                : <Check size={20} strokeWidth={2.5} aria-hidden="true" />}
              Salvar item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
