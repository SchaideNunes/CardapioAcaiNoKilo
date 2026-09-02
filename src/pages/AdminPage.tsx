import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Home,
  Box, 
  LayoutDashboard,
  PlusCircle,
  Layers,
  BarChart3,
  Settings,
  CheckCircle2,
  XCircle,
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
  List,
  Droplets,
  Milk,
  Apple,
  Cookie,
  ShoppingBag,
  LogOut,
  RefreshCw
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { menuData as localFallbackData } from "@/data/menu";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ItemAdmin {
  _id: string;
  id: string;
  name: string;
  price: number;
  category: string;
  original_category: string;
  image?: string;
  description?: string;
  type?: string;
  active: boolean;
}

export interface OrderAdmin {
  _id: string;
  total: number;
  paymentMethod: string;
  deliveryMethod: string;
  items: string[];
  createdAt: string;
  address?: {
    street: string;
    neighborhood: string;
    number?: string;
  };
}

export const CATEGORIES_CONFIG = [
  { key: "all", label: "Todos os Itens", shortLabel: "Todos", Icon: LayoutGrid, iconColor: "text-[#F0DF58]" },
  { key: "sizes", label: "Tamanhos de Potes", shortLabel: "Tamanhos", Icon: Layers, iconColor: "text-purple-300" },
  { key: "flavors", label: "Sabores de Açaí", shortLabel: "Sabores", Icon: Sparkles, iconColor: "text-violet-300" },
  { key: "toppings", label: "Coberturas", shortLabel: "Coberturas", Icon: Droplets, iconColor: "text-amber-300" },
  { key: "addons", label: "Adicionais", shortLabel: "Adicionais", Icon: PlusCircle, iconColor: "text-emerald-300" },
  { key: "creams", label: "Cremes", shortLabel: "Cremes", Icon: Milk, iconColor: "text-pink-300" },
  { key: "fruits", label: "Frutas Frescas", shortLabel: "Frutas", Icon: Apple, iconColor: "text-rose-300" },
  { key: "fillings", label: "Recheios Especiais", shortLabel: "Recheios", Icon: Cookie, iconColor: "text-amber-400" },
  { key: "ready_made", label: "Prontos para Levar", shortLabel: "Prontos", Icon: ShoppingBag, iconColor: "text-cyan-300" },
];

