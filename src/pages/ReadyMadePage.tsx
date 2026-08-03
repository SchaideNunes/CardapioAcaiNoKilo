import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShoppingCart, Send, Check, Trash2, Plus, Minus } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PAYMENT_LABELS = { pix: "Pix", card: "Cartão", cash: "Dinheiro" };

type ReadyProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
};

const READY_MADE_PRODUCTS: ReadyProduct[] = [
  { id: "500ml_acai_natural", name: "Açaí Natural 500ml", price: 18.00, image: "/assets/500ml_acai_natural.webp" },
  { id: "500ml_acai_banana", name: "Açaí c/ Banana 500ml", price: 20.00, image: "/assets/500ml_acai_banana.webp" },
  { id: "500ml_acai_morango", name: "Açaí c/ Morango 500ml", price: 22.00, image: "/assets/500ml_acai_morango.webp" },
  { id: "500ml_acai_cupuacu", name: "Açaí c/ Cupuaçu 500ml", price: 22.00, image: "/assets/500ml_acai_cupuacu.webp" },

  { id: "1l_acai_zero", name: "Açaí Zero Açúcar 1L", price: 38.00, image: "/assets/1l_acai_zero.webp" },
  { id: "1l_acai_banana", name: "Açaí c/ Banana 1L", price: 35.00, image: "/assets/1l_acai_banana.webp" },
  { id: "1l_acai_morango", name: "Açaí c/ Morango 1L", price: 38.00, image: "/assets/1l_acai_morango.webp" },

  { id: "1l_creme_abacaxi_vinho", name: "Creme de Abacaxi ao Vinho 1L", price: 40.00, image: "/assets/1l_creme_abacaxi_vinho.webp" },
  { id: "1l_creme_doce_de_leite", name: "Creme Doce de Leite 1L", price: 40.00, image: "/assets/1l_creme_doce_de_leite.webp" },
  { id: "1l_creme_grego_amarena", name: "Creme Iogurte Grego com Amarena 1L", price: 45.00, image: "/assets/1l_creme_grego_amarena.webp" },
  { id: "1l_creme_moranto_zero", name: "Creme de Morango Zero 1L", price: 42.00, image: "/assets/1l_creme_moranto_zero.webp" },

  { id: "2l_acai_natural", name: "Açaí Natural 2L", price: 55.00, image: "/assets/2l_acai_natural.webp" },
  { id: "2l_acai_banana", name: "Açaí c/ Banana 2L", price: 60.00, image: "/assets/2l_acai_banana.webp" },
];

type CartItem = ReadyProduct & { qty: number };

