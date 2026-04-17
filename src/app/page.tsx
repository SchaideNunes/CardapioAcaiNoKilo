"use client";

import React, { useState, useEffect, useMemo } from "react";
import { menuData, MenuItem } from "@/data/menu";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  ShoppingCart, 
  MessageCircle,
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
};

const STEPS = [
  { id: "size", title: "Escolha o Tamanho", data: menuData.sizes },
  { id: "flavor", title: "Escolha o Sabor", data: menuData.flavors },
  { id: "toppings", title: "Coberturas", data: menuData.toppings, multiple: true },
  { id: "addons", title: "Adicionais", data: menuData.addons, multiple: true },
  { id: "creams", title: "Cremes", data: menuData.creams, multiple: true },
  { id: "fruits", title: "Frutas", data: menuData.fruits, multiple: true },
  { id: "fillings", title: "Recheios", data: menuData.fillings, multiple: true },
  { id: "summary", title: "Resumo do Pedido" },
];

const WHATSAPP_PHONE = "5575991542626";

export default function OrderPage() {
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
  });

  // Estados para exclusão por "segurar"
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteProgress, setDeleteProgress] = useState(0);

  // Cálculo do total
  const totalPrice = useMemo(() => {
    let total = order.size?.price || 0;
    const additions = [
      ...order.toppings,
      ...order.addons,
      ...order.creams,
      ...order.fruits,
      ...order.fillings,
    ];
    total += additions.reduce((sum, item) => sum + item.price, 0);
    return total;
  }, [order]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setSearchQuery(""); // Limpar busca ao mudar de passo
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setSearchQuery(""); // Limpar busca ao mudar de passo
      window.scrollTo(0, 0);
    }
  };

  const toggleItem = (category: keyof OrderState, item: MenuItem, multiple = false) => {
    setOrder((prev) => {
      if (!multiple) {
        return { ...prev, [category]: item };
      }
      
      const currentItems = prev[category] as MenuItem[];
      const exists = currentItems.find((i) => i.id === item.id);
      
      if (exists) {
        return { ...prev, [category]: currentItems.filter((i) => i.id !== item.id) };
      } else {
        return { ...prev, [category]: [...currentItems, item] };
      }
    });
  };

  const removeItem = (category: keyof OrderState, itemId: string) => {
    setOrder(prev => {
      if (category === 'size' || category === 'flavor') return { ...prev, [category]: null };
      const currentItems = prev[category] as MenuItem[];
      return { ...prev, [category]: currentItems.filter(i => i.id !== itemId) };
    });
    // Limpar estados de deleção
    setDeletingId(null);
    setDeleteProgress(0);
  };

  const startHold = (category: keyof OrderState, itemId: string) => {
    setDeletingId(itemId);
    setDeleteProgress(0);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setDeleteProgress(progress);
      if (progress >= 100) clearInterval(interval);
    }, 100); // 1000ms / 10 passos = 100ms por passo

    const timer = setTimeout(() => {
      removeItem(category, itemId);
      clearInterval(interval);
    }, 1000);

    setHoldTimer(timer);
  };

  const stopHold = () => {
    if (holdTimer) clearTimeout(holdTimer);
    setHoldTimer(null);
    setDeletingId(null);
    setDeleteProgress(0);
  };

  const formatWhatsAppMessage = () => {
    if (!order.size || !order.flavor) return "";

    let message = `*NOVO PEDIDO DE AÇAÍ*\n\n`;
    message += `🍧 *Base:* ${order.size.name} (${order.flavor.name})\n`;
    
    if (order.toppings.length > 0) 
      message += `🍯 *Coberturas:* ${order.toppings.map(i => i.name).join(", ")}\n`;
    if (order.addons.length > 0) 
      message += `✨ *Adicionais:* ${order.addons.map(i => i.name).join(", ")}\n`;
    if (order.creams.length > 0) 
      message += `🍦 *Cremes:* ${order.creams.map(i => i.name).join(", ")}\n`;
    if (order.fruits.length > 0) 
      message += `🍓 *Frutas:* ${order.fruits.map(i => i.name).join(", ")}\n`;
    if (order.fillings.length > 0) 
      message += `🍫 *Recheios:* ${order.fillings.map(i => i.name).join(", ")}\n`;

    message += `\n💰 *Total:* R$ ${totalPrice.toFixed(2).replace(".", ",")}\n`;
    message += `\n📍 Aguardando confirmação de endereço para entrega.`;

    return encodeURIComponent(message);
  };

  const sendWhatsApp = () => {
    const phone = "5575991542626"; // Número fornecido no footer
    const url = `https://wa.me/${phone}?text=${formatWhatsAppMessage()}`;
    window.open(url, "_blank");
  };

  const isStepValid = () => {
    // Tamanho é obrigatório para qualquer passo a partir do 0
    if (!order.size) return false;
    // Sabor é obrigatório para qualquer passo a partir do 1
    if (currentStep >= 1 && !order.flavor) return false;
    return true;
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];
    
    if (step.id === "summary") {
      return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <h3 className="font-heading text-2xl text-primary mb-4 uppercase">Itens Selecionados</h3>
            <ul className="flex flex-col gap-3">
              <li className="flex justify-between items-center text-white border-b border-white/5 pb-2">
                <span>{order.size?.name} + {order.flavor?.name}</span>
                <span className="font-bold">R$ {order.size?.price.toFixed(2)}</span>
              </li>
              {[...order.toppings, ...order.addons, ...order.creams, ...order.fruits, ...order.fillings].map((item) => (
                <li key={item.id} className="flex justify-between items-center text-white/70 text-sm">
                  <span>{item.name}</span>
                  <span>R$ {item.price.toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-4 border-t border-primary/30 flex justify-between items-center">
              <span className="font-heading text-3xl text-primary uppercase">Total</span>
              <span className="font-heading text-4xl text-white">R$ {totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <button 
            onClick={sendWhatsApp}
            className="w-full bg-[#25D366] text-white font-heading text-2xl py-5 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
          >
            <MessageCircle size={28} />
            ENVIAR PARA WHATSAPP
          </button>
        </div>
      );
    }

    const normalize = (str: string) => 
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const filteredData = step.data?.filter(item => 
      normalize(item.name).includes(normalize(searchQuery))
    );

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
        {/* Barra de Pesquisa */}
        {step.data && step.data.length > 6 && (
          <div className="relative group">
            <input 
              type="text"
              placeholder={`Buscar em ${step.title.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 font-sans text-white focus:outline-none focus:border-primary transition-all placeholder:text-white/20"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest"
              >
                Limpar
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredData?.map((item) => {
            const category = step.id as keyof OrderState;
            const isSelected = Array.isArray(order[category]) 
              ? (order[category] as MenuItem[]).some(i => i.id === item.id)
              : order[category]?.id === item.id;

            return (
              <button
                key={item.id}
                onClick={() => toggleItem(category, item, step.multiple)}
                className={cn(
                  "relative flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 transition-all text-left group overflow-hidden",
                  isSelected 
                    ? "bg-primary border-primary text-secondary shadow-lg" 
                    : "bg-white/5 border-white/10 text-white hover:border-primary/30"
                )}
              >
                <div className="flex flex-col gap-1 relative z-10">
                  <span className={cn(
                    "font-heading text-xl uppercase leading-none",
                    isSelected ? "text-secondary" : "text-white"
                  )}>{item.name}</span>
                  {item.price > 0 && (
                    <span className={cn(
                      "font-sans text-xs font-bold",
                      isSelected ? "text-secondary/70" : "text-primary"
                    )}>+ R$ {item.price.toFixed(2)}</span>
                  )}
                </div>
                
                <div className={cn(
                  "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all relative z-10",
                  isSelected 
                    ? "bg-secondary border-secondary text-primary" 
                    : "border-white/20 text-transparent"
                )}>
                  <Check size={16} strokeWidth={3} />
                </div>
              </button>
            );
          })}
          
          {filteredData?.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <p className="text-white/40 font-sans italic">Nenhum ingrediente encontrado com "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <SmoothScrollProvider>
      <main className="min-h-screen bg-[#2a1224] flex flex-col relative overflow-x-hidden text-white">
        {/* Background Decorativo - Mais escuro e sutil */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] bg-black/40 rounded-full blur-[120px]" />
        </div>

        {/* Header Fixo */}
        <header className="sticky top-0 z-40 bg-[#2a1224]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-4">
            {currentStep > 0 && (
              <button 
                onClick={handlePrev}
                className="p-2 text-white/70 hover:text-primary transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <div className="flex items-center gap-3">
               <div className="relative w-10 h-10 flex items-center justify-center bg-transparent mix-blend-screen">
                  <img 
                    src="/assets/Logo açai.webp" 
                    alt="Logo Açaí" 
                    className="w-full h-full object-contain"
                  />
               </div>
               <div className="hidden xs:block">
                 <h1 className="font-heading text-xl text-primary leading-none uppercase">Monte seu Açaí</h1>
                 <p className="font-sans text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">
                   Passo {currentStep + 1} de {STEPS.length}
                 </p>
               </div>
            </div>
          </div>
          <button 
            onClick={() => setShowCart(true)}
            className="relative p-2 hover:bg-white/5 rounded-xl transition-colors group"
          >
            <ShoppingCart size={24} className="text-primary group-hover:scale-110 transition-transform" />
            <div className="absolute -top-1 -right-1 bg-white text-secondary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg border border-secondary/20">
              {[...order.toppings, ...order.addons, ...order.creams, ...order.fruits, ...order.fillings].length + (order.size ? 1 : 0)}
            </div>
          </button>
        </header>

        {/* Modal do Carrinho Lateral */}
        <div className={cn(
          "fixed inset-0 z-[100] transition-all duration-500",
          showCart ? "visible" : "invisible pointer-events-none"
        )}>
          <div 
            className={cn("absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500", showCart ? "opacity-100" : "opacity-0")}
            onClick={() => setShowCart(false)}
          />
          <div className={cn(
            "absolute right-0 top-0 h-full w-[85%] max-w-[400px] bg-[#2a1224] shadow-2xl flex flex-col transition-transform duration-500 ease-out border-l border-white/10",
            showCart ? "translate-x-0" : "translate-x-full"
          )}>
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="font-heading text-2xl text-primary uppercase leading-none">Seu Pedido</h3>
                <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest mt-1 italic">Segure a lixeira para apagar</span>
              </div>
              <button onClick={() => setShowCart(false)} className="text-white/50 hover:text-white transition-colors">
                 <ArrowRight size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Seção Base */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Base do Açaí</p>
                {order.size ? (
                   <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                      <span className="text-sm font-bold">{order.size.name}</span>
                      <span className="text-primary font-bold">R$ {order.size.price.toFixed(2)}</span>
                   </div>
                ) : <p className="text-sm text-white/20 italic">Tamanho não selecionado</p>}
                
                {order.flavor ? (
                   <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                      <span className="text-sm font-bold">{order.flavor.name}</span>
                      <span className="text-white/40 text-xs">Grátis</span>
                   </div>
                ) : <p className="text-sm text-white/20 italic">Sabor não selecionado</p>}
              </div>

              {/* Seção Adicionais */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Complementos</p>
                <div className="space-y-2">
                  {[...order.toppings, ...order.addons, ...order.creams, ...order.fruits, ...order.fillings].length > 0 ? (
                    [...order.toppings, ...order.addons, ...order.creams, ...order.fruits, ...order.fillings].map(item => (
                      <div key={item.id} className="flex justify-between items-center group">
                        <span className="text-sm text-white/80">{item.name}</span>
                        <div className="flex items-center gap-3">
                           <span className="text-xs text-white/40 italic">R$ {item.price.toFixed(2)}</span>
                           <button 
                            onMouseDown={() => {
                              const category = Object.keys(order).find(key => {
                                const val = order[key as keyof OrderState];
                                return Array.isArray(val) && val.some(i => i.id === item.id);
                              });
                              if (category) startHold(category as keyof OrderState, item.id);
                            }}
                            onMouseUp={stopHold}
                            onMouseLeave={stopHold}
                            onTouchStart={() => {
                              const category = Object.keys(order).find(key => {
                                const val = order[key as keyof OrderState];
                                return Array.isArray(val) && val.some(i => i.id === item.id);
                              });
                              if (category) startHold(category as keyof OrderState, item.id);
                            }}
                            onTouchEnd={stopHold}
                            className={cn(
                              "relative bg-red-500/10 text-red-400 p-2 rounded-lg transition-all overflow-hidden",
                              deletingId === item.id ? "scale-110 bg-red-500/20" : ""
                            )}
                            title="Segure para remover"
                           >
                             <Trash2 size={16} className="relative z-10" /> 
                             {deletingId === item.id && (
                               <div 
                                 className="absolute bottom-0 left-0 h-full bg-red-500/40 transition-all duration-100 ease-linear"
                                 style={{ width: `${deleteProgress}%` }}
                               />
                             )}
                           </button>
                        </div>
                      </div>
                    ))
                  ) : <p className="text-sm text-white/20 italic">Nenhum adicional escolhido</p>}
                </div>
              </div>
            </div>

            <div className="p-6 bg-black/20 border-t border-white/10">
               <div className="flex justify-between items-end mb-6">
                  <span className="text-xs font-bold text-white/50 uppercase">Total Atual</span>
                  <span className="font-heading text-4xl text-primary leading-none tracking-tighter">R$ {totalPrice.toFixed(2)}</span>
               </div>
               <button 
                onClick={() => setShowCart(false)}
                className="w-full bg-primary text-secondary font-heading text-xl py-4 rounded-xl active:scale-95 transition-all shadow-lg"
               >
                 CONTINUAR MONTANDO
               </button>
            </div>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full h-1 bg-white/5 sticky top-[73px] z-40">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_#F6E632]"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Conteúdo Central */}
        <div className="flex-1 max-w-[800px] mx-auto w-full p-6 pb-32 relative z-10">
          <div className="mb-8">
            <h2 className="text-4xl md:text-5xl font-heading text-white uppercase leading-none mb-2">
              {STEPS[currentStep].title}
            </h2>
            <div className="w-12 h-1 bg-primary rounded-full" />
          </div>

          {renderStepContent()}
        </div>

        {/* Barra Inferior (Carrinho e Botões) */}
        <footer className="fixed bottom-0 left-0 w-full z-50 bg-[#2a1224]/95 backdrop-blur-2xl border-t border-white/5 p-6 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col">
            <span className="font-sans text-xs text-white/50 uppercase font-bold tracking-wider">Total estimado</span>
            <span className="font-heading text-3xl text-white leading-none">R$ {totalPrice.toFixed(2)}</span>
          </div>

          <div className="flex gap-4">
            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className={cn(
                  "px-8 py-4 rounded-2xl font-heading text-xl flex items-center gap-2 transition-all active:scale-95 shadow-xl",
                  isStepValid() 
                    ? "bg-primary text-secondary" 
                    : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                )}
              >
                PRÓXIMO 
                <ArrowRight size={20} />
              </button>
            ) : (
              <div className="flex items-center gap-2 text-primary font-heading uppercase text-sm">
                 <span>Pedido Pronto</span>
                 <Check size={20} />
              </div>
            )}
          </div>
        </footer>
      </main>
    </SmoothScrollProvider>
  );
}