export function resolveItemImage(item: Partial<ItemAdmin>): string {
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

const LOCAL_STORAGE_KEY = "cardapio_admin_menu_items_v3";

const demoOrders: OrderAdmin[] = [
  {
    _id: "demo_1",
    total: 35.50,
    paymentMethod: "Pix",
    deliveryMethod: "Entrega",
    items: ["Pote de 500ml", "Morango", "Leite em pó", "Calda de Chocolate"],
    createdAt: new Date().toISOString(),
    address: { street: "Av. Principal", neighborhood: "Centro", number: "120" }
  },
  {
    _id: "demo_2",
    total: 22.00,
    paymentMethod: "Dinheiro",
    deliveryMethod: "Retirada",
    items: ["Pote de 360ml", "Granola tradicional", "Mel"],
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    _id: "demo_3",
    total: 38.00,
    paymentMethod: "Cartão",
    deliveryMethod: "Entrega",
    items: ["Açaí Zero Açúcar 1L (Pronto)"],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    address: { street: "Rua das Flores", neighborhood: "Jardim América", number: "45" }
  }
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "menu" | "orders">("menu");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const [menuItems, setMenuItems] = useState<ItemAdmin[]>([]);
  const [orders, setOrders] = useState<OrderAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemAdmin | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ItemAdmin | null>(null);
  const [savingItem, setSavingItem] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [token]);

  // Bloquear scroll de fundo quando modal estiver aberto
  useEffect(() => {
    if (modalOpen || itemToDelete) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen, itemToDelete]);

  const getInitialFallbackItems = (): ItemAdmin[] => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem("cardapio_admin_menu_items_v2");
    if (saved) {
      try {
        const parsed: ItemAdmin[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(item => ({
            ...item,
            image: item.image || resolveItemImage(item)
          }));
        }
      } catch (e) {
        console.error("Erro ao ler dados locais:", e);
      }
    }

    const formatted: ItemAdmin[] = [];
    Object.entries(localFallbackData).forEach(([cat, items]) => {
      items.forEach((i: any) => {
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
    const readyMadeDefaults = [
      { id: "500ml_acai_natural", name: "Açaí Natural 500ml", price: 18.00, image: "/assets/500ml_acai_natural.webp", category: "Pronto", original_category: "ready_made" },
      { id: "500ml_acai_banana", name: "Açaí c/ Banana 500ml", price: 20.00, image: "/assets/500ml_acai_banana.webp", category: "Pronto", original_category: "ready_made" },
      { id: "500ml_acai_morango", name: "Açaí c/ Morango 500ml", price: 22.00, image: "/assets/500ml_acai_morango.webp", category: "Pronto", original_category: "ready_made" },
      { id: "500ml_acai_cupuacu", name: "Açaí c/ Cupuaçu 500ml", price: 22.00, image: "/assets/500ml_acai_cupuacu.webp", category: "Pronto", original_category: "ready_made" },
      { id: "1l_acai_zero", name: "Açaí Zero Açúcar 1L", price: 38.00, image: "/assets/1l_acai_zero.webp", category: "Pronto", original_category: "ready_made" },
      { id: "1l_acai_banana", name: "Açaí c/ Banana 1L", price: 35.00, image: "/assets/1l_acai_banana.webp", category: "Pronto", original_category: "ready_made" },
      { id: "1l_acai_morango", name: "Açaí c/ Morango 1L", price: 38.00, image: "/assets/1l_acai_morango.webp", category: "Pronto", original_category: "ready_made" },
      { id: "1l_creme_abacaxi_vinho", name: "Creme Abacaxi c/ Vinho 1L", price: 40.00, image: "/assets/1l_creme_abacaxi_vinho.webp", category: "Pronto", original_category: "ready_made" },
      { id: "1l_creme_doce_de_leite", name: "Creme Doce de Leite 1L", price: 40.00, image: "/assets/1l_creme_doce_de_leite.webp", category: "Pronto", original_category: "ready_made" },
      { id: "1l_creme_grego_amarena", name: "Creme Grego c/ Amarena 1L", price: 45.00, image: "/assets/1l_creme_grego_amarena.webp", category: "Pronto", original_category: "ready_made" },
      { id: "1l_creme_moranto_zero", name: "Creme Morango Zero 1L", price: 42.00, image: "/assets/1l_creme_moranto_zero.webp", category: "Pronto", original_category: "ready_made" },
      { id: "2l_acai_natural", name: "Açaí Natural 2L", price: 55.00, image: "/assets/2l_acai_natural.webp", category: "Pronto", original_category: "ready_made" },
      { id: "2l_acai_banana", name: "Açaí c/ Banana 2L", price: 60.00, image: "/assets/2l_acai_banana.webp", category: "Pronto", original_category: "ready_made" },
    ];

    readyMadeDefaults.forEach(r => {
      formatted.push({
        _id: r.id,
        id: r.id,
        name: r.name,
        price: r.price,
        category: r.category,
        original_category: r.original_category,
        image: r.image,
        active: true
      });
    });

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formatted));
    return formatted;
  };

  const fetchData = async () => {
    if (token === "demo-token-123") {
      setMenuItems(getInitialFallbackItems());
      setOrders(demoOrders);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [menuRes, ordersRes] = await Promise.all([
        fetch("http://localhost:3001/api/admin/menu", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:3001/api/admin/orders", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (menuRes.status === 401 || ordersRes.status === 401) {
        handleLogout();
        return;
      }

      const backendItems = await menuRes.json();
      if (Array.isArray(backendItems) && backendItems.length > 0) {
        setMenuItems(backendItems.map((item: ItemAdmin) => ({
          ...item,
          image: item.image || resolveItemImage(item)
        })));
      } else {
        setMenuItems(getInitialFallbackItems());
      }
      setOrders(await ordersRes.json());
    } catch (err) {
      console.log("Modo Demo Admin: Carregando banco de dados local sincronizado.");
      setMenuItems(getInitialFallbackItems());
      setOrders(demoOrders);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/login");
  };

  // Salvar no estado e sincronizar local/backend
  const saveItemsState = (newItems: ItemAdmin[]) => {
    setMenuItems(newItems);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newItems));
  };

  // Quick Inline Update (Preço / Estoque)
  const updateItemQuick = async (id: string, updates: Partial<ItemAdmin>) => {
    const updatedList = menuItems.map(item => item._id === id ? { ...item, ...updates } : item);
    saveItemsState(updatedList);

    if (token && token !== "demo-token-123") {
      try {
        await fetch(`http://localhost:3001/api/admin/menu/${id}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(updates)
        });
      } catch (err) {
        console.warn("Backend offline, alteração salva localmente no Modo Demo.");
      }
    }
    showToast("Item atualizado com sucesso!");
  };

  // Salvar Item do Modal (Criar ou Atualizar Completo)
  const handleSaveItemModal = async (formData: Partial<ItemAdmin>) => {
    setSavingItem(true);
    try {
      if (editingItem) {
        // Modo Edição
        const updatedItem: ItemAdmin = {
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

        if (token && token !== "demo-token-123") {
          try {
            await fetch(`http://localhost:3001/api/admin/menu/${editingItem._id}`, {
              method: "PUT",
              headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify(formData)
            });
          } catch (e) {
            console.warn("Backend offline, alteração salva no storage local.");
          }
        }
        showToast(`Item "${updatedItem.name}" atualizado!`);
      } else {
        // Modo Criação
        const newId = "item_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
        const newItem: ItemAdmin = {
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

        if (token && token !== "demo-token-123") {
          try {
            const res = await fetch(`http://localhost:3001/api/admin/menu`, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify(newItem)
            });
            if (res.ok) {
              const resData = await res.json();
              if (resData?.item?._id) {
                newItem._id = resData.item._id;
              }
            }
          } catch (e) {
            console.warn("Backend offline, item criado no storage local.");
          }
        }
        showToast(`Novo item "${newItem.name}" adicionado com sucesso!`);
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

  // Excluir Item
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    const targetId = itemToDelete._id;
    const targetName = itemToDelete.name;

    const updatedList = menuItems.filter(i => i._id !== targetId);
    saveItemsState(updatedList);

    if (token && token !== "demo-token-123") {
      try {
        await fetch(`http://localhost:3001/api/admin/menu/${targetId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.warn("Backend offline, item excluído localmente.");
      }
    }

    showToast(`Item "${targetName}" removido do cardápio!`);
    setItemToDelete(null);
  };

  // Filtragem dos Itens
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

  // Contadores de estatísticas gerais
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
      <div className="min-h-screen bg-[#0d0510] flex flex-col items-center justify-center">
        <RefreshCw className="text-[#F0DF58] animate-spin mb-4" size={48} />
        <span className="font-heading text-xl text-white uppercase tracking-widest">Sincronizando Painel...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0711] text-white flex flex-col md:flex-row relative selection:bg-[#F0DF58] selection:text-[#0e0711] font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-[100] px-5 py-3.5 rounded-2xl shadow-2xl font-sans text-sm flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 border",
          toast.type === "success" && "bg-[#25D366]/20 border-[#25D366]/40 text-[#25D366] backdrop-blur-xl",
          toast.type === "error" && "bg-rose-500/20 border-rose-500/40 text-rose-300 backdrop-blur-xl",
          toast.type === "info" && "bg-[#F0DF58]/20 border-[#F0DF58]/40 text-[#F0DF58] backdrop-blur-xl"
        )}>
          {toast.type === "success" ? <Check size={18} /> : <AlertTriangle size={18} />}
          <span className="font-medium text-white">{toast.message}</span>
        </div>
      )}

      {/* ================= SIDEBAR (ESQUERDA) ================= */}
      <aside className="w-full md:w-64 bg-[#120714] border-b md:border-b-0 md:border-r border-white/[0.06] p-5 flex flex-col gap-6 flex-shrink-0">
        {/* Header da Sidebar */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 p-1 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
              <img 
                src="/assets/Logo açai.webp" 
                alt="Logo Açaí no Kilo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-heading text-lg uppercase text-[#F0DF58] leading-tight tracking-wider">
                ADMIN PAINEL
              </h1>
              <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest">
                Açaí no Kilo
              </p>
            </div>
          </div>
          <button 
            onClick={fetchData} 
            title="Recarregar Dados"
            className="p-1.5 text-white/40 hover:text-[#F0DF58] transition-colors md:hidden"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Links Principais */}
        <nav className="flex flex-col gap-1.5">
          <button 
            onClick={() => setActiveTab("overview")} 
            className={cn(
              "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all",
              activeTab === "overview"
                ? "border border-[#F0DF58]/80 bg-[#F0DF58]/10 text-[#F0DF58]"
                : "text-white/60 hover:text-white hover:bg-white/[0.04]"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Home size={17} />
              <span>Visão Geral</span>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab("menu")} 
            className={cn(
              "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all",
              activeTab === "menu"
                ? "border border-[#F0DF58]/80 bg-[#F0DF58]/10 text-[#F0DF58]"
                : "text-white/60 hover:text-white hover:bg-white/[0.04]"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Box size={17} />
              <span>Gestão do Cardápio</span>
            </div>
            <span className="bg-[#F0DF58] text-[#120714] font-heading font-black text-xs px-2 py-0.5 rounded-full">
              {stats.total}
            </span>
          </button>

          <button 
            onClick={() => setActiveTab("orders")} 
            className={cn(
              "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all",
              activeTab === "orders"
                ? "border border-[#F0DF58]/80 bg-[#F0DF58]/10 text-[#F0DF58]"
                : "text-white/60 hover:text-white hover:bg-white/[0.04]"
            )}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard size={17} />
              <span>Pedidos do Dia</span>
            </div>
            <span className="bg-white/10 text-white/70 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {orders.length}
            </span>
          </button>
        </nav>

        {/* Seção RÁPIDAS */}
        <div className="flex flex-col gap-1 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-3 mb-1">
            RÁPIDAS
          </p>
          <button 
            onClick={() => { setEditingItem(null); setModalOpen(true); }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-all text-left"
          >
            <PlusCircle size={16} className="text-white/40" />
            <span>Adicionar Item</span>
          </button>
          <button 
            onClick={() => { setActiveTab("menu"); setSelectedCategory("all"); }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-all text-left"
          >
            <Layers size={16} className="text-white/40" />
            <span>Categorias</span>
          </button>
          <button 
            onClick={() => setActiveTab("orders")}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-all text-left"
          >
            <BarChart3 size={16} className="text-white/40" />
            <span>Relatórios</span>
          </button>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-all text-left"
          >
            <Settings size={16} className="text-white/40" />
            <span>Configurações</span>
          </button>
        </div>

        {/* Card "Dica do dia" */}
        <div className="mt-auto pt-4">
          <div className="bg-[#180918]/90 border border-white/[0.08] rounded-2xl p-4 flex flex-col items-center text-center shadow-lg relative overflow-hidden group">
            <div className="w-20 h-20 flex items-center justify-center mb-1">
              <img 
                src="/assets/Acai_fechado.webp" 
                alt="Dica do dia" 
                className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform" 
              />
            </div>
            <h4 className="font-heading text-base uppercase text-[#F0DF58] tracking-wide">
              Dica do dia
            </h4>
            <p className="text-white/50 text-[11px] leading-snug mt-1 font-sans">
              Mantenha seus itens e preços sempre atualizados para vender mais!
            </p>
          </div>

          {/* Sair do Painel */}
          <button 
            onClick={handleLogout} 
            className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-semibold uppercase tracking-wider transition-all"
          >
            <LogOut size={14} /> Sair do Painel
          </button>
        </div>
      </aside>

      {/* ================= CONTEÚDO PRINCIPAL (DIREITA) ================= */}
      <main className="flex-1 p-5 sm:p-7 lg:p-8 overflow-y-auto space-y-6">
        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Contrôle total do cardápio
            </h2>
            <p className="text-white/50 text-xs sm:text-sm font-sans mt-0.5">
              Adicione, edite valores, ative/desative qualquer item
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Campo de Busca em Pílula */}
            <div className="relative w-full sm:w-72 md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input 
                type="text"
                placeholder="Buscar por nome ou categoria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#170a18] border border-white/10 rounded-xl py-2 pl-9 pr-8 text-white text-xs font-sans focus:outline-none focus:border-[#F0DF58]/60 transition-all placeholder:text-white/30"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Botão + NOVO ITEM */}
            <button 
              onClick={() => { setEditingItem(null); setModalOpen(true); }}
              className="px-4 py-2 bg-[#F0DF58] hover:bg-[#e4d347] text-[#120714] font-heading font-black text-sm rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 uppercase tracking-wide flex-shrink-0"
            >
              <Plus size={16} strokeWidth={3} />
              <span>Novo Item</span>
            </button>
          </div>
        </div>

        {/* Top Stats Cards & Categories Bar */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* 3 Metric Cards */}
          <div className="xl:col-span-5 grid grid-cols-3 gap-3">
            {/* TOTAL DE ITENS */}
            <div className="bg-[#170a18]/80 border border-purple-900/30 rounded-2xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden">
              <p className="text-[10px] font-bold text-purple-300/60 uppercase tracking-wider">
                TOTAL DE ITENS
              </p>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-heading text-3xl font-bold text-white">
                  {stats.total}
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300">
                  <Box size={16} />
                </div>
              </div>
            </div>

            {/* ATIVOS */}
            <div className="bg-[#170a18]/80 border border-emerald-900/30 rounded-2xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden">
              <p className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider">
                ATIVOS
              </p>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-heading text-3xl font-bold text-emerald-400">
                  {stats.active}
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={16} />
                </div>
              </div>
            </div>

            {/* DESATIVADOS */}
            <div className="bg-[#170a18]/80 border border-rose-900/30 rounded-2xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden">
              <p className="text-[10px] font-bold text-rose-400/80 uppercase tracking-wider">
                DESATIVADOS
              </p>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-heading text-3xl font-bold text-rose-400">
                  {stats.inactive}
                </span>
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <XCircle size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* Seção CATEGORIAS (Chips Verticais) */}
          <div className="xl:col-span-7 flex flex-col gap-1.5">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
              CATEGORIAS
            </p>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES_CONFIG.map(cat => {
                const IconComponent = cat.Icon;
                const isSelected = selectedCategory === cat.key;
                const count = categoryCounts[cat.key] ?? 0;

                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={cn(
                      "flex flex-col items-center justify-center py-2 px-3 rounded-2xl border transition-all flex-shrink-0 min-w-[62px] gap-1 group",
                      isSelected 
                        ? "border-[#F0DF58] bg-[#F0DF58]/10 text-[#F0DF58] shadow-[0_0_12px_rgba(240,223,88,0.12)]" 
                        : "border-white/[0.06] bg-[#170a18]/60 text-white/50 hover:border-white/15 hover:text-white"
                    )}
                  >
                    <IconComponent 
                      size={16} 
                      className={isSelected ? "text-[#F0DF58]" : cat.iconColor} 
                    />
                    <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap">
                      {cat.shortLabel}
                      <span className="sr-only"> {cat.label}</span>
                    </span>
                    <span className="text-[9px] text-white/40 font-bold">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sub-filtros (Todos os itens, Ativos, Desativados) e Toggle Grade/Lista */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all",
                statusFilter === "all"
                  ? "bg-[#F0DF58] text-[#120714] shadow-sm"
                  : "bg-[#170a18] text-white/60 hover:text-white border border-white/[0.06]"
              )}
            >
              Todos os itens
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all",
                statusFilter === "active"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-[#170a18] text-white/60 hover:text-white border border-white/[0.06]"
              )}
            >
              Ativos
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all",
                statusFilter === "inactive"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "bg-[#170a18] text-white/60 hover:text-white border border-white/[0.06]"
              )}
            >
              Desativados
            </button>
          </div>

          <div className="flex items-center gap-1 bg-[#170a18] p-1 rounded-xl border border-white/[0.06]">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                viewMode === "grid" ? "text-[#F0DF58] bg-[#F0DF58]/10" : "text-white/40 hover:text-white"
              )}
              title="Visualização em Grade"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                viewMode === "list" ? "text-[#F0DF58] bg-[#F0DF58]/10" : "text-white/40 hover:text-white"
              )}
              title="Visualização em Lista"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* ================= GRADE DE PRODUTOS (4 COLUNAS) ================= */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-[#170a18]/40 border border-white/[0.06] rounded-3xl p-8">
            <p className="text-white/60 text-sm font-sans mb-4">Nenhum item encontrado com os filtros selecionados.</p>
            <button 
              onClick={() => { setSelectedCategory("all"); setStatusFilter("all"); setSearchQuery(""); }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase text-white transition-all border border-white/10"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className={cn(
            viewMode === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
              : "flex flex-col gap-3"
          )}>
            {filteredItems.map(item => {
              const itemImg = item.image || resolveItemImage(item);

              if (viewMode === "list") {
                return (
                  <div 
                    key={item._id}
                    className={cn(
                      "bg-[#170a18]/90 border border-white/[0.07] hover:border-[#F0DF58]/30 rounded-2xl p-3.5 flex items-center justify-between gap-4 transition-all shadow-md",
                      item.active === false && "opacity-60 grayscale bg-black/40 border-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {itemImg ? (
                          <img 
                            src={itemImg} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        ) : (
                          <ImageIcon className="text-white/30" size={18} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-black text-purple-300 uppercase bg-purple-950/70 border border-purple-800/40 px-2 py-0.5 rounded-md">
                          {item.category || item.original_category}
                        </span>
                        <h4 className="font-heading text-lg text-white truncate mt-1">
                          {item.name}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="font-heading text-xl text-[#F0DF58] font-bold">
                        R$ {item.price.toFixed(2).replace('.', ',')}
                      </span>
                      <button 
                        onClick={() => updateItemQuick(item._id, { active: item.active === false ? true : false })}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all",
                          item.active !== false 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                            : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        )}
                      >
                        {item.active !== false ? "Ativo" : "Desativado"}
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => { setEditingItem(item); setModalOpen(true); }}
                          title="Editar"
                          className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-white/60 hover:text-white border border-white/5 transition-all"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={() => setItemToDelete(item)}
                          title="Excluir"
                          className="p-2 rounded-xl bg-rose-500/[0.08] hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/10 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={item._id}
                  className={cn(
                    "group bg-[#170a18]/90 border border-white/[0.07] hover:border-[#F0DF58]/30 rounded-2xl p-3.5 flex flex-col justify-between gap-3 shadow-lg transition-all hover:bg-[#1f0d20]",
                    item.active === false && "opacity-60 grayscale bg-black/40 border-white/5"
                  )}
                >
                  {/* Top: Tag da Categoria (Esquerda) e Status Interativo (Direita) */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black text-purple-300 uppercase bg-purple-950/70 border border-purple-800/40 px-2 py-0.5 rounded-md tracking-wider">
                      {item.category || item.original_category}
                    </span>

                    <button 
                      onClick={() => updateItemQuick(item._id, { active: item.active === false ? true : false })}
                      title={item.active === false ? "Clique para ativar" : "Clique para desativar"}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 transition-all active:scale-95",
                        item.active !== false 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20" 
                          : "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                      )}
                    >
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        item.active !== false ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                      )} />
                      <span>{item.active !== false ? "Ativo" : "Desativado"}</span>
                    </button>
                  </div>

                  {/* Centro: Thumbnail da Imagem com Moldura Arredondada */}
                  <div className="w-full h-28 sm:h-32 rounded-xl bg-black/40 border border-white/[0.06] overflow-hidden flex items-center justify-center p-2 relative group-hover:border-[#F0DF58]/20 transition-colors shadow-inner">
                    {itemImg ? (
                      <img 
                        src={itemImg} 
                        alt={item.name} 
                        className={cn(
                          "w-full h-full transition-transform duration-300 group-hover:scale-110",
                          (item.original_category === 'sizes' || item.original_category === 'ready_made')
                            ? "object-contain p-1"
                            : "object-cover"
                        )}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <ImageIcon className="text-white/20" size={28} />
                    )}
                  </div>

                  {/* Nome do Produto */}
                  <div>
                    <h4 className="font-heading text-lg sm:text-xl uppercase text-white font-bold tracking-wide truncate group-hover:text-[#F0DF58] transition-colors">
                      {item.name}
                    </h4>
                    {item.description && (
                      <p className="text-white/50 text-xs truncate mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Rodapé do Card: Preço à Esquerda e Botões ✏️ / 🗑️ à Direita */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                    <span className="font-heading text-xl text-[#F0DF58] font-bold tracking-wide select-none">
                      R$ {item.price.toFixed(2).replace('.', ',')}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => { setEditingItem(item); setModalOpen(true); }}
                        title="Editar"
                        className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-white/60 hover:text-white border border-white/5 transition-all active:scale-95"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => setItemToDelete(item)}
                        title="Excluir"
                        className="p-2 rounded-xl bg-rose-500/[0.08] hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/10 transition-all active:scale-95"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ================= MODAL DE CRIAÇÃO / EDIÇÃO ================= */}
      {modalOpen && (
        <ItemModal 
          item={editingItem}
          onClose={() => { setModalOpen(false); setEditingItem(null); }}
          onSave={handleSaveItemModal}
          loading={savingItem}
        />
      )}

      {/* ================= MODAL DE CONFIRMAÇÃO DE EXCLUSÃO ================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#170a18] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-4 text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                <Trash2 size={28} />
              </div>
              <div>
                <h3 className="font-heading text-2xl uppercase text-white">Excluir Item?</h3>
                <p className="text-white/70 text-xs font-sans">Esta ação removerá o produto do cardápio.</p>
              </div>
            </div>

            <p className="text-white/90 text-sm font-sans bg-white/5 p-4 rounded-2xl border border-white/10">
              Tem certeza que deseja excluir <strong>"{itemToDelete.name}"</strong>?
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-heading text-base rounded-xl transition-all uppercase border border-white/10"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="flex-1 py-3 bg-rose-500 text-white font-heading text-base rounded-xl hover:bg-rose-600 transition-all shadow-lg active:scale-95 uppercase font-bold"
              >
                Excluir Definitivamente
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
  item: ItemAdmin | null;
  onClose: () => void;
  onSave: (data: Partial<ItemAdmin>) => void;
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#170a18] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
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
              <div className="w-20 h-20 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 relative shadow-inner">
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
                  className="w-full bg-white/[0.06] border border-white/15 rounded-xl py-2 px-3 text-white text-xs font-sans focus:outline-none focus:border-[#F0DF58]/60 transition-all placeholder:text-white/40"
                />
                
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 text-xs font-bold uppercase cursor-pointer transition-all border border-white/15">
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
              className="w-full bg-white/[0.06] border border-white/15 rounded-xl py-3 px-4 text-white text-sm font-sans focus:outline-none focus:border-[#F0DF58]/60 transition-all placeholder:text-white/40"
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
                className="w-full bg-[#120714] border border-white/15 rounded-xl py-3 px-3 text-white text-sm font-sans focus:outline-none focus:border-[#F0DF58]/60 transition-all"
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
                className="w-full bg-white/[0.06] border border-white/15 rounded-xl py-3 px-4 text-white text-sm font-sans focus:outline-none focus:border-[#F0DF58]/60 transition-all placeholder:text-white/40"
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
                  className="w-full bg-white/[0.06] border border-white/15 rounded-xl py-3 pl-10 pr-4 text-white text-sm font-sans focus:outline-none focus:border-[#F0DF58]/60 transition-all"
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
                className="w-full bg-white/[0.06] border border-white/15 rounded-xl py-3 px-4 text-white text-sm font-sans focus:outline-none focus:border-[#F0DF58]/60 transition-all placeholder:text-white/40"
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
              className="w-full bg-white/[0.06] border border-white/15 rounded-xl py-3 px-4 text-white text-sm font-sans focus:outline-none focus:border-[#F0DF58]/60 transition-all placeholder:text-white/40"
            />
          </div>

          {/* Status Ativo / Em Estoque */}
          <div className="flex items-center justify-between p-4 bg-white/[0.04] border border-white/10 rounded-2xl">
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
                "w-6 h-6 rounded-full bg-white shadow-md transition-transform",
                active ? "translate-x-6" : "translate-x-0"
              )} />
            </button>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 bg-white/10 hover:bg-white/20 text-white font-heading text-base rounded-xl transition-all uppercase border border-white/10"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 bg-[#F0DF58] hover:bg-[#e4d347] text-[#120714] font-heading text-lg rounded-xl transition-all shadow-lg active:scale-95 uppercase font-black flex items-center justify-center gap-2"
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
