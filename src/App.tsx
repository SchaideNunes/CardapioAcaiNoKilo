import { useState, useMemo, useEffect } from "react";
import { MenuItem } from "@/data/menu";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  ShoppingCart, 
  Send,
  Trash2,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type OrderState = {
  size: MenuItem | null;
  flavor: MenuItem | null;
  toppings: MenuItem[];
  addons: MenuItem[];
  creams: MenuItem[];
  fruits: MenuItem[];
  fillings: MenuItem[];
  deliveryMethod: "pickup" | "delivery" | null;
  address: {
    street: string;
    number: string;
    neighborhood: string;
  };
  paymentMethod: "pix" | "card" | "cash" | null;
  changeFor: string;
};

type MenuData = {
  sizes: MenuItem[];
  flavors: MenuItem[];
  toppings: MenuItem[];
  addons: MenuItem[];
  creams: MenuItem[];
  fruits: MenuItem[];
  fillings: MenuItem[];
};

export default function OrderPage() {
  const [apiData, setApiData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [order, setOrder] = useState<OrderState>({
    size: null,
    flavor: null,
    toppings: [],
    addons: [],
    creams: [],
    fruits: [],
    fillings: [],
    deliveryMethod: null,
    address: {
      street: "",
      number: "",
      neighborhood: ""
    },
    paymentMethod: null,
    changeFor: "",
  });

  useEffect(() => {
    fetch("http://localhost:3001/api/menu")
      .then(res => res.json())
      .then(data => {
        setApiData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar menu:", err);
        setLoading(false);
      });
  }, []);

  const STEPS = useMemo(() => [
    { id: "size", title: "Escolha o Tamanho", data: apiData?.sizes || [] },
    { id: "flavor", title: "Escolha o Sabor", data: apiData?.flavors || [] },
    { id: "toppings", title: "Coberturas", data: apiData?.toppings || [], multiple: true },
    { id: "addons", title: "Adicionais", data: apiData?.addons || [], multiple: true },
    { id: "creams", title: "Cremes", data: apiData?.creams || [], multiple: true },
    { id: "fruits", title: "Frutas", data: apiData?.fruits || [], multiple: true },
    { id: "fillings", title: "Recheios", data: apiData?.fillings || [], multiple: true },
    { id: "delivery", title: "Entrega ou Retirada" },
    { id: "payment", title: "Forma de Pagamento" },
    { id: "summary", title: "Resumo do Pedido" },
  ], [apiData]);

  const [holdTimer, setHoldTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [holdInterval, setHoldInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteProgress, setDeleteProgress] = useState(0);

  const totalPrice = useMemo(() => {
    let total = order.size?.price || 0;
    const additions = [...order.toppings, ...order.addons, ...order.creams, ...order.fruits, ...order.fillings];
    total += additions.reduce((sum, item) => sum + item.price, 0);
    if (order.deliveryMethod === "delivery") total += 7.00;
    return total;
  }, [order]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      // Se for entrega e selecionou Retirada, pula pagamento (passo 8 para 10)
      if (STEPS[currentStep].id === "delivery" && order.deliveryMethod === "pickup") {
        setCurrentStep(currentStep + 2);
      } else {
        setCurrentStep(currentStep + 1);
      }
      setSearchQuery(""); 
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      // Se estiver no resumo e for Retirada, volta para entrega (passo 9 para 7)
      if (STEPS[currentStep].id === "summary" && order.deliveryMethod === "pickup") {
        setCurrentStep(currentStep - 2);
      } else {
        setCurrentStep(currentStep - 1);
      }
      setSearchQuery(""); 
      window.scrollTo(0, 0);
    }
  };

  const toggleItem = (category: keyof OrderState, item: MenuItem, multiple = false) => {
    setOrder((prev) => {
      if (!multiple) return { ...prev, [category]: item };
      const currentItems = prev[category] as MenuItem[];
      const exists = currentItems.find((i) => i.id === item.id);
      if (exists) return { ...prev, [category]: currentItems.filter((i) => i.id !== item.id) };
      return { ...prev, [category]: [...currentItems, item] };
    });
  };

  const removeItem = (category: keyof OrderState, itemId: string) => {
    setOrder(prev => {
      if (category === 'size' || category === 'flavor') return { ...prev, [category]: null };
      const currentItems = prev[category];
      if (Array.isArray(currentItems)) {
        return { ...prev, [category]: currentItems.filter((i: MenuItem) => i.id !== itemId) };
      }
      return prev;
    });
    stopHold();
  };

  const startHold = (category: keyof OrderState, itemId: string) => {
    if (holdTimer || holdInterval) stopHold();
    setDeletingId(itemId);
    setDeleteProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setDeleteProgress(progress);
      if (progress >= 100) clearInterval(interval);
    }, 100);
    const timer = setTimeout(() => {
      removeItem(category, itemId);
    }, 1000);
    setHoldTimer(timer);
    setHoldInterval(interval);
  };

  const stopHold = () => {
    if (holdTimer) clearTimeout(holdTimer);
    if (holdInterval) clearInterval(holdInterval);
    setHoldTimer(null);
    setHoldInterval(null);
    setDeletingId(null);
    setDeleteProgress(0);
  };

  const formatWhatsAppMessage = () => {
    if (!order.size || !order.flavor) return "";
    let message = `*NOVO PEDIDO*\n\n*Base:* ${order.size.name} (${order.flavor.name})\n`;
    const items = [...order.toppings, ...order.addons, ...order.creams, ...order.fruits, ...order.fillings].map(i => i.name).join(", ");
    if (items) message += `*Itens:* ${items}\n`;
    message += `\n*Entrega:* ${order.deliveryMethod === "delivery" ? "Receber em casa" : "Retirar na loja"}\n`;
    if (order.deliveryMethod === "delivery") message += `*Endereço:* ${order.address.street}, ${order.address.number} - ${order.address.neighborhood}\n`;
    const paymentLabels = { pix: "Pix", card: "Cartão", cash: "Dinheiro" };
    message += `\n*Pagamento:* ${order.paymentMethod ? paymentLabels[order.paymentMethod] : "Não definido"}\n`;
    if (order.paymentMethod === "cash" && order.changeFor) {
      message += order.changeFor === "Não preciso" ? `*Troco:* Não preciso\n` : `*Troco para:* R$ ${order.changeFor}\n`;
    }
    message += `\n*TOTAL: R$ ${totalPrice.toFixed(2).replace(".", ",")}*`;
    return encodeURIComponent(message);
  };

  const sendWhatsApp = () => {
    window.open(`https://wa.me/557591585290?text=${formatWhatsAppMessage()}`, "_blank");
  };

  const isStepValid = () => {
    if (!order.size) return false;
    if (currentStep >= 1 && !order.flavor) return false;
    if (STEPS[currentStep].id === "delivery") {
      if (!order.deliveryMethod) return false;
      if (order.deliveryMethod === "delivery" && (!order.address.street.trim() || !order.address.number.trim() || !order.address.neighborhood.trim())) return false;
    }
    if (STEPS[currentStep].id === "payment") {
      if (!order.paymentMethod) return false;
      if (order.paymentMethod === "cash" && !order.changeFor) return false;
    }
    return true;
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];
    if (step.id === "payment") {
      return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <button onClick={() => setOrder(p => ({ ...p, paymentMethod: "pix" }))} className={cn("relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl transition-all border-0", order.paymentMethod === "pix" ? "bg-primary text-secondary shadow-lg" : "bg-white/5 text-white hover:bg-white/10")}>
              <div className="mb-2 w-10 h-10 flex items-center justify-center">
                 <img src="/assets/pix.png" alt="Pix" className="w-full h-full object-contain" />
              </div>
              <span className="font-heading text-sm sm:text-xl uppercase">Pix</span>
              {order.paymentMethod === "pix" && <div className="absolute top-2 right-2 bg-secondary text-primary w-4 h-4 rounded-full flex items-center justify-center shadow-lg"><Check size={10} strokeWidth={4} /></div>}
            </button>
            <button onClick={() => setOrder(p => ({ ...p, paymentMethod: "card" }))} className={cn("relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl transition-all border-0", order.paymentMethod === "card" ? "bg-primary text-secondary shadow-lg" : "bg-white/5 text-white hover:bg-white/10")}>
              <div className="mb-2 w-10 h-10 flex items-center justify-center">
                 <img src="/assets/card.png" alt="Cartão" className="w-8 h-8 object-contain" />
              </div>
              <span className="font-heading text-sm sm:text-xl uppercase">Cartão</span>
              {order.paymentMethod === "card" && <div className="absolute top-2 right-2 bg-secondary text-primary w-4 h-4 rounded-full flex items-center justify-center shadow-lg"><Check size={10} strokeWidth={4} /></div>}
            </button>
            <button onClick={() => setOrder(p => ({ ...p, paymentMethod: "cash" }))} className={cn("relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl transition-all border-0", order.paymentMethod === "cash" ? "bg-primary text-secondary shadow-lg" : "bg-white/5 text-white hover:bg-white/10")}>
              <div className="mb-2 w-10 h-10 flex items-center justify-center">
                 <img src="/assets/Dinheiro.webp" alt="Dinheiro" className="w-8 h-8 object-contain" />
              </div>
              <span className="font-heading text-sm sm:text-xl uppercase">Dinheiro</span>
              {order.paymentMethod === "cash" && <div className="absolute top-2 right-2 bg-secondary text-primary w-4 h-4 rounded-full flex items-center justify-center shadow-lg"><Check size={10} strokeWidth={4} /></div>}
            </button>
          </div>
          {order.paymentMethod === "cash" && (
            <div className="animate-in fade-in zoom-in-95 duration-500 space-y-4 flex flex-col items-center">
              <h3 className="font-heading text-lg uppercase text-white/90">Precisa de troco?</h3>
              <div className="flex flex-col gap-3 w-full max-w-[240px]">
                <div className="relative">
                  <input type="number" placeholder="Valor para troco" value={order.changeFor === "Não preciso" ? "" : order.changeFor} onChange={(e) => setOrder(prev => ({ ...prev, changeFor: e.target.value }))} disabled={order.changeFor === "Não preciso"} className={cn("w-full bg-white/5 border border-white/10 rounded-xl p-3 font-sans text-white focus:outline-none focus:border-primary transition-all text-center text-lg font-bold placeholder:text-white/20", order.changeFor === "Não preciso" && "opacity-20 grayscale")} />
                  {order.changeFor && order.changeFor !== "Não preciso" && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">R$</span>}
                </div>
                <button onClick={() => setOrder(p => ({ ...p, changeFor: p.changeFor === "Não preciso" ? "" : "Não preciso" }))} className="flex items-center justify-center gap-2 py-1">
                  <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", order.changeFor === "Não preciso" ? "bg-primary border-primary" : "border-white/20")}>{order.changeFor === "Não preciso" && <Check size={10} className="text-secondary" strokeWidth={4} />}</div>
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest", order.changeFor === "Não preciso" ? "text-primary" : "text-white/40")}>Não preciso de troco</span>
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }
    if (step.id === "delivery") {
      return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button onClick={() => setOrder(p => ({ ...p, deliveryMethod: "pickup" }))} className={cn("relative flex flex-col items-center justify-center p-6 sm:p-10 rounded-3xl transition-all border-0", order.deliveryMethod === "pickup" ? "bg-primary text-secondary shadow-lg" : "bg-white/5 text-white hover:bg-white/10")}>
              <div className="mb-3 p-3 rounded-2xl bg-white/10"><ShoppingCart size={28} /></div>
              <span className="font-heading text-xl sm:text-2xl uppercase leading-none">Retirar na Loja</span>
              <span className={cn("text-xs font-bold font-sans uppercase tracking-widest mt-2", order.deliveryMethod === "pickup" ? "text-secondary/60" : "text-white")}>Grátis</span>
              {order.deliveryMethod === "pickup" && <div className="absolute top-4 right-4 bg-secondary text-primary w-6 h-6 rounded-full flex items-center justify-center shadow-lg"><Check size={14} strokeWidth={4} /></div>}
            </button>
            <button onClick={() => setOrder(p => ({ ...p, deliveryMethod: "delivery" }))} className={cn("relative flex flex-col items-center justify-center p-6 sm:p-10 rounded-3xl transition-all border-0", order.deliveryMethod === "delivery" ? "bg-primary text-secondary shadow-lg" : "bg-white/5 text-white hover:bg-white/10")}>
              <div className="mb-3 p-3 rounded-2xl bg-white/10"><Send size={28} /></div>
              <span className="font-heading text-xl sm:text-2xl uppercase leading-none">Receber em Casa</span>
              <span className={cn("text-sm font-bold font-sans uppercase tracking-widest mt-2 flex items-center justify-center gap-1", order.deliveryMethod === "delivery" ? "text-secondary" : "text-white")}>+ R$ 7,00</span>
              {order.deliveryMethod === "delivery" && <div className="absolute top-4 right-4 bg-secondary text-primary w-6 h-6 rounded-full flex items-center justify-center shadow-lg"><Check size={14} strokeWidth={4} /></div>}
            </button>
          </div>
          {order.deliveryMethod === "delivery" && (
            <div className="animate-in fade-in zoom-in-95 duration-500 space-y-4">
              <h3 className="font-heading text-xl uppercase text-white/90">Endereço de Entrega</h3>
              <div className="flex flex-col gap-3">
                <input type="text" placeholder="Rua" value={order.address.street} onChange={(e) => setOrder(p => ({ ...p, address: { ...p.address, street: e.target.value } }))} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary" />
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" placeholder="Número" value={order.address.number} onChange={(e) => setOrder(p => ({ ...p, address: { ...p.address, number: e.target.value } }))} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary col-span-1" />
                  <input type="text" placeholder="Bairro / Complemento" value={order.address.neighborhood} onChange={(e) => setOrder(p => ({ ...p, address: { ...p.address, neighborhood: e.target.value } }))} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary col-span-2" />
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    if (step.id === "summary") {
      return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <h3 className="font-heading text-2xl text-primary mb-4 uppercase">Itens Selecionados</h3>
            <ul className="flex flex-col gap-3">
              <li className="flex justify-between items-center text-white border-b border-white/5 pb-2"><span>{order.size?.name} + {order.flavor?.name}</span><span className="font-bold">R$ {order.size?.price.toFixed(2)}</span></li>
              {[...order.toppings, ...order.addons, ...order.creams, ...order.fruits, ...order.fillings].map((i) => (<li key={i.id} className="flex justify-between items-center text-white/70 text-sm"><span>{i.name}</span><span>R$ {i.price.toFixed(2)}</span></li>))}
              <li className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center"><span className="text-white/50 text-xs uppercase font-bold">Método: {order.deliveryMethod === "delivery" ? "Entrega" : "Retirada"}</span>{order.deliveryMethod === "delivery" && <span className="text-primary text-xs font-bold">+ R$ 7,00 Frete</span>}</li>
            </ul>
            <div className="mt-6 pt-4 border-t border-primary/30 flex justify-between items-center"><span className="font-heading text-3xl text-primary uppercase">Total</span><span className="font-heading text-4xl text-white">R$ {totalPrice.toFixed(2)}</span></div>
          </div>
          <button onClick={sendWhatsApp} className="self-end bg-[#25D366] text-white font-sans font-bold px-8 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#22c35e] shadow-sm"><Send size={18} />Finalizar</button>
        </div>
      );
    }
    const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const filteredData = step.data?.filter(i => normalize(i.name).includes(normalize(searchQuery)));
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
        {step.data && step.data.length > 6 && (
          <div className="relative"><input type="text" placeholder={`Buscar...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white focus:outline-none focus:border-primary" /></div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredData?.map((item) => {
            const cat = step.id as keyof OrderState;
            const val = order[cat];

            // Verificação segura para saber se o item está selecionado
            const sel = Array.isArray(val) 
              ? (val as MenuItem[]).some(i => i.id === item.id) 
              : (val as MenuItem)?.id === item.id;

            return (
              <button key={item.id} onClick={() => toggleItem(cat, item, step.multiple)} className={cn("relative flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 transition-all text-left", sel ? "bg-primary border-primary text-secondary shadow-lg" : "bg-white/5 border-white/10 text-white hover:border-primary/30")}>
                <div className="flex flex-col gap-1"><span className={cn("font-heading text-xl uppercase leading-none", sel ? "text-secondary" : "text-white")}>{item.name}</span>{item.price > 0 && <span className={cn("font-sans text-xs font-bold", sel ? "text-secondary/70" : "text-primary")}>+ R$ {item.price.toFixed(2)}</span>}</div>
                <div className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center", sel ? "bg-secondary border-secondary text-primary" : "border-white/20 text-transparent")}><Check size={16} strokeWidth={3} /></div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#3d1b34] flex items-center justify-center">
        <div className="text-primary font-heading text-2xl animate-pulse uppercase">Carregando Menu...</div>
      </div>
    );
  }

  return (
    <SmoothScrollProvider isDisabled={showCart}>
      <main className="min-h-screen bg-[#3d1b34] flex flex-col relative text-white">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] bg-black/40 rounded-full blur-[120px]" />
        </div>
        <header className="sticky top-0 z-40 bg-[#3d1b34]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentStep > 0 && <button onClick={handlePrev} className="p-2 text-white/70 hover:text-primary transition-colors"><ArrowLeft size={24} /></button>}
            <div className="flex items-center gap-3">
              <img src="/assets/Logo açai.webp" alt="Logo" className="w-10 h-10 object-contain mix-blend-screen" />
              <div className="hidden xs:block"><h1 className="font-heading text-xl text-primary uppercase">Monte seu Açaí</h1><p className="text-[10px] text-white/50 font-bold uppercase">Passo {currentStep + 1} de {STEPS.length}</p></div>
            </div>
          </div>
          <button onClick={() => setShowCart(true)} className="relative p-2"><ShoppingCart size={24} className="text-primary" /><div className="absolute -top-1 -right-1 bg-white text-secondary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg">{[...order.toppings, ...order.addons, ...order.creams, ...order.fruits, ...order.fillings].length + (order.size ? 1 : 0)}</div></button>
        </header>
        <div className={cn("fixed inset-0 z-[100] transition-all duration-500", showCart ? "visible" : "invisible pointer-events-none")}>
          <div className={cn("absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500", showCart ? "opacity-100" : "opacity-0")} onClick={() => setShowCart(false)} />
          <div className={cn("absolute right-0 top-0 h-full w-[85%] max-w-[400px] bg-[#3d1b34] shadow-2xl flex flex-col transition-transform duration-500", showCart ? "translate-x-0" : "translate-x-full")}>
            <div className="p-6 border-b border-white/10 flex items-center justify-between"><h3 className="font-heading text-2xl text-primary uppercase">Seu Pedido</h3><button onClick={() => setShowCart(false)} className="text-white/50"><ArrowRight size={24} /></button></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6" data-lenis-prevent>
              {[...order.toppings, ...order.addons, ...order.creams, ...order.fruits, ...order.fillings].length > 0 && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3"><Trash2 size={14} className="text-red-400" /><p className="text-[10px] text-red-100/80 font-bold uppercase">Segure a lixeira para apagar</p></div>}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-white/30 uppercase">Base</p>
                {order.size ? <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg"><span>{order.size.name}</span><span className="text-primary font-bold">R$ {order.size.price.toFixed(2)}</span></div> : <p className="text-sm text-white/20">Não selecionado</p>}
              </div>
              <div className="space-y-3 pt-4 border-t border-white/5">
                <p className="text-[10px] font-bold text-white/30 uppercase">Itens</p>
                {[...order.toppings, ...order.addons, ...order.creams, ...order.fruits, ...order.fillings].map(i => {
                  const cat = Object.keys(order).find(k => Array.isArray(order[k as keyof OrderState]) && (order[k as keyof OrderState] as MenuItem[]).some(item => item.id === i.id)) as keyof OrderState;
                  return (
                    <div key={i.id} className="relative flex justify-between items-center bg-white/5 p-3 rounded-xl overflow-hidden">
                      {deletingId === i.id && <div className="absolute inset-0 bg-red-500/20 z-0" style={{ width: `${deleteProgress}%` }} />}
                      <span className="text-sm z-10 flex-1">{i.name}</span>
                      <div className="flex items-center gap-3 z-10"><span className="text-xs text-white/40 italic">R$ {i.price.toFixed(2)}</span><button onMouseDown={() => startHold(cat, i.id)} onMouseUp={stopHold} onMouseLeave={stopHold} onTouchStart={() => startHold(cat, i.id)} onTouchEnd={stopHold} className={cn("bg-red-500/10 text-red-400 p-2 rounded-lg", deletingId === i.id && "bg-red-500/40 text-white")}><Trash2 size={16} /></button></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-6 bg-black/20 border-t border-white/10"><div className="flex justify-between items-end mb-6"><span className="text-xs font-bold text-white/50 uppercase">Total Atual</span><span className="font-heading text-4xl text-primary">R$ {totalPrice.toFixed(2)}</span></div><button onClick={() => setShowCart(false)} className="w-full bg-primary text-secondary font-heading text-xl py-4 rounded-xl">CONTINUAR</button></div>
          </div>
        </div>
        <div className="w-full h-1 bg-white/5 sticky top-[73px] z-40"><div className="h-full bg-primary shadow-[0_0_10px_#F6E632]" style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }} /></div>
        <div className="flex-1 max-w-[800px] mx-auto w-full p-6 pb-32 relative z-10"><h2 className="text-4xl font-heading text-white uppercase mb-8">{STEPS[currentStep].title}</h2>{renderStepContent()}</div>
        <footer className="fixed bottom-0 left-0 w-full z-50 bg-[#3d1b34]/95 border-t border-white/5 p-6 flex items-center justify-between"><div className="flex flex-col"><span className="text-xs text-white/50 uppercase font-bold">Total</span><span className="font-heading text-3xl text-white">R$ {totalPrice.toFixed(2)}</span></div><div className="flex gap-4">{currentStep < STEPS.length - 1 ? <button onClick={handleNext} disabled={!isStepValid()} className={cn("px-8 py-4 rounded-2xl font-heading text-xl flex items-center gap-2 transition-all", isStepValid() ? "bg-primary text-secondary" : "bg-white/5 text-white/20 cursor-not-allowed")}>PRÓXIMO <ArrowRight size={20} /></button> : <div className="flex items-center gap-2 text-primary font-heading uppercase text-sm"><span>Pronto</span><Check size={20} /></div>}</div></footer>
      </main>
    </SmoothScrollProvider>
  );
}
