import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { MenuItem, menuData as localFallbackData } from "@/data/menu";
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

const PAYMENT_LABELS = { pix: "Pix", card: "Cartão", cash: "Dinheiro" };

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
  const [apiData, setApiData] = useState<MenuData | null>(localFallbackData);
  const loading = false; // Em modo demo, inicia carregado
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
        if (data && data.sizes) {
          setApiData(data);
        }
      })
      .catch(() => {
        console.log("Modo Demo: Usando dados locais do arquivo menu.ts");
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const allSelectedItems = useMemo(() => [
    ...order.toppings, ...order.addons, ...order.creams, ...order.fruits, ...order.fillings
  ], [order.toppings, order.addons, order.creams, order.fruits, order.fillings]);

  const totalPrice = useMemo(() => {
    let total = order.size?.price || 0;
    total += allSelectedItems.reduce((sum, item) => sum + item.price, 0);
    if (order.deliveryMethod === "delivery") total += 7.00;
    return total;
  }, [order.size, order.deliveryMethod, allSelectedItems]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
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
    setDeletingId(null);
    if (holdTimer) clearTimeout(holdTimer);
  };

  const handleDeleteClick = (category: keyof OrderState, itemId: string) => {
    if (deletingId === itemId) {
      removeItem(category, itemId);
    } else {
      setDeletingId(itemId);
      if (holdTimer) clearTimeout(holdTimer);
      const timer = setTimeout(() => {
        setDeletingId(null);
      }, 3000);
      setHoldTimer(timer);
    }
  };

  const formatWhatsAppMessage = () => {
    if (!order.size || !order.flavor) return "";
    let message = `*NOVO PEDIDO*\n\n*Tamanho:* ${order.size.name} (${order.flavor.name})\n`;
    const items = allSelectedItems.map(i => i.name).join(", ");
    if (items) message += `*Recheios:* ${items}\n`;
    message += `\n*Entrega:* ${order.deliveryMethod === "delivery" ? "Receber em casa" : "Retirar na loja"}\n`;
    if (order.deliveryMethod === "delivery") message += `*Endereço:* ${order.address.street}, ${order.address.number} - ${order.address.neighborhood}\n`;
    message += `\n*Pagamento:* ${order.paymentMethod ? PAYMENT_LABELS[order.paymentMethod] : "Não definido"}\n`;
    if (order.paymentMethod === "cash" && order.changeFor) {
      message += order.changeFor === "Não preciso" ? `*Troco:* Não preciso\n` : `*Troco para:* R$ ${order.changeFor}\n`;
    }
    message += `\n*TOTAL: R$ ${totalPrice.toFixed(2).replace(".", ",")}*`;
    return encodeURIComponent(message);
  };

  const sendWhatsApp = async () => {
    // Primeiro salva no banco de dados para o Admin Panel
    try {
      await fetch("http://localhost:3001/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...order,
          total: totalPrice,
          items: allSelectedItems.map(i => i.name)
        })
      });
    } catch (e) {
      console.error("Erro ao salvar pedido no banco, mas enviando WhatsApp...", e);
    }

    // Depois abre o WhatsApp
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
      if (order.paymentMethod === "cash") {
        if (!order.changeFor) return false;
        if (order.changeFor !== "Não preciso") {
          const changeValue = parseFloat(order.changeFor);
          if (isNaN(changeValue) || changeValue < totalPrice) return false;
        }
      }
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
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
            <h3 className="font-heading text-3xl text-primary mb-6 uppercase tracking-wide border-b border-primary/20 pb-4">Resumo do Pedido</h3>
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Tamanho escolhido</p>
                <div className="flex justify-between items-end gap-4">
                  <span className="text-xl font-heading text-white uppercase">{order.size?.name} + {order.flavor?.name}</span>
                  <div className="flex-1 border-b border-dashed border-white/10 mb-1.5" />
                  <span className="text-xl font-heading text-primary whitespace-nowrap">R$ {order.size?.price.toFixed(2)}</span>
                </div>
              </div>

              {(allSelectedItems.length > 0) && (
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Complementos</p>
                  <ul className="flex flex-col gap-3">
                    {allSelectedItems.map((i) => (
                      <li key={i.id} className="flex justify-between items-end gap-4 group">
                        <span className="text-white/80 text-sm font-medium">{i.name}</span>
                        <div className="flex-1 border-b border-dotted border-white/5 mb-1 opacity-50" />
                        <span className="text-white font-heading text-sm whitespace-nowrap">R$ {i.price.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/50 uppercase font-bold tracking-wider">Método</span>
                  <span className="text-white font-bold">{order.deliveryMethod === "delivery" ? "🚀 Entrega" : "🛍️ Retirada"}</span>
                </div>
                {order.deliveryMethod === "delivery" && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/50 uppercase font-bold tracking-wider">Frete</span>
                    <span className="text-primary font-bold">+ R$ 7,00</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/50 uppercase font-bold tracking-wider">Pagamento</span>
                  <span className="text-white font-bold uppercase">
                    {order.paymentMethod ? PAYMENT_LABELS[order.paymentMethod] : 'Não definido'}
                  </span>
                </div>
              </div>
            </div>
          </div>
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
        <div className={cn(
          "grid gap-3 lg:gap-4",
          step.id === 'size'
            ? "grid-cols-2 gap-3 sm:gap-6 lg:gap-6"
            : "grid-cols-1 sm:grid-cols-2"
        )}>
          {filteredData?.map((item) => {
            const cat = step.id as keyof OrderState;
            const val = order[cat];
            const sel = Array.isArray(val)
              ? (val as MenuItem[]).some(i => i.id === item.id)
              : (val as MenuItem)?.id === item.id;

            return (
              <button
                key={item.id}
                onClick={() => toggleItem(cat, item, step.multiple)}
                className={cn(
                  "group relative flex items-center justify-between transition-all duration-300 text-left border overflow-hidden cursor-pointer rounded-2xl",
                  step.id === 'size'
                    ? "p-4 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl flex-col sm:flex-row gap-3 sm:gap-0"
                    : "p-3.5 sm:p-4",
                  sel
                    ? "bg-primary/[0.08] border-primary/80 shadow-md shadow-primary/5"
                    : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20 hover:-translate-y-0.5"
                )}
              >
                <div className={cn("flex items-center gap-3.5 w-full", step.id === 'size' ? "flex-col sm:flex-row text-center sm:text-left gap-3 sm:gap-5" : "")}>
                  <div className={cn(
                    "overflow-hidden flex-shrink-0 flex items-center justify-center transition-transform duration-500",
                    step.id === 'size'
                      ? "w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-2xl sm:rounded-3xl bg-black/20 border border-white/5 shadow-inner group-hover:scale-105"
                      : "w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-black/20 border border-white/5 p-1 shadow-sm"
                  )}>
                    <img
                      src={
                        item.id === "pot_360" ? "/assets/items/Açai_350ml.webp" :
                          item.id === "pot_500" ? "/assets/items/Açai_500ml.webp" :
                            item.id === "pot_750" ? "/assets/items/Açai_750ml.webp" :
                              item.id === "pot_1l" ? "/assets/items/POTE_LITRO.webp" :
                                `/assets/items/${item.id}.webp`
                      }
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=3d1b34&color=D8AC4F&font-size=0.33&bold=true`;
                      }}
                      className={cn(
                        "w-full h-full object-cover transition-transform duration-500",
                        step.id !== 'size' && "scale-110 group-hover:scale-125"
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className={cn(
                      "truncate transition-colors",
                      step.id === 'size'
                        ? "font-heading uppercase text-xl sm:text-2xl lg:text-3xl text-white tracking-wide"
                        : "font-sans font-normal text-sm sm:text-[15px] text-white/90",
                      sel && "text-white"
                    )}>
                      {item.name}
                    </span>
                    {step.id === 'size' && (
                      <span className="font-heading text-base sm:text-xl text-primary tracking-wide">
                        R$ {item.price.toFixed(2)}
                      </span>
                    )}
                    {item.price > 0 && step.id !== 'size' && (
                      <span className="font-heading text-xs sm:text-sm text-primary tracking-wide">
                        + R$ {item.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <div className={cn(
                  "rounded-full border flex items-center justify-center flex-shrink-0 ml-2 transition-all duration-300",
                  step.id === 'size' ? "absolute top-3 right-3 sm:static sm:top-auto sm:right-auto w-6 h-6 sm:w-7 sm:h-7" : "w-5 h-5",
                  sel
                    ? "bg-primary border-primary text-secondary shadow-sm"
                    : "border-white/20 text-transparent group-hover:border-white/40"
                )}>
                  <Check size={step.id === 'size' ? 12 : 11} strokeWidth={3} />
                </div>
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
        <header className="sticky top-0 z-40 bg-[#3d1b34]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentStep > 0 ? <button onClick={handlePrev} className="p-2 text-white/70 hover:text-primary transition-colors"><ArrowLeft size={24} /></button> : <Link to="/" className="p-2 text-white/70 hover:text-primary transition-colors"><ArrowLeft size={24} /></Link>}
            <div className="flex items-center gap-3">
              <img src="/assets/Logo açai.webp" alt="Logo" className="w-10 h-10 object-contain mix-blend-screen" />
              <div className="hidden xs:block"><h1 className="font-heading text-xl text-primary uppercase">Monte seu Açaí</h1><p className="text-[10px] text-white/50 font-bold uppercase">Passo {currentStep + 1} de {STEPS.length}</p></div>
            </div>
          </div>
          <button onClick={() => setShowCart(true)} className="relative p-2"><ShoppingCart size={24} className="text-primary" /><div className="absolute -top-1 -right-1 bg-white text-secondary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg">{allSelectedItems.length + (order.size ? 1 : 0)}</div></button>
        </header>
        <div className={cn("fixed inset-0 z-[100] transition-all duration-500", showCart ? "visible" : "invisible pointer-events-none")}>
          <div className={cn("absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500", showCart ? "opacity-100" : "opacity-0")} onClick={() => setShowCart(false)} />
          <div className={cn("absolute right-0 top-0 h-full w-[85%] max-w-[400px] bg-[#3d1b34] shadow-2xl flex flex-col transition-transform duration-500", showCart ? "translate-x-0" : "translate-x-full")}>
            <div className="p-6 border-b border-white/10 flex items-center justify-between"><h3 className="font-heading text-2xl text-primary uppercase">Seu Pedido</h3><button onClick={() => setShowCart(false)} className="text-white/50"><ArrowRight size={24} /></button></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6" data-lenis-prevent>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-white/30 uppercase">Tamanho</p>
                {order.size ? <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg"><span>{order.size.name}</span><span className="text-primary font-bold">R$ {order.size.price.toFixed(2)}</span></div> : <p className="text-sm text-white/20">Não selecionado</p>}
              </div>
              <div className="space-y-3 pt-4 border-t border-white/5">
                <p className="text-[10px] font-bold text-white/30 uppercase">Recheios</p>
                {allSelectedItems.map(i => {
                  const cat = Object.keys(order).find(k => Array.isArray(order[k as keyof OrderState]) && (order[k as keyof OrderState] as MenuItem[]).some(item => item.id === i.id)) as keyof OrderState;
                  return (
                    <div key={i.id} className={cn("relative flex justify-between items-center p-3 rounded-xl overflow-hidden border transition-all", deletingId === i.id ? "bg-red-500/10 border-red-500/30" : "bg-white/5 border-white/5")}>
                      <span className={cn("text-sm z-10 flex-1 transition-all", deletingId === i.id ? "text-red-300" : "text-white")}>
                        {deletingId === i.id ? "Confirmar exclusão?" : i.name}
                      </span>
                      <div className="flex items-center gap-3 z-10">
                        {deletingId !== i.id && <span className="text-xs text-white/40 italic">R$ {i.price.toFixed(2)}</span>}
                        <button
                          onClick={() => handleDeleteClick(cat, i.id)}
                          className={cn(
                            "p-2 rounded-lg transition-all font-bold text-xs flex items-center gap-2",
                            deletingId === i.id ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] px-4" : "bg-red-500/10 text-red-400"
                          )}
                        >
                          {deletingId === i.id ? "SIM" : <Trash2 size={16} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-6 bg-black/20 border-t border-white/10"><div className="flex justify-between items-end mb-6"><span className="text-xs font-bold text-white/50 uppercase">Total Atual</span><span className="font-heading text-4xl text-primary">R$ {totalPrice.toFixed(2)}</span></div><button onClick={() => setShowCart(false)} className="w-full bg-primary text-secondary font-heading text-xl py-4 rounded-xl">CONTINUAR</button></div>
          </div>
        </div>
        {/* Desktop Step Trail / Horizontal Stepper */}
        <div className="w-full bg-[#3d1b34]/90 backdrop-blur-md border-b border-white/5 sticky top-[73px] z-30 hidden lg:block">
          <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            {STEPS.map((s, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    // Only allow jumping back or to reachable steps if valid
                    if (idx < currentStep) {
                      setCurrentStep(idx);
                      window.scrollTo(0, 0);
                    }
                  }}
                  disabled={idx > currentStep}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-sans font-normal transition-all whitespace-nowrap border-0",
                    isCurrent ? "bg-primary text-secondary font-semibold shadow-sm scale-105" :
                    isPast ? "bg-white/10 text-white/80 hover:bg-white/15 cursor-pointer" :
                    "bg-white/[0.02] text-white/30 cursor-not-allowed"
                  )}
                >
                  <span className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-sans font-bold",
                    isCurrent ? "bg-secondary text-primary" :
                    isPast ? "bg-primary text-secondary" :
                    "bg-white/10 text-white/40"
                  )}>
                    {isPast ? <Check size={8} strokeWidth={3} /> : idx + 1}
                  </span>
                  <span>{s.title.replace('Escolha o ', '')}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Progress Line */}
        <div className="w-full h-1 bg-white/5 sticky top-[73px] z-40 lg:hidden"><div className="h-full bg-primary shadow-lg shadow-black/40" style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }} /></div>

        {/* Responsive Main Layout: 2 Columns on Desktop (lg+), 1 Column on Mobile */}
        <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-32 lg:pb-12 flex-1 flex flex-col lg:flex-row gap-8 items-start relative z-10">
          
          {/* Left Column: Interactive Selection Area */}
          <div className="flex-1 w-full min-w-0">
            <div key={currentStep} className="animate-in fade-in slide-in-from-right-4 duration-300 ease-out">
              <div className="flex flex-col mb-6 lg:mb-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading text-white uppercase">{STEPS[currentStep].title}</h2>
                  <span className="text-xs font-normal text-white/40 uppercase tracking-widest hidden sm:inline-block">
                    Passo {currentStep + 1} de {STEPS.length}
                  </span>
                </div>
                {STEPS[currentStep].multiple && (
                  <p className="text-xs sm:text-sm text-white/60 font-sans mt-1">
                    Você pode escolher múltiplos itens nesta etapa.
                  </p>
                )}
              </div>
              {renderStepContent()}
            </div>
          </div>

          {/* Right Column: Permanent Sticky Desktop Summary Sidebar */}
          <aside className="hidden lg:flex w-[380px] xl:w-[420px] sticky top-36 shrink-0 flex-col gap-4">
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col">
              
              {/* Sidebar Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="font-heading text-2xl text-primary uppercase tracking-wide">Seu Açaí</h3>
                <span className="text-xs font-normal font-sans px-2.5 py-1 rounded-full bg-white/10 text-white/80">
                  {allSelectedItems.length + (order.size ? 1 : 0)} {allSelectedItems.length + (order.size ? 1 : 0) === 1 ? 'item' : 'itens'}
                </span>
              </div>

              {/* Cup Visual Preview & Base Info */}
              <div className="py-4 border-b border-white/10 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-2 overflow-hidden shrink-0 shadow-inner">
                  <img
                    src={
                      order.size?.id === "pot_360" ? "/assets/items/Açai_350ml.webp" :
                      order.size?.id === "pot_500" ? "/assets/items/Açai_500ml.webp" :
                      order.size?.id === "pot_750" ? "/assets/items/Açai_750ml.webp" :
                      order.size?.id === "pot_1l" ? "/assets/items/POTE_LITRO.webp" :
                      "/assets/Acai_montar.webp"
                    }
                    alt="Preview Açaí"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-heading text-white uppercase truncate">
                    {order.size ? order.size.name : "Tamanho não escolhido"}
                  </p>
                  <p className="text-xs font-sans text-primary font-normal truncate mt-0.5">
                    {order.flavor ? `Sabor: ${order.flavor.name}` : "Selecione o sabor"}
                  </p>
                  {order.size && (
                    <p className="text-xs font-sans text-white/40 mt-0.5">Base: R$ {order.size.price.toFixed(2)}</p>
                  )}
                </div>
              </div>

              {/* Selected Complements Scrollable List */}
              <div className="py-4 max-h-[260px] overflow-y-auto space-y-2 no-scrollbar">
                <p className="text-[10px] font-normal text-white/40 uppercase tracking-[0.15em] mb-2">Complementos Escolhidos</p>
                {allSelectedItems.length === 0 ? (
                  <p className="text-xs text-white/30 italic py-2">Nenhum complemento adicionado ainda</p>
                ) : (
                  allSelectedItems.map(i => {
                    const cat = Object.keys(order).find(k => Array.isArray(order[k as keyof OrderState]) && (order[k as keyof OrderState] as MenuItem[]).some(item => item.id === i.id)) as keyof OrderState;
                    return (
                      <div
                        key={i.id}
                        className={cn(
                          "relative flex justify-between items-center p-2.5 rounded-xl border transition-all overflow-hidden",
                          deletingId === i.id
                            ? "bg-red-500/10 border-red-500/30"
                            : "bg-white/[0.02] hover:bg-white/[0.05] border-white/5"
                        )}
                      >
                        <span className={cn(
                          "text-xs font-normal truncate flex-1 pr-2 transition-all",
                          deletingId === i.id ? "text-red-300" : "text-white/90"
                        )}>
                          {deletingId === i.id ? "Confirmar exclusão?" : i.name}
                        </span>
                        <div className="flex items-center gap-2 shrink-0 z-10">
                          {deletingId !== i.id && (
                            <span className="text-xs font-heading text-primary font-normal">
                              {i.price > 0 ? `+ R$ ${i.price.toFixed(2)}` : 'Grátis'}
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteClick(cat, i.id)}
                            className={cn(
                              "p-1.5 rounded-lg transition-all font-bold text-xs flex items-center gap-1",
                              deletingId === i.id
                                ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] px-3 py-1"
                                : "text-white/30 hover:text-red-400 hover:bg-red-500/10"
                            )}
                            title={deletingId === i.id ? "Confirmar exclusão" : "Remover item"}
                          >
                            {deletingId === i.id ? "SIM" : <Trash2 size={13} />}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Subtotal & Total */}
              <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
                {order.deliveryMethod === "delivery" && (
                  <div className="flex justify-between items-center text-xs text-white/60">
                    <span>Taxa de Entrega</span>
                    <span className="text-primary font-normal">+ R$ 7,00</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Total Geral</span>
                  <span className="font-heading text-3xl xl:text-4xl text-primary leading-none">
                    R$ {totalPrice.toFixed(2)}
                  </span>
                </div>

                {/* Main Action Button */}
                <div className="mt-3">
                  {currentStep < STEPS.length - 1 ? (
                    <button
                      onClick={handleNext}
                      disabled={!isStepValid()}
                      className={cn(
                        "w-full py-4 rounded-2xl font-heading text-xl flex items-center justify-center gap-2 transition-all uppercase shadow-lg active:scale-98",
                        isStepValid() ? "bg-primary text-secondary hover:bg-[#ebd936] cursor-pointer" : "bg-white/5 text-white/20 cursor-not-allowed"
                      )}
                    >
                      PRÓXIMO PASSO <ArrowRight size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={sendWhatsApp}
                      className="w-full py-4 bg-[#25D366] text-[#3d1b34] font-heading text-xl rounded-2xl flex items-center justify-center gap-2 hover:bg-[#22c35e] transition-all shadow-lg active:scale-98 uppercase"
                    >
                      <Send size={18} /> FINALIZAR NO WHATSAPP
                    </button>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Mobile Sticky Footer (Hidden on Desktop) */}
        <footer className="fixed bottom-0 left-0 w-full z-50 bg-[#3d1b34] border-t border-white/5 p-4 sm:p-6 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.5)] lg:hidden">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/50 uppercase font-bold">Total</span>
            <span className="font-heading text-2xl sm:text-3xl text-white">R$ {totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex gap-4">
            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className={cn(
                  "px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-heading text-lg sm:text-xl flex items-center gap-2 transition-all uppercase",
                  isStepValid() ? "bg-primary text-secondary" : "bg-white/5 text-white/20 cursor-not-allowed"
                )}
              >
                PRÓXIMO <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={sendWhatsApp}
                className="px-6 sm:px-8 py-3.5 sm:py-4 bg-[#25D366] text-[#3d1b34] font-heading text-lg sm:text-xl rounded-2xl flex items-center gap-2 hover:bg-[#22c35e] transition-all shadow-lg active:scale-95 uppercase"
              >
                <Send size={18} /> Finalizar
              </button>
            )}
          </div>
        </footer>
      </main>
    </SmoothScrollProvider>
  );
}
