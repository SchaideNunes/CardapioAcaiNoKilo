import React, { useState, useEffect, useEffectEvent, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Home,
  Box, 
  LayoutDashboard,
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
  DollarSign,
  TrendingUp,
  CreditCard,
  Wallet,
  QrCode,
  MapPin,
  Clock,
  Award,
  ArrowUpRight,
  ArrowRight,
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
  preparing: "bg-[#F58220]/15 text-[#F58220] border-[#F58220]/40",
  ready: "bg-cyan-400/15 text-cyan-300 border-cyan-400/40",
  done: "bg-emerald-400/15 text-emerald-300 border-emerald-400/40",
  cancelled: "bg-white/[0.06] text-white/50 border-white/15 line-through",
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
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Cabeçalho de Pedidos */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-sans text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  <LayoutDashboard className="text-[#F0DF58]" size={26} />
                  Pedidos do Dia
                </h2>
                <p className="text-white/50 text-xs sm:text-sm font-sans mt-0.5">
                  Histórico e pedidos em tempo real gravados no sistema
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncData}
                  disabled={syncing}
                  className={cn(
                    "px-3.5 py-2 min-h-11 lg:min-h-0 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 border",
                    syncing 
                      ? "bg-[#F0DF58]/20 text-[#F0DF58] border-[#F0DF58]/40" 
                      : "bg-white/10 hover:bg-white/20 text-white border-white/10 active:scale-95"
                  )}
                >
                  <RefreshCw size={14} className={syncing ? "animate-spin text-[#F0DF58]" : ""} />
                  <span>{syncing ? "Sincronizando..." : "Sincronizar"}</span>
                </button>
              </div>
            </div>

            {/* Métricas dos Pedidos */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-[#2f1729] border-2 border-white/10 p-4 rounded-2xl">
                <p className="text-[10px] uppercase font-bold text-white/50">Total de Pedidos</p>
                <p className="font-heading text-3xl font-bold text-white mt-1">{todayOrders.length}</p>
              </div>
              <div className="bg-[#2f1729] border-2 border-white/10 p-4 rounded-2xl">
                <p className="text-[10px] uppercase font-bold text-emerald-400">Faturamento Hoje</p>
                <p className="font-heading text-3xl font-bold text-emerald-400 mt-1">
                  R$ {todayMetrics.totalRevenue.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div className="bg-[#2f1729] border-2 border-white/10 p-4 rounded-2xl">
                <p className="text-[10px] uppercase font-bold text-cyan-300">Para Entrega</p>
                <p className="font-heading text-3xl font-bold text-cyan-300 mt-1">{todayMetrics.deliveryCount}</p>
              </div>
              <div className="bg-[#2f1729] border-2 border-white/10 p-4 rounded-2xl">
                <p className="text-[10px] uppercase font-bold text-amber-300">Retirada no Balcão</p>
                <p className="font-heading text-3xl font-bold text-amber-300 mt-1">{todayMetrics.pickupCount}</p>
              </div>
            </div>

            {/* Filtros de Pedidos */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {([
                { key: "all", label: `Todos (${todayOrders.length})` },
                { key: "open", label: `Em aberto (${todayOrders.filter(o => ["new", "preparing", "ready"].includes(normalizeOrderStatus(o.status))).length})` },
                { key: "delivery", label: `🛵 Entrega (${todayMetrics.deliveryCount})` },
                { key: "pickup", label: `🛍️ Retirada (${todayMetrics.pickupCount})` },
                { key: "pix", label: "Pix" },
                { key: "card", label: "Cartão" },
                { key: "cash", label: "Dinheiro" },
              ] satisfies { key: OrderFilter; label: string }[]).map(f => (
                <button
                  key={f.key}
                  onClick={() => setOrderFilter(f.key)}
                  className={cn(
                    "px-3.5 py-1.5 min-h-11 lg:min-h-0 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                    orderFilter === f.key 
                      ? "bg-[#F0DF58] text-[#120714]"
                      : "bg-[#2f1729] text-white/70 hover:text-white border-2 border-white/10"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Lista de Pedidos */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 bg-[#170a18]/40 border border-white/[0.06] rounded-3xl p-8">
                <Receipt className="mx-auto text-white/20 mb-3" size={40} />
                <p className="text-white/60 text-sm font-sans">Nenhum pedido encontrado para o filtro selecionado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map(order => {
                  const delivery = normalizeDeliveryMethod(order.deliveryMethod);
                  const payment = normalizePaymentMethod(order.paymentMethod);
                  const status = normalizeOrderStatus(order.status);
                  const next = nextOrderStatus(status);
                  const isOpen = status !== "done" && status !== "cancelled";
                  const isDelivery = delivery === "delivery";
                  const dateFormatted = new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div 
                      key={order._id}
                      className="bg-[#2f1729] border-2 border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/20 transition-all"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-heading text-sm text-[#F0DF58] bg-[#F0DF58]/10 px-2 py-0.5 rounded-md border border-[#F0DF58]/20">
                            #{order._id.slice(-6).toUpperCase()}
                          </span>
                          <span className="text-xs text-white/50 flex items-center gap-1">
                            <Clock size={12} /> {dateFormatted}
                          </span>
                          <span className={cn("text-[11px] font-bold px-2.5 py-0.5 rounded-full border-2 uppercase", ORDER_STATUS_STYLES[status])}>
                            {orderStatusLabel(status, delivery)}
                          </span>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                            isDelivery ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30" : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          )}>
                            {delivery ? DELIVERY_LABELS[delivery] : (order.deliveryMethod || "Retirada")}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            💳 {payment ? PAYMENT_LABELS[payment] : (order.paymentMethod || "No balcão")}
                          </span>
                        </div>

                        {/* Itens do Pedido */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {order.items?.map((item, idx) => (
                            <span 
                              key={idx}
                              className="text-xs font-medium text-white/80 bg-white/[0.04] border border-white/5 px-2.5 py-1 rounded-lg"
                            >
                              {item}
                            </span>
                          ))}
                        </div>

                        {/* Endereço se entrega */}
                        {isDelivery && order.address && (
                          <div className="text-xs text-white/50 flex items-center gap-1.5 pt-1">
                            <MapPin size={12} className="text-rose-400" />
                            <span>{order.address.street}, {order.address.number || 'S/N'} - {order.address.neighborhood}</span>
                          </div>
                        )}
                      </div>

                      {/* Total do Pedido */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                        <span className="text-[10px] font-bold uppercase text-white/40">Total</span>
                        <span className="font-heading text-2xl font-bold text-[#F0DF58]">
                          R$ {(Number(order.total) || 0).toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      {/* Ações de status */}
                      {isOpen && (
                        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
                          {cancelingOrderId === order._id ? (
                            <>
                              <button
                                onClick={() => updateOrderStatus(order._id, "cancelled")}
                                className="h-11 rounded-full border-2 border-[#120714] bg-[#F58220] px-4 text-sm font-bold text-[#120714]"
                              >
                                Confirmar cancelamento
                              </button>
                              <button
                                onClick={() => setCancelingOrderId(null)}
                                className="h-11 rounded-full border-2 border-white/20 px-4 text-sm font-bold text-white hover:border-white/40"
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
                                  className="flex h-11 items-center justify-center gap-1.5 rounded-full border-2 border-[#120714] bg-[#F0DF58] px-4 font-heading text-lg uppercase text-[#120714] hover:bg-[#F8EEA6] transition-colors"
                                >
                                  {orderStatusLabel(next, delivery)} <ArrowRight size={16} strokeWidth={2.5} />
                                </button>
                              )}
                              <button
                                onClick={() => setCancelingOrderId(order._id)}
                                aria-label="Cancelar pedido"
                                className="h-11 rounded-full border-2 border-white/15 px-4 text-sm font-bold text-white/70 hover:border-[#F58220] hover:text-[#F58220] transition-colors"
                              >
                                Cancelar
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ======================= ABA: RELATÓRIOS & ANALYTICS ==================== */}
        {/* ========================================================================= */}
        {activeTab === "reports" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Cabeçalho */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-sans text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  <BarChart3 className="text-[#F0DF58]" size={26} />
                  Relatórios & Desempenho
                </h2>
                <p className="text-white/50 text-xs sm:text-sm font-sans mt-0.5">
                  Métricas financeiras, itens mais pedidos e comportamento de vendas
                </p>
              </div>

              {/* Período */}
              <div className="flex items-center gap-1 bg-[#2f1729] p-1 rounded-2xl border-2 border-white/10">
                <button
                  onClick={() => setReportPeriod("today")}
                  className={cn(
                    "px-4 py-1.5 min-h-11 lg:min-h-0 rounded-xl text-xs font-bold transition-all",
                    reportPeriod === "today" ? "bg-[#F0DF58] text-[#120714]" : "text-white/60 hover:text-white"
                  )}
                >
                  Hoje
                </button>
                <button
                  onClick={() => setReportPeriod("week")}
                  className={cn(
                    "px-4 py-1.5 min-h-11 lg:min-h-0 rounded-xl text-xs font-bold transition-all",
                    reportPeriod === "week" ? "bg-[#F0DF58] text-[#120714]" : "text-white/60 hover:text-white"
                  )}
                >
                  7 Dias
                </button>
                <button
                  onClick={() => setReportPeriod("month")}
                  className={cn(
                    "px-4 py-1.5 min-h-11 lg:min-h-0 rounded-xl text-xs font-bold transition-all",
                    reportPeriod === "month" ? "bg-[#F0DF58] text-[#120714]" : "text-white/60 hover:text-white"
                  )}
                >
                  Mês
                </button>
              </div>
            </div>

            {/* 4 Cards de Métricas Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Faturamento */}
              <div className="bg-[#2f1729] border-2 border-white/10 p-5 rounded-3xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-white/50">Faturamento Bruto</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <DollarSign size={18} />
                  </div>
                </div>
                <p className="font-heading text-4xl font-bold text-emerald-400 mt-2">
                  R$ {reportMetrics.totalRevenue.toFixed(2).replace('.', ',')}
                </p>
                <span className="text-[11px] text-white/40 mt-1 block">Baseado em {reportMetrics.totalOrdersCount} pedidos</span>
              </div>

              {/* Ticket Médio */}
              <div className="bg-[#2f1729] border-2 border-white/10 p-5 rounded-3xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-white/50">Ticket Médio</span>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-300">
                    <TrendingUp size={18} />
                  </div>
                </div>
                <p className="font-heading text-4xl font-bold text-white mt-2">
                  R$ {reportMetrics.avgTicket.toFixed(2).replace('.', ',')}
                </p>
                <span className="text-[11px] text-white/40 mt-1 block">Média por cliente</span>
              </div>

              {/* Volume de Pedidos */}
              <div className="bg-[#2f1729] border-2 border-white/10 p-5 rounded-3xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-white/50">Total de Pedidos</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-300">
                    <ShoppingBag size={18} />
                  </div>
                </div>
                <p className="font-heading text-4xl font-bold text-[#F0DF58] mt-2">
                  {reportMetrics.totalOrdersCount}
                </p>
                <span className="text-[11px] text-white/40 mt-1 block">Pedidos concluídos</span>
              </div>

              {/* Taxa de Entrega */}
              <div className="bg-[#2f1729] border-2 border-white/10 p-5 rounded-3xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-white/50">Taxa Delivery</span>
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-300">
                    <ArrowUpRight size={18} />
                  </div>
                </div>
                <p className="font-heading text-4xl font-bold text-cyan-300 mt-2">
                  {reportMetrics.totalOrdersCount > 0 
                    ? `${Math.round((reportMetrics.deliveryCount / reportMetrics.totalOrdersCount) * 100)}%` 
                    : "0%"}
                </p>
                <span className="text-[11px] text-white/40 mt-1 block">{reportMetrics.deliveryCount} entregas vs {reportMetrics.pickupCount} retiradas</span>
              </div>
            </div>

            {/* Painéis Gráficos e Distribuição */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Ranking de Itens Mais Vendidos */}
              <div className="bg-[#2f1729] border-2 border-white/10 p-5 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase text-white/90 flex items-center gap-2">
                    <Award size={18} className="text-[#F0DF58]" />
                    Top Complementos e Itens Mais Pedidos
                  </h3>
                  <span className="text-xs text-white/40">Frequência</span>
                </div>

                {reportMetrics.topItems.length === 0 ? (
                  <p className="text-white/40 text-xs text-center py-6">Nenhum dado de pedido registrado ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {reportMetrics.topItems.map((item, idx) => {
                      const maxCount = reportMetrics.topItems[0]?.count || 1;
                      const pct = Math.round((item.count / maxCount) * 100);

                      return (
                        <div key={item.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white/90 flex items-center gap-2">
                              <span className="w-5 text-[#F0DF58] font-bold">#{idx + 1}</span>
                              {item.name}
                            </span>
                            <span className="text-white/50">{item.count} pedidos</span>
                          </div>
                          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#F0DF58] rounded-full transition-all duration-500" 
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Formas de Pagamento e Entregas */}
              <div className="bg-[#2f1729] border-2 border-white/10 p-5 rounded-3xl space-y-5">
                <div>
                  <h3 className="text-sm font-bold uppercase text-white/90 mb-3 flex items-center gap-2">
                    <CreditCard size={18} className="text-emerald-400" />
                    Divisão por Forma de Pagamento
                  </h3>

                  <div className="space-y-2.5">
                    {/* Pix */}
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                          <QrCode size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Pix</p>
                          <p className="text-[10px] text-white/40">{reportMetrics.pix.count} pedidos</p>
                        </div>
                      </div>
                      <span className="font-heading text-lg text-emerald-400 font-bold">
                        R$ {reportMetrics.pix.revenue.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    {/* Cartão */}
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-300 flex items-center justify-center">
                          <CreditCard size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Cartão</p>
                          <p className="text-[10px] text-white/40">{reportMetrics.card.count} pedidos</p>
                        </div>
                      </div>
                      <span className="font-heading text-lg text-white font-bold">
                        R$ {reportMetrics.card.revenue.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    {/* Dinheiro */}
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                          <Wallet size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Dinheiro</p>
                          <p className="text-[10px] text-white/40">{reportMetrics.cash.count} pedidos</p>
                        </div>
                      </div>
                      <span className="font-heading text-lg text-amber-400 font-bold">
                        R$ {reportMetrics.cash.revenue.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ======================= ABA: VISÃO GERAL ================================ */}
        {/* ========================================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="font-sans text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
                <Home className="text-[#F0DF58]" size={26} />
                Visão Geral do Negócio
              </h2>
              <p className="text-white/50 text-xs sm:text-sm font-sans mt-0.5">
                Resumo rápido de operações e atalhos de gestão
              </p>
            </div>

            {/* Ações Rápidas em Cards Grandes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab("menu")}
                className="bg-[#2f1729] border-2 border-white/10 hover:border-[#F0DF58]/40 p-6 rounded-3xl text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#F0DF58]/10 text-[#F0DF58] flex items-center justify-center mb-4 transition-transform">
                  <Box size={24} />
                </div>
                <h3 className="font-heading text-xl uppercase text-white">Gestão do Cardápio</h3>
                <p className="text-white/50 text-xs mt-1">Gerencie preços, estoque e fotos dos {stats.total} itens cadastrados.</p>
              </button>

              <button
                onClick={() => setActiveTab("orders")}
                className="bg-[#2f1729] border-2 border-white/10 hover:border-emerald-500/40 p-6 rounded-3xl text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 transition-transform">
                  <LayoutDashboard size={24} />
                </div>
                <h3 className="font-heading text-xl uppercase text-white">Pedidos do Dia</h3>
                <p className="text-white/50 text-xs mt-1">Monitore {todayOrders.length} pedidos em tempo real com total e endereços.</p>
              </button>

              <button
                onClick={() => setActiveTab("reports")}
                className="bg-[#2f1729] border-2 border-white/10 hover:border-cyan-500/40 p-6 rounded-3xl text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-300 flex items-center justify-center mb-4 transition-transform">
                  <BarChart3 size={24} />
                </div>
                <h3 className="font-heading text-xl uppercase text-white">Relatórios & Vendas</h3>
                <p className="text-white/50 text-xs mt-1">Consulte faturamento, ticket médio e ingredientes mais vendidos.</p>
              </button>
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

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#2f1729] border-2 border-white/15 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="font-heading text-2xl uppercase text-[#F0DF58]">
              {item ? "Editar Item do Cardápio" : "Adicionar Novo Item"}
            </h3>
            <p className="text-white/70 text-xs font-sans">Preencha as informações do produto</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/60 hover:text-white rounded-xl">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Seção de Imagem com Dica de WebP */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase text-white/90 block">
              Imagem do Produto
            </label>

            {/* Dica WebP em destaque */}
            <div className="flex items-start gap-2.5 bg-[#F0DF58]/10 border border-[#F0DF58]/25 p-3 rounded-2xl text-[#F0DF58] text-xs font-sans leading-relaxed">
              <Sparkles size={16} className="flex-shrink-0 mt-0.5" />
              <span>
                <strong>Dica de Performance:</strong> Utilize imagens no formato <strong>.webp</strong> otimizado (&lt;30KB) para garantir carregamento instantâneo no celular.
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="w-20 h-20 rounded-2xl bg-black/50 border-2 border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                {image ? (
                  <img 
                    src={image} 
                    alt="Preview" 
                    className={cn(
                      "w-full h-full",
                      (originalCategory === 'sizes' || originalCategory === 'ready_made')
                        ? "object-contain p-1.5"
                        : "object-cover scale-105"
                    )} 
                  />
                ) : (
                  <ImageIcon className="text-white/30" size={28} />
                )}
              </div>

              {/* Upload & Path */}
              <div className="flex-1 space-y-2">
                <input 
                  type="text"
                  placeholder="URL ou Caminho (ex: /assets/items/fr_morango.webp)"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full bg-white/[0.06] border-2 border-white/15 rounded-xl py-2 px-3 text-white text-xs font-sans focus:outline-none focus:border-[#F0DF58]/60 transition-all placeholder:text-white/40"
                />
                
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 text-xs font-bold uppercase cursor-pointer transition-all border-2 border-white/15">
                  <Upload size={14} /> Selecionar Arquivo
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageFile} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Nome do Item */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-white/90 block">
              Nome do Item *
            </label>
            <input 
              type="text"
              required
              placeholder="Ex: Açaí c/ Morango Especial"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/[0.06] border-2 border-white/15 rounded-xl py-3 px-4 text-white text-sm font-sans focus:outline-none focus:border-[#F0DF58]/60 transition-all placeholder:text-white/40"
            />
          </div>

          {/* Categoria e Subcategoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-white/90 block">
                Categoria do Sistema *
              </label>
              <select 
                value={originalCategory}
                onChange={(e) => {
                  setOriginalCategory(e.target.value);
                  const selectedCat = CATEGORIES_CONFIG.find(c => c.key === e.target.value);
                  if (selectedCat && selectedCat.key !== 'all') {
                    setCategory(selectedCat.label);
                  }
                }}
                className="w-full bg-[#120714] border-2 border-white/15 rounded-xl py-3 px-3 text-white text-sm font-sans focus:outline-none focus:border-[#F0DF58]/60 transition-all"
              >
                <option value="sizes">🥣 Tamanho de Pote (sizes)</option>
                <option value="flavors">🍇 Sabor de Açaí (flavors)</option>
                <option value="toppings">🍯 Cobertura (toppings)</option>
                <option value="addons">🥜 Adicional (addons)</option>
                <option value="creams">🍧 Creme (creams)</option>
                <option value="fruits">🍓 Fruta Fresca (fruits)</option>
                <option value="fillings">🍫 Recheio (fillings)</option>
                <option value="ready_made">📦 Pronto para Levar (ready_made)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-white/90 block">
                Rótulo de Exibição
              </label>
              <input 
                type="text"
                placeholder="Ex: Adicional, Cobertura, Fruta"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white/[0.06] border-2 border-white/15 rounded-xl py-3 px-4 text-white text-sm font-sans focus:outline-none focus:border-[#F0DF58]/60 transition-all placeholder:text-white/40"
              />
            </div>
          </div>

          {/* Preço e Volume */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-white/90 block">
                Preço (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F0DF58] font-bold text-sm">R$</span>
                <input 
                  type="number"
                  step="0.25"
                  required
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-white/[0.06] border-2 border-white/15 rounded-xl py-3 pl-10 pr-4 text-white text-sm font-sans focus:outline-none focus:border-[#F0DF58]/60 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-white/90 block">
                Volume / Tipo (Opcional)
              </label>
              <input 
                type="text"
                placeholder="Ex: 50ml, 100ml, Pote"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-white/[0.06] border-2 border-white/15 rounded-xl py-3 px-4 text-white text-sm font-sans focus:outline-none focus:border-[#F0DF58]/60 transition-all placeholder:text-white/40"
              />
            </div>
          </div>

          {/* Descrição Opcional */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-white/90 block">
              Descrição (Opcional)
            </label>
            <input 
              type="text"
              placeholder="Ex: Açaí puro batido sem conservantes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/[0.06] border-2 border-white/15 rounded-xl py-3 px-4 text-white text-sm font-sans focus:outline-none focus:border-[#F0DF58]/60 transition-all placeholder:text-white/40"
            />
          </div>

          {/* Status Ativo / Em Estoque */}
          <div className="flex items-center justify-between p-4 bg-white/[0.04] border-2 border-white/10 rounded-2xl">
            <div>
              <p className="font-heading text-lg uppercase text-white">Disponível no Cardápio</p>
              <p className="text-white/70 text-xs font-sans">Se desativado, o item ficará oculto para os clientes</p>
            </div>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={cn(
                "w-14 h-8 rounded-full transition-colors relative p-1",
                active ? "bg-[#25D366]" : "bg-white/20"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full bg-white transition-transform",
                active ? "translate-x-6" : "translate-x-0"
              )} />
            </button>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 bg-white/10 hover:bg-white/20 text-white font-heading text-base rounded-xl transition-all uppercase border-2 border-white/10"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 bg-[#F0DF58] hover:bg-[#e4d347] text-[#120714] font-heading text-lg rounded-xl transition-all active:scale-95 uppercase font-black flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="animate-spin" size={20} /> : <Check size={20} />}
              Salvar Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
