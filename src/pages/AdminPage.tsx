import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Box, 
  LogOut, 
  RefreshCw, 
  Power, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Image as ImageIcon, 
  Check, 
  X, 
  AlertTriangle,
  Upload,
  Sparkles
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
  { key: "all", label: "Todos os Itens", icon: "🍨", color: "from-amber-500/20 to-yellow-500/20" },
  { key: "sizes", label: "Tamanhos de Potes", icon: "🥣", color: "from-purple-500/20 to-pink-500/20" },
  { key: "flavors", label: "Sabores de Açaí", icon: "🍇", color: "from-violet-500/20 to-purple-500/20" },
  { key: "toppings", label: "Coberturas", icon: "🍯", color: "from-amber-500/20 to-orange-500/20" },
  { key: "addons", label: "Adicionais", icon: "🥜", color: "from-emerald-500/20 to-teal-500/20" },
  { key: "creams", label: "Cremes", icon: "🍧", color: "from-pink-500/20 to-rose-500/20" },
  { key: "fruits", label: "Frutas Frescas", icon: "🍓", color: "from-red-500/20 to-rose-500/20" },
  { key: "fillings", label: "Recheios Especiais", icon: "🍫", color: "from-yellow-600/20 to-amber-700/20" },
  { key: "ready_made", label: "Prontos para Levar", icon: "📦", color: "from-blue-500/20 to-cyan-500/20" },
];