export default function ReadyMadePage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  // Checkout state
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery" | null>(null);
  const [address, setAddress] = useState({ street: "", number: "", neighborhood: "" });
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | "cash" | null>(null);
  const [changeFor, setChangeFor] = useState("");

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
  const totalPrice = cartTotal + (deliveryMethod === "delivery" ? 7.00 : 0);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);

  const addToCart = (product: ReadyProduct) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.id !== productId) return i;
        const newQty = i.qty + delta;
        return newQty > 0 ? { ...i, qty: newQty } : i;
      }).filter(i => i.qty > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.id !== productId));
  };

  const getQty = (productId: string) => {
    return cart.find(i => i.id === productId)?.qty || 0;
  };

  const isCheckoutValid = () => {
    if (cart.length === 0) return false;
    if (!deliveryMethod) return false;
    if (deliveryMethod === "delivery" && (!address.street.trim() || !address.number.trim() || !address.neighborhood.trim())) return false;
    if (!paymentMethod) return false;
    if (paymentMethod === "cash") {
      if (!changeFor) return false;
      if (changeFor !== "Não preciso") {
        const changeValue = parseFloat(changeFor);
        if (isNaN(changeValue) || changeValue < totalPrice) return false;
      }
    }
    return true;
  };

  const formatWhatsAppMessage = () => {
    if (cart.length === 0) return "";
    let message = `*NOVO PEDIDO (PRONTO)*\n\n`;
    cart.forEach(item => {
      message += `*${item.qty}x* ${item.name} — R$ ${(item.price * item.qty).toFixed(2).replace(".", ",")}\n`;
    });
    message += `\n*Entrega:* ${deliveryMethod === "delivery" ? "Receber em casa" : "Retirar na loja"}\n`;
    if (deliveryMethod === "delivery") message += `*Endereço:* ${address.street}, ${address.number} - ${address.neighborhood}\n`;
    message += `\n*Pagamento:* ${paymentMethod ? PAYMENT_LABELS[paymentMethod] : "Não definido"}\n`;
    if (paymentMethod === "cash" && changeFor) {
      message += changeFor === "Não preciso" ? `*Troco:* Não preciso\n` : `*Troco para:* R$ ${changeFor}\n`;
    }
    message += `\n*TOTAL: R$ ${totalPrice.toFixed(2).replace(".", ",")}*`;
    return encodeURIComponent(message);
  };

  const handleFinish = () => {
    window.open(`https://wa.me/557591585290?text=${formatWhatsAppMessage()}`, "_blank");
  };

  return (
    <SmoothScrollProvider isDisabled={showCart || showCheckout}>
      <main className="min-h-screen bg-[#3d1b34] flex flex-col relative text-white">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#3d1b34]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 text-white/70 hover:text-primary transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div className="flex items-center gap-3">
              <img src="/assets/Logo açai.webp" alt="Logo" className="w-10 h-10 object-contain mix-blend-screen" />
              <h1 className="font-heading text-xl text-primary uppercase">Comprar Pronto</h1>
            </div>
          </div>
          <button onClick={() => setShowCart(true)} className="relative p-2">
            <ShoppingCart size={24} className="text-primary" />
            <div className="absolute -top-1 -right-1 bg-white text-secondary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
              {cartCount}
            </div>
          </button>
        </header>

        {/* Cart Drawer - Same style as OrderPage */}
        <div className={cn("fixed inset-0 z-[100] transition-all duration-500", showCart ? "visible" : "invisible pointer-events-none")}>
          <div className={cn("absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500", showCart ? "opacity-100" : "opacity-0")} onClick={() => setShowCart(false)} />
          <div className={cn("absolute right-0 top-0 h-full w-[85%] max-w-[400px] bg-[#3d1b34] shadow-2xl flex flex-col transition-transform duration-500", showCart ? "translate-x-0" : "translate-x-full")}>
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-heading text-2xl text-primary uppercase">Seu Pedido</h3>
              <button onClick={() => setShowCart(false)} className="text-white/50"><ArrowRight size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4" data-lenis-prevent>
              {cart.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-8">Nenhum produto adicionado</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-xl">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{item.name}</p>
                      <p className="text-primary font-heading text-sm">R$ {(item.price * item.qty).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors">
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-bold w-5 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="p-6 bg-black/20 border-t border-white/10">
              <div className="flex justify-between items-end mb-6">
                <span className="text-xs font-bold text-white/50 uppercase">Total Atual</span>
                <span className="font-heading text-4xl text-primary">R$ {cartTotal.toFixed(2)}</span>
              </div>
              <button
                onClick={() => { setShowCart(false); setShowCheckout(true); }}
                disabled={cart.length === 0}
                className={cn(
                  "w-full font-heading text-xl py-4 rounded-xl transition-all uppercase",
                  cart.length > 0 ? "bg-primary text-secondary" : "bg-white/5 text-white/20 cursor-not-allowed"
                )}
              >
                FINALIZAR PEDIDO
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 max-w-[1000px] mx-auto w-full p-4 sm:p-6 pb-32">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {READY_MADE_PRODUCTS.map((product) => {
              const sel = getQty(product.id) > 0;
              return (
                <button
                  key={product.id}
                  onClick={() => sel ? removeFromCart(product.id) : addToCart(product)}
                  className={cn(
                    "relative flex flex-col items-center p-3 sm:p-5 rounded-2xl transition-all duration-300 text-center border-0",
                    sel ? "bg-primary/20 text-secondary shadow-lg scale-[1.02] border-primary/50" : "bg-white/5 text-white hover:bg-white/10"
                  )}
                >
                  <div className={cn(
                    "absolute top-2 right-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    sel ? "bg-primary border-primary text-secondary" : "border-white/20 text-transparent"
                  )}>
                    <Check size={14} strokeWidth={4} />
                  </div>
                  
                  <div className="w-full aspect-square mb-3 flex items-center justify-center overflow-hidden rounded-xl bg-black/20">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                  </div>
                  
                  <h3 className={cn("font-heading text-sm sm:text-lg uppercase leading-tight mb-1", sel ? "text-primary" : "text-white")}>
                    {product.name}
                  </h3>
                  <span className={cn("font-heading text-base sm:text-xl", sel ? "text-primary" : "text-primary")}>
                    R$ {product.price.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom bar */}
        {cartCount > 0 && (
          <footer className="fixed bottom-0 left-0 w-full z-50 bg-[#3d1b34] border-t border-white/5 p-4 sm:p-6 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col">
              <span className="text-[10px] text-white/50 uppercase font-bold">{cartCount} {cartCount === 1 ? 'item' : 'itens'}</span>
              <span className="font-heading text-2xl sm:text-3xl text-white">R$ {cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCart(true)} className="px-4 py-3 sm:px-6 sm:py-4 rounded-xl bg-white/10 text-white font-heading text-base sm:text-lg hover:bg-white/20 transition-all uppercase flex items-center gap-2">
                <ShoppingCart size={18} /> Ver
              </button>
              <button
                onClick={() => setShowCheckout(true)}
                className="px-5 py-3 sm:px-8 sm:py-4 rounded-xl bg-primary text-secondary font-heading text-base sm:text-lg transition-all uppercase flex items-center gap-2 active:scale-95"
              >
                Finalizar <ArrowRight size={18} />
              </button>
            </div>
          </footer>
        )}

        {/* Checkout Modal */}
        {showCheckout && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowCheckout(false)} />
            <div className="relative w-full max-w-lg bg-[#3d1b34] rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="font-heading text-2xl text-primary uppercase mb-1">Finalizar Pedido</h2>
                  <p className="text-white/50 text-sm">{cartCount} {cartCount === 1 ? 'produto' : 'produtos'}</p>
                </div>
                <span className="font-heading text-2xl text-white">R$ {totalPrice.toFixed(2)}</span>
              </div>

              {/* Items summary */}
              <div className="space-y-2 mb-6 bg-white/5 rounded-xl p-4">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-start gap-3 text-sm border-b border-white/5 last:border-0 pb-2 last:pb-0">
                    <span className="text-white/70 leading-tight flex-1">
                      <span className="font-bold text-white mr-1">{item.qty}x</span> 
                      {item.name}
                    </span>
                    <span className="text-white/50 font-bold whitespace-nowrap">
                      R$ {(item.price * item.qty).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Delivery Section */}
              <div className="space-y-4 mb-8">
                <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest">1. Entrega</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setDeliveryMethod("pickup")} className={cn("relative flex flex-col items-center justify-center p-4 rounded-xl transition-all border-0", deliveryMethod === "pickup" ? "bg-primary text-secondary shadow-lg" : "bg-white/5 text-white hover:bg-white/10")}>
                    <ShoppingCart size={24} className="mb-2" />
                    <span className="font-heading text-sm uppercase">Retirar</span>
                  </button>
                  <button onClick={() => setDeliveryMethod("delivery")} className={cn("relative flex flex-col items-center justify-center p-4 rounded-xl transition-all border-0", deliveryMethod === "delivery" ? "bg-primary text-secondary shadow-lg" : "bg-white/5 text-white hover:bg-white/10")}>
                    <Send size={24} className="mb-2" />
                    <span className="font-heading text-sm uppercase">Receber</span>
                  </button>
                </div>

                {deliveryMethod === "delivery" && (
                  <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95">
                    <input type="text" placeholder="Rua" value={address.street} onChange={(e) => setAddress(p => ({ ...p, street: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary" />
                    <div className="grid grid-cols-3 gap-3">
                      <input type="text" placeholder="Número" value={address.number} onChange={(e) => setAddress(p => ({ ...p, number: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary col-span-1" />
                      <input type="text" placeholder="Bairro / Complemento" value={address.neighborhood} onChange={(e) => setAddress(p => ({ ...p, neighborhood: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary col-span-2" />
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Section */}
              <div className="space-y-4 mb-8">
                <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest">2. Pagamento</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => setPaymentMethod("pix")} className={cn("relative flex flex-col items-center justify-center p-4 rounded-xl transition-all border-0", paymentMethod === "pix" ? "bg-primary text-secondary shadow-lg" : "bg-white/5 text-white hover:bg-white/10")}>
                    <img src="/assets/pix.png" alt="Pix" className="w-8 h-8 object-contain mb-2" />
                    <span className="font-heading text-xs uppercase">Pix</span>
                  </button>
                  <button onClick={() => setPaymentMethod("card")} className={cn("relative flex flex-col items-center justify-center p-4 rounded-xl transition-all border-0", paymentMethod === "card" ? "bg-primary text-secondary shadow-lg" : "bg-white/5 text-white hover:bg-white/10")}>
                    <img src="/assets/card.png" alt="Cartão" className="w-6 h-6 object-contain mb-3" />
                    <span className="font-heading text-xs uppercase">Cartão</span>
                  </button>
                  <button onClick={() => setPaymentMethod("cash")} className={cn("relative flex flex-col items-center justify-center p-4 rounded-xl transition-all border-0", paymentMethod === "cash" ? "bg-primary text-secondary shadow-lg" : "bg-white/5 text-white hover:bg-white/10")}>
                    <img src="/assets/Dinheiro.webp" alt="Dinheiro" className="w-6 h-6 object-contain mb-3" />
                    <span className="font-heading text-xs uppercase">Dinheiro</span>
                  </button>
                </div>

                {paymentMethod === "cash" && (
                  <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95">
                    <input type="number" placeholder="Troco para quanto?" value={changeFor === "Não preciso" ? "" : changeFor} onChange={(e) => setChangeFor(e.target.value)} disabled={changeFor === "Não preciso"} className={cn("w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary text-center text-lg font-bold placeholder:text-white/20", changeFor === "Não preciso" && "opacity-20")} />
                    <button onClick={() => setChangeFor(p => p === "Não preciso" ? "" : "Não preciso")} className="flex items-center justify-center gap-2 py-2">
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", changeFor === "Não preciso" ? "bg-primary border-primary" : "border-white/20")}>{changeFor === "Não preciso" && <Check size={10} className="text-secondary" strokeWidth={4} />}</div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Não preciso de troco</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setShowCheckout(false)} className="flex-1 py-4 rounded-xl bg-white/10 text-white font-heading text-lg hover:bg-white/20 transition-all uppercase">Voltar</button>
                <button onClick={handleFinish} disabled={!isCheckoutValid()} className={cn("flex-[2] py-4 rounded-xl font-heading text-lg flex items-center justify-center gap-2 transition-all uppercase", isCheckoutValid() ? "bg-[#25D366] text-[#3d1b34] hover:bg-[#22c35e] shadow-lg active:scale-95" : "bg-white/5 text-white/20 cursor-not-allowed")}>
                  <Send size={20} /> Enviar Pedido
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </SmoothScrollProvider>
  );
}
