import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Box, LogOut, RefreshCw, Power } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ItemAdmin = {
  _id: string;
  id: string;
  name: string;
  price: number;
  category: string;
  original_category: string;
  active?: boolean;
};

type OrderAdmin = {
  _id: string;
  total: number;
  paymentMethod: string;
  deliveryMethod: string;
  items: string[];
  createdAt: string;
  address?: {
    street: string;
    neighborhood: string;
  };
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "menu">("orders");
  const [menuItems, setMenuItems] = useState<ItemAdmin[]>([]);
  const [orders, setOrders] = useState<OrderAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [token]);

  const fetchData = async () => {
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

      setMenuItems(await menuRes.json());
      setOrders(await ordersRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/login");
  };

  const updateItem = async (id: string, updates: Partial<ItemAdmin>) => {
    try {
      const res = await fetch(`http://localhost:3001/api/admin/menu/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        setMenuItems(prev => prev.map(item => item._id === id ? { ...item, ...updates } : item));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#3d1b34] flex flex-col items-center justify-center">
        <RefreshCw className="text-primary animate-spin mb-4" size={48} />
        <span className="font-heading text-xl text-white uppercase tracking-widest">Sincronizando Dados...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#3d1b34] text-white flex flex-col sm:flex-row">
      {/* Sidebar */}
      <aside className="w-full sm:w-64 bg-black/20 border-b sm:border-b-0 sm:border-r border-white/5 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
             <LayoutDashboard className="text-[#3d1b34]" size={24} />
          </div>
          <h1 className="font-heading text-2xl uppercase text-primary">Admin</h1>
        </div>

        <nav className="flex flex-col gap-2">
          <button onClick={() => setActiveTab("orders")} className={cn("flex items-center gap-3 p-4 rounded-2xl font-bold text-xs uppercase transition-all", activeTab === "orders" ? "bg-primary text-secondary" : "text-white/40 hover:bg-white/5")}>
            <LayoutDashboard size={20} /> Pedidos do Dia
          </button>
          <button onClick={() => setActiveTab("menu")} className={cn("flex items-center gap-3 p-4 rounded-2xl font-bold text-xs uppercase transition-all", activeTab === "menu" ? "bg-primary text-secondary" : "text-white/40 hover:bg-white/5")}>
            <Box size={20} /> Estoque e Preços
          </button>
        </nav>

        <button onClick={handleLogout} className="mt-auto flex items-center gap-3 p-4 rounded-2xl font-bold text-xs uppercase text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut size={20} /> Sair do Painel
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        {activeTab === "orders" ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="font-heading text-4xl uppercase text-white">Últimos Pedidos</h2>
            <div className="grid gap-4">
              {orders.map(order => (
                <div key={order._id} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col sm:flex-row justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="bg-primary text-secondary px-3 py-1 rounded-full text-[10px] font-black uppercase">R$ {order.total.toFixed(2)}</span>
                      <span className="text-white/40 text-[10px] font-bold uppercase">{new Date(order.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="text-white font-medium">{order.items.join(", ")}</p>
                    {order.address && <p className="text-white/40 text-xs italic">Entrega em: {order.address.street}, {order.address.neighborhood}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-white/30 uppercase">Pagamento</p>
                      <p className="font-heading text-xl text-primary uppercase">{order.paymentMethod}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="font-heading text-4xl uppercase text-white">Gestão de Cardápio</h2>
            <div className="space-y-4">
              {menuItems.map(item => (
                <div key={item._id} className={cn("bg-white/5 border p-5 rounded-2xl flex items-center justify-between gap-6 transition-all", item.active === false ? "opacity-40 grayscale border-white/5" : "border-white/10")}>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">{item.original_category}</p>
                    <h4 className="font-heading text-xl uppercase">{item.name}</h4>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold text-xs">R$</span>
                      <input 
                        type="number" 
                        defaultValue={item.price} 
                        onBlur={(e) => updateItem(item._id, { price: parseFloat(e.target.value) })}
                        className="w-24 bg-white/10 border border-white/10 rounded-xl py-2 pl-8 pr-3 text-white font-sans text-sm focus:outline-none focus:border-primary transition-all" 
                      />
                    </div>
                    
                    <button 
                      onClick={() => updateItem(item._id, { active: item.active !== false ? false : true })}
                      className={cn("p-3 rounded-xl transition-all", item.active !== false ? "bg-primary text-secondary" : "bg-red-500/20 text-red-400")}
                    >
                      <Power size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