const LOCAL_STORAGE_KEY = "cardapio_admin_menu_items_v2";

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
  const [activeTab, setActiveTab] = useState<"orders" | "menu">("menu");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
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

  const getInitialFallbackItems = (): ItemAdmin[] => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
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
          image: i.image || (cat === 'fruits' ? `/assets/items/${i.id}.webp` : ''),
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
        setMenuItems(backendItems);
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

  // Contadores de estatísticas
  const stats = useMemo(() => {
    const total = menuItems.length;
    const active = menuItems.filter(i => i.active !== false).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [menuItems]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#241220] flex flex-col items-center justify-center">
        <RefreshCw className="text-primary animate-spin mb-4" size={48} />
        <span className="font-heading text-xl text-white uppercase tracking-widest">Sincronizando Painel...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#241220] text-white flex flex-col md:flex-row relative selection:bg-primary selection:text-secondary">
      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-[100] px-5 py-3.5 rounded-2xl shadow-2xl font-sans text-sm flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 border",
          toast.type === "success" && "bg-[#25D366]/20 border-[#25D366]/40 text-[#25D366] backdrop-blur-xl",
          toast.type === "error" && "bg-red-500/20 border-red-500/40 text-red-300 backdrop-blur-xl",
          toast.type === "info" && "bg-primary/20 border-primary/40 text-primary backdrop-blur-xl"
        )}>
          {toast.type === "success" ? <Check size={18} /> : <AlertTriangle size={18} />}
          <span className="font-medium text-white">{toast.message}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-72 bg-black/30 border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col gap-6 backdrop-blur-xl">
        <div className="flex items-center justify-between md:justify-start gap-3 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <LayoutDashboard className="text-[#241220]" size={24} />
            </div>
            <div>
              <h1 className="font-heading text-2xl uppercase text-primary leading-none tracking-wide">Admin Painel</h1>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mt-1">Açaí no Kilo</p>
            </div>
          </div>
          <button 
            onClick={fetchData} 
            title="Recarregar Dados"
            className="p-2 text-white/40 hover:text-primary transition-colors md:hidden"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Status Pills */}
        <div className="grid grid-cols-3 gap-2 bg-white/[0.03] p-3 rounded-2xl border border-white/5">
          <div className="text-center">
            <p className="text-[10px] text-white/40 font-bold uppercase">Total</p>
            <p className="font-heading text-lg text-white">{stats.total}</p>
          </div>
          <div className="text-center border-x border-white/5">
            <p className="text-[10px] text-[#25D366] font-bold uppercase">Ativos</p>
            <p className="font-heading text-lg text-[#25D366]">{stats.active}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-red-400 font-bold uppercase">Pausados</p>
            <p className="font-heading text-lg text-red-400">{stats.inactive}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab("menu")} 
            className={cn(
              "flex items-center justify-between p-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all", 
              activeTab === "menu" 
                ? "bg-primary text-secondary shadow-lg shadow-primary/20 font-black" 
                : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <Box size={20} /> Gestão do Cardápio
            </div>
            <span className={cn("px-2 py-0.5 rounded-full text-[10px]", activeTab === "menu" ? "bg-secondary text-primary font-bold" : "bg-white/10 text-white/60")}>
              {stats.total}
            </span>
          </button>

          <button 
            onClick={() => setActiveTab("orders")} 
            className={cn(
              "flex items-center justify-between p-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all", 
              activeTab === "orders" 
                ? "bg-primary text-secondary shadow-lg shadow-primary/20 font-black" 
                : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard size={20} /> Pedidos do Dia
            </div>
            <span className={cn("px-2 py-0.5 rounded-full text-[10px]", activeTab === "orders" ? "bg-secondary text-primary font-bold" : "bg-white/10 text-white/60")}>
              {orders.length}
            </span>
          </button>
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto pt-6 border-t border-white/5 flex flex-col gap-3">
          <button 
            onClick={fetchData} 
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold uppercase transition-all"
          >
            <RefreshCw size={14} /> Sincronizar
          </button>
          
          <button 
            onClick={handleLogout} 
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold uppercase transition-all"
          >
            <LogOut size={16} /> Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-5 sm:p-8 lg:p-10 overflow-y-auto">
        {activeTab === "orders" ? (
          /* ================= ABA PEDIDOS ================= */
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-3xl sm:text-4xl uppercase text-white tracking-wide">Últimos Pedidos</h2>
                <p className="text-white/50 text-xs sm:text-sm font-sans">Histórico de pedidos recebidos via WhatsApp e sistema</p>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-primary uppercase">
                {orders.length} Pedidos
              </span>
            </div>

            <div className="grid gap-4">
              {orders.map(order => (
                <div key={order._id} className="bg-white/[0.03] border border-white/10 p-6 rounded-3xl flex flex-col md:flex-row justify-between gap-6 hover:bg-white/[0.05] transition-all">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="bg-primary text-secondary px-3 py-1 rounded-full text-xs font-black uppercase font-heading tracking-wide">
                        R$ {order.total.toFixed(2)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-white/10 text-white/80 text-[10px] font-bold uppercase">
                        {order.deliveryMethod || "Entrega"}
                      </span>
                      <span className="text-white/40 text-xs font-sans">
                        {new Date(order.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-white font-sans text-sm leading-relaxed">
                      {order.items.join(" • ")}
                    </p>
                    {order.address && (
                      <p className="text-white/40 text-xs font-sans italic flex items-center gap-1.5">
                        📍 {order.address.street}{order.address.number ? `, ${order.address.number}` : ''} - {order.address.neighborhood}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Pagamento</p>
                      <p className="font-heading text-xl text-primary uppercase tracking-wide">{order.paymentMethod}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ================= ABA GESTÃO DE CARDÁPIO ================= */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header com Ação Principal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-3xl sm:text-4xl uppercase text-white tracking-wide">Controle Total do Cardápio</h2>
                <p className="text-white/50 text-xs sm:text-sm font-sans">Adicione, edite valores, altere fotos e ative/pause qualquer item</p>
              </div>
              
              <button 
                onClick={() => { setEditingItem(null); setModalOpen(true); }}
                className="px-6 py-3.5 bg-primary text-secondary font-heading text-lg rounded-2xl flex items-center justify-center gap-2 hover:bg-[#ebd93a] transition-all shadow-lg shadow-primary/20 active:scale-95 uppercase font-black"
              >
                <Plus size={20} /> Novo Item
              </button>
            </div>

            {/* Categorias Tabs (Horizontais) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-white/5">
              {CATEGORIES_CONFIG.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl font-sans text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2",
                    selectedCategory === cat.key 
                      ? "bg-white/15 text-primary border border-primary/40 shadow-md" 
                      : "bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white border border-transparent"
                  )}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Filtros e Busca */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Barra de Pesquisa */}
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input 
                  type="text"
                  placeholder="Buscar por nome ou categoria..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-white text-sm font-sans focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/30"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Filtro de Status */}
              <div className="flex items-center gap-1.5 bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 w-full sm:w-auto justify-center">
                <button 
                  onClick={() => setStatusFilter("all")} 
                  className={cn("px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all", statusFilter === "all" ? "bg-white/15 text-white" : "text-white/40 hover:text-white")}
                >
                  Todos ({stats.total})
                </button>
                <button 
                  onClick={() => setStatusFilter("active")} 
                  className={cn("px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all", statusFilter === "active" ? "bg-[#25D366]/20 text-[#25D366]" : "text-white/40 hover:text-[#25D366]")}
                >
                  Ativos ({stats.active})
                </button>
                <button 
                  onClick={() => setStatusFilter("inactive")} 
                  className={cn("px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all", statusFilter === "inactive" ? "bg-red-500/20 text-red-400" : "text-white/40 hover:text-red-400")}
                >
                  Pausados ({stats.inactive})
                </button>
              </div>
            </div>

            {/* Grid de Itens */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-3xl p-8">
                <p className="text-white/40 text-sm font-sans mb-4">Nenhum item encontrado com os filtros selecionados.</p>
                <button 
                  onClick={() => { setSelectedCategory("all"); setStatusFilter("all"); setSearchQuery(""); }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase text-white transition-all"
                >
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                  <div 
                    key={item._id} 
                    className={cn(
                      "group relative bg-white/[0.03] border p-5 rounded-3xl flex flex-col justify-between gap-4 transition-all hover:bg-white/[0.06] hover:border-white/20 shadow-lg",
                      item.active === false ? "opacity-50 grayscale border-white/5 bg-black/20" : "border-white/10"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Thumbnail da Imagem */}
                      <div className="w-16 h-16 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 relative group-hover:border-primary/40 transition-colors">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              // Se falhar o carregamento da imagem, mostra ícone
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <ImageIcon className="text-white/20" size={24} />
                        )}
                      </div>

                      {/* Informações do Item */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-md">
                            {item.category || item.original_category}
                          </span>
                          {item.type && (
                            <span className="text-[9px] font-bold text-white/40 uppercase bg-white/5 px-1.5 py-0.5 rounded">
                              {item.type}
                            </span>
                          )}
                        </div>
                        <h4 className="font-heading text-xl uppercase text-white truncate group-hover:text-primary transition-colors">
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="text-white/40 text-xs font-sans truncate mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Preço e Ações Rápidas */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
                      {/* Campo de Preço Rápido */}
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-primary font-heading text-sm">R$</span>
                        <input 
                          type="number" 
                          step="0.50"
                          defaultValue={item.price} 
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val !== item.price) {
                              updateItemQuick(item._id, { price: val });
                            }
                          }}
                          className="w-24 bg-white/10 border border-white/10 rounded-xl py-1.5 pl-8 pr-2 text-white font-heading text-base focus:outline-none focus:border-primary transition-all text-right" 
                        />
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex items-center gap-1.5">
                        {/* Editar Completo */}
                        <button 
                          onClick={() => { setEditingItem(item); setModalOpen(true); }}
                          title="Editar Detalhes / Foto"
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all"
                        >
                          <Edit3 size={16} />
                        </button>

                        {/* Power Toggle */}
                        <button 
                          onClick={() => updateItemQuick(item._id, { active: item.active === false ? true : false })}
                          title={item.active === false ? "Ativar Item no Cardápio" : "Pausar Item (Falta no Estoque)"}
                          className={cn(
                            "p-2.5 rounded-xl transition-all", 
                            item.active !== false 
                              ? "bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30" 
                              : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          )}
                        >
                          <Power size={16} />
                        </button>

                        {/* Excluir */}
                        <button 
                          onClick={() => setItemToDelete(item)}
                          title="Excluir do Cardápio"
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#2a1324] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-4 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-2xl">
                <Trash2 size={28} />
              </div>
              <div>
                <h3 className="font-heading text-2xl uppercase text-white">Excluir Item?</h3>
                <p className="text-white/40 text-xs font-sans">Esta ação removerá o produto do cardápio.</p>
              </div>
            </div>

            <p className="text-white/70 text-sm font-sans bg-white/5 p-4 rounded-2xl border border-white/5">
              Tem certeza que deseja excluir <strong>"{itemToDelete.name}"</strong>?
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-heading text-base rounded-xl transition-all uppercase"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="flex-1 py-3 bg-red-500 text-white font-heading text-base rounded-xl hover:bg-red-600 transition-all shadow-lg active:scale-95 uppercase font-bold"
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
  const [image, setImage] = useState(item?.image || "");
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#241220] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="font-heading text-2xl uppercase text-primary">
              {item ? "Editar Item do Cardápio" : "Adicionar Novo Item"}
            </h3>
            <p className="text-white/40 text-xs font-sans">Preencha as informações do produto</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white rounded-xl">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Seção de Imagem com Dica de WebP */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase text-white/70 block">
              Imagem do Produto
            </label>

            {/* Dica WebP em destaque */}
            <div className="flex items-start gap-2.5 bg-primary/10 border border-primary/20 p-3 rounded-2xl text-primary text-xs font-sans leading-relaxed">
              <Sparkles size={16} className="flex-shrink-0 mt-0.5" />
              <span>
                <strong>Dica de Performance:</strong> Utilize imagens no formato <strong>.webp</strong> otimizado (&lt;30KB) para garantir carregamento instantâneo no celular.
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="w-20 h-20 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                {image ? (
                  <img src={image} alt="Preview" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImageIcon className="text-white/20" size={28} />
                )}
              </div>

              {/* Upload & Path */}
              <div className="flex-1 space-y-2">
                <input 
                  type="text"
                  placeholder="URL ou Caminho (ex: /assets/items/fr_morango.webp)"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-xs font-sans focus:outline-none focus:border-primary transition-all"
                />
                
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 text-xs font-bold uppercase cursor-pointer transition-all">
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
            <label className="text-xs font-bold uppercase text-white/70 block">
              Nome do Item *
            </label>
            <input 
              type="text"
              required
              placeholder="Ex: Açaí c/ Morango Especial"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-sans focus:outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Categoria e Subcategoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-white/70 block">
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
                className="w-full bg-[#2a1324] border border-white/10 rounded-xl py-3 px-3 text-white text-sm font-sans focus:outline-none focus:border-primary transition-all"
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
              <label className="text-xs font-bold uppercase text-white/70 block">
                Rótulo de Exibição
              </label>
              <input 
                type="text"
                placeholder="Ex: Adicional, Cobertura, Fruta"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-sans focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Preço e Volume */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-white/70 block">
                Preço (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">R$</span>
                <input 
                  type="number"
                  step="0.25"
                  required
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm font-sans focus:outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-white/70 block">
                Volume / Tipo (Opcional)
              </label>
              <input 
                type="text"
                placeholder="Ex: 50ml, 100ml, Pote"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-sans focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Descrição Opcional */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-white/70 block">
              Descrição (Opcional)
            </label>
            <input 
              type="text"
              placeholder="Ex: Açaí puro batido sem conservantes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-sans focus:outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Status Ativo / Em Estoque */}
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
            <div>
              <p className="font-heading text-lg uppercase text-white">Disponível no Cardápio</p>
              <p className="text-white/40 text-xs font-sans">Se desativado, o item ficará oculto para os clientes</p>
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
              className="flex-1 py-3.5 bg-white/10 hover:bg-white/20 text-white font-heading text-base rounded-xl transition-all uppercase"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 bg-primary text-secondary font-heading text-lg rounded-xl hover:bg-[#ebd93a] transition-all shadow-lg shadow-primary/20 active:scale-95 uppercase font-black flex items-center justify-center gap-2"
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
