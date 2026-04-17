"use client";

import React, { useState, useEffect, useMemo } from "react";
import { menuData, MenuItem } from "@/data/menu";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  ShoppingCart, 
  MessageCircle,
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
  { id: "toppings", title: "Coberturas (Opcional)", data: menuData.toppings, multiple: true },
  { id: "addons", title: "Adicionais (Opcional)", data: menuData.addons, multiple: true },
  { id: "creams", title: "Cremes (Opcional)", data: menuData.creams, multiple: true },
  { id: "fruits", title: "Frutas (Opcional)", data: menuData.fruits, multiple: true },
  { id: "fillings", title: "Recheios (Opcional)", data: menuData.fillings, multiple: true },
  { id: "summary", title: "Resumo do Pedido" },
];

export default function OrderPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [order, setOrder] = useState<OrderState>({
    size: null,
    flavor: null,
    toppings: [],
    addons: [],
    creams: [],
    fruits: [],
    fillings: [],
  });

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
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const toggleItem = (category: keyof OrderState, item: MenuItem, multiple = false) => {
    setOrder((prev) => {
      if (!multiple) {
        return { ...prev, [category]: prev[category]?.id === item.id ? null : item };
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
    if (currentStep === 0) return order.size !== null;
    if (currentStep === 1) return order.flavor !== null;
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

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
        {step.data?.map((item) => {
          const category = step.id as keyof OrderState;
          const isSelected = Array.isArray(order[category]) 
            ? (order[category] as MenuItem[]).some(i => i.id === item.id)
            : order[category]?.id === item.id;

          return (
            <button
              key={item.id}
              onClick={() => toggleItem(category, item, step.multiple)}
              className={cn(
                "relative flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left group overflow-hidden",
                isSelected 
                  ? "bg-primary border-primary text-secondary shadow-lg shadow-primary/20" 
                  : "bg-white/5 border-white/10 text-white hover:border-primary/50"
              )}
            >
              <div className="flex flex-col gap-1 relative z-10">
                <span className={cn(
                  "font-heading text-2xl uppercase leading-none",
                  isSelected ? "text-secondary" : "text-white"
                )}>{item.name}</span>
                {item.price > 0 && (
                  <span className={cn(
                    "font-sans text-sm font-bold",
                    isSelected ? "text-secondary/70" : "text-primary"
                  )}>+ R$ {item.price.toFixed(2)}</span>
                )}
              </div>
              
              <div className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                isSelected 
                  ? "bg-secondary border-secondary text-primary" 
                  : "border-white/20 text-transparent"
              )}>
                <Check size={20} strokeWidth={3} />
              </div>

              {/* Glass effect on select */}
              {isSelected && (
                <div className="absolute inset-0 bg-white/20 backdrop-blur-sm -z-0 animate-in fade-in duration-300" />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <SmoothScrollProvider>
      <main className="min-h-screen bg-secondary flex flex-col relative overflow-x-hidden">
        {/* Background Decorativo */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] bg-black/20 rounded-full blur-[120px]" />
        </div>

        {/* Header Fixo */}
        <header className="sticky top-0 z-40 bg-secondary/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-4">
            {currentStep > 0 && (
              <button 
                onClick={handlePrev}
                className="p-2 text-white/70 hover:text-primary transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <div>
              <h1 className="font-heading text-2xl text-primary leading-none uppercase">Monte seu Açaí</h1>
              <p className="font-sans text-xs text-white/50 font-bold uppercase tracking-widest mt-1">
                Passo {currentStep + 1} de {STEPS.length}
              </p>
            </div>
          </div>
          <div className="relative">
            <ShoppingCart size={24} className="text-primary" />
            <div className="absolute -top-2 -right-2 bg-white text-secondary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {[...order.toppings, ...order.addons, ...order.creams, ...order.fruits, ...order.fillings].length + (order.size ? 1 : 0)}
            </div>
          </div>
        </header>

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
        <footer className="fixed bottom-0 left-0 w-full z-50 bg-white/10 backdrop-blur-2xl border-t border-white/10 p-6 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
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
