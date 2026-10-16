import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Banknote, Bike, Check, CreditCard, Minus, Plus, QrCode, Send, ShoppingBag, Store, Trash2, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import { saveOrder } from "@/lib/orders";
import { buildCheckoutSection, buildWhatsAppUrl, deliveryFee, formatBRL, openWhatsApp, DELIVERY_FEE } from "@/lib/whatsapp";
import { readCachedMenuItems } from "@/lib/menuCache";
import { readyMadeProducts } from "@/data/menu";
import type { MenuItemRecord, ReadyProduct } from "@/types/menu";
import { apiUrl } from "@/lib/api";
import { useEscapeKey } from "@/lib/useEscapeKey";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type CartItem = ReadyProduct & { qty: number };

// Contorno, foco e estados dos blocos chapados (mesmos do /montar; ver DESIGN.md)
const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F0DF58]";
const tileBase = "border-2 transition-colors duration-200 ease-out";
const tileIdle = "bg-[#2f1729] border-white/10 hover:border-white/30";
const tileOn = "bg-[#F0DF58] border-[#120714] text-[#120714]";

function toReadyProduct(item: MenuItemRecord): ReadyProduct {
  return {
    id: item.id || item._id,
    name: item.name,
    price: item.price,
    image: item.image || "/assets/500ml_acai_natural.webp",
    imageScale: "scale-100"
  };
}

export default function ReadyMadePage() {
  const [products, setProducts] = useState<ReadyProduct[]>(() => {
    const readyItems = readCachedMenuItems()
      .filter(i => i.original_category === 'ready_made' && i.active !== false);
    return readyItems.length > 0 ? readyItems.map(toReadyProduct) : readyMadeProducts;
  });

  useEffect(() => {
    fetch(apiUrl("/api/menu"))
      .then(res => res.json())
      .then(data => {
        if (data && data.ready_made && data.ready_made.length > 0) {
          setProducts(data.ready_made.map(toReadyProduct));
        }
      })
      .catch(() => {});
  }, []);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  // Esc fecha a camada de cima: o checkout primeiro, depois o carrinho
  useEscapeKey(showCheckout, () => setShowCheckout(false));
  useEscapeKey(showCart && !showCheckout, () => setShowCart(false));

  // Checkout state
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery" | null>(null);
  const [address, setAddress] = useState({ street: "", number: "", neighborhood: "" });
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | "cash" | null>(null);
  const [changeFor, setChangeFor] = useState("");
  const [isSending, setIsSending] = useState(false);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
  const totalPrice = cartTotal + deliveryFee(deliveryMethod);
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
      message += `*${item.qty}x* ${item.name} — ${formatBRL(item.price * item.qty)}\n`;
    });
    return message + buildCheckoutSection({ deliveryMethod, address, paymentMethod, changeFor }, totalPrice);
  };

  const handleFinish = () => {
    if (isSending) return;
    setIsSending(true);
    // Dispara o salvamento para o Admin Panel antes de abrir o WhatsApp. A abertura não espera a
    // resposta para continuar dentro do clique: Safari/iOS bloqueia pop-ups abertos depois de um await.
    saveOrder({
      origin: "ready_made",
      items: cart.map(item => `${item.qty}x ${item.name}`),
      total: totalPrice,
      deliveryMethod,
      paymentMethod,
      address: deliveryMethod === "delivery" ? address : undefined,
      changeFor: paymentMethod === "cash" ? changeFor : undefined,
    }).finally(() => setIsSending(false));
    openWhatsApp(buildWhatsAppUrl(formatWhatsAppMessage()));
  };

  // Itens do carrinho: usado na folha (celular) e no painel lateral (desktop)
  const renderCartItems = () => (
    <ul className="flex flex-col divide-y-2 divide-white/10">
      {cart.map(item => (
        <li key={item.id} className="flex items-start gap-3 py-3">
          <img src={item.image} alt="" className="h-14 w-14 shrink-0 rounded-2xl bg-[#3a1d33] object-cover" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 text-[15px] font-bold leading-tight">{item.name}</p>
              <p className="whitespace-nowrap font-heading text-lg leading-none text-[#F0DF58]">{formatBRL(item.price * item.qty)}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => updateQty(item.id, -1)}
                  aria-label={`Diminuir ${item.name}`}
                  className={cn("grid h-11 w-11 place-items-center rounded-full border-2 border-white/20 text-white hover:border-white/50", focusRing)}
                >
                  <Minus size={16} />
                </button>
                <span className="w-6 text-center font-heading text-xl" aria-label={`${item.qty} unidades`}>{item.qty}</span>
                <button
                  onClick={() => updateQty(item.id, 1)}
                  aria-label={`Aumentar ${item.name}`}
                  className={cn("grid h-11 w-11 place-items-center rounded-full border-2 border-white/20 text-white hover:border-white/50", focusRing)}
                >
                  <Plus size={16} />
                </button>
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                aria-label={`Remover ${item.name}`}
                title="Remover"
                className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full text-white/50 hover:text-[#F58220]", focusRing)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );

  const cartLabel = cartCount === 1 ? "1 item" : `${cartCount} itens`;

  return (
    <SmoothScrollProvider isDisabled={showCart || showCheckout}>
      <main className="relative flex min-h-[100dvh] flex-col bg-[#241220] text-white lining-nums tabular-nums selection:bg-[#F0DF58] selection:text-[#120714]">
        <h1 className="sr-only">Comprar Pronto</h1>

        {/* Topo fixo: voltar, logo e total */}
        <header className="sticky top-0 z-40 border-b-2 border-[#120714] bg-[#241220]">
          <div className="mx-auto flex w-full max-w-[1280px] items-center gap-3 px-4 py-3 sm:px-6">
            <Link to="/" aria-label="Voltar para o início" className={cn("grid h-11 w-11 place-items-center rounded-full border-2 border-white/20 text-white hover:border-white/40", focusRing)}>
              <ArrowLeft size={20} />
            </Link>
            <img src="/assets/Logo açai.webp" alt="Açaí no Kilo" className="h-12 w-auto object-contain" />
            <button
              onClick={() => setShowCart(true)}
              aria-label={`Ver seu pedido: ${cartLabel}, total ${formatBRL(cartTotal)}`}
              className={cn("ml-auto flex h-11 items-center gap-2 rounded-full border-2 border-[#120714] bg-[#F0DF58] pl-1.5 pr-4 text-[#120714] lg:hidden", focusRing)}
            >
              <span className="flex h-7 items-center gap-1 rounded-full bg-[#120714] px-2 text-[#F0DF58]">
                <ShoppingBag size={14} strokeWidth={2.5} />
                <span className="text-xs font-bold">{cartCount}</span>
              </span>
              <span key={cartTotal} className="anim-pop font-heading text-2xl leading-none">{formatBRL(cartTotal)}</span>
            </button>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[1280px] flex-1 items-start gap-8 px-4 pb-36 pt-6 sm:px-6 lg:pb-12">
          {/* Grade de produtos */}
          <section className="w-full min-w-0 flex-1">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-heading text-[clamp(3rem,12vw,4.75rem)] leading-[0.9]">Açaís Prontos</h2>
                <p className="mt-3 text-[15px] text-white/75">Toque nos potes para montar o seu pedido.</p>
              </div>
              <span className="hidden shrink-0 text-sm font-bold text-white/60 sm:inline">{products.length} produtos</span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-4">
              {products.map((product) => {
                const qty = getQty(product.id);
                const sel = qty > 0;
                const sizeMatch = product.name.match(/(500ml|1L|2L)/i);
                const size = sizeMatch ? sizeMatch[0] : "Açaí";
                const cleanName = product.name.replace(/(500ml|1L|2L)/i, "").trim();

                return (
                  <button
                    key={product.id}
                    onClick={() => sel ? removeFromCart(product.id) : addToCart(product)}
                    aria-pressed={sel}
                    className={cn("relative flex h-full flex-col overflow-hidden rounded-[28px] text-left", tileBase, sel ? tileOn : tileIdle, focusRing)}
                  >
                    {/* Tamanho (canto superior esquerdo) */}
                    <span className="absolute left-3 top-3 z-10 rounded-full border-2 border-[#120714] bg-[#F8EEA6] px-2.5 py-0.5 text-[11px] font-bold uppercase text-[#120714]">
                      {size}
                    </span>
                    {/* Adicionar / escolhido (canto superior direito) */}
                    <span className={cn(
                      "absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border-2 border-[#120714]",
                      sel ? "anim-pop bg-[#F0DF58] text-[#120714]" : "bg-white text-[#120714]"
                    )}>
                      {sel ? <Check size={18} strokeWidth={3.5} /> : <Plus size={18} strokeWidth={3} />}
                    </span>

                    <span className="block aspect-[4/5] w-full overflow-hidden bg-[#3a1d33]">
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className={cn("h-full w-full object-cover", product.imageScale || "scale-100")}
                      />
                    </span>

                    <span className="flex flex-1 flex-col gap-1 px-3.5 pb-3.5 pt-3">
                      <span className="text-[14px] font-bold leading-tight" title={cleanName}>{cleanName}</span>
                      <span className={cn("font-heading text-[22px] leading-none", sel ? "text-[#120714]" : "text-[#F0DF58]")}>
                        {formatBRL(product.price)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Desktop: carrinho em painel chapado */}
          <aside className="sticky top-24 hidden w-[360px] shrink-0 flex-col gap-4 rounded-[28px] border-2 border-white/10 bg-[#2f1729] p-5 lg:flex xl:w-[400px]">
            <div className="flex items-baseline justify-between">
              <h3 className="font-heading text-[34px] leading-none text-[#F0DF58]">Seu Carrinho</h3>
              {cartCount > 0 && <span className="text-sm font-bold text-white/70">{cartLabel}</span>}
            </div>
            {cart.length === 0 ? (
              <div className="flex flex-col items-center gap-2 border-y-2 border-white/10 py-10 text-center">
                <ShoppingBag size={28} className="text-white/40" />
                <p className="text-[15px] font-bold text-white/70">Nenhum produto adicionado</p>
                <p className="text-sm text-white/60">Toque em um pote ao lado para adicionar.</p>
              </div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto border-y-2 border-white/10 pr-1" data-lenis-prevent>{renderCartItems()}</div>
            )}
            <div className="flex items-center justify-between rounded-2xl border-2 border-[#120714] bg-[#F0DF58] px-4 py-3 text-[#120714]">
              <span className="font-heading text-2xl leading-none">Total</span>
              <span className="font-heading text-4xl leading-none">{formatBRL(cartTotal)}</span>
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              disabled={cart.length === 0}
              className={cn(
                "flex h-14 items-center justify-center gap-2 rounded-full border-2 font-heading text-[26px] transition-colors",
                cart.length > 0 ? "border-[#120714] bg-[#F0DF58] text-[#120714] hover:bg-[#F8EEA6]" : "cursor-not-allowed border-white/10 bg-white/[0.06] text-white/40",
                focusRing
              )}
            >
              Finalizar pedido <ArrowRight size={22} strokeWidth={2.5} />
            </button>
          </aside>
        </div>

        {/* Celular: barra fixa com total e ações */}
        {cartCount > 0 && (
          <footer className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-[#120714] bg-[#2f1729] pb-[max(env(safe-area-inset-bottom),12px)] pt-3 animate-in slide-in-from-bottom-4 duration-300 lg:hidden">
            <div className="mx-auto flex w-full max-w-[680px] items-center gap-3 px-4 sm:px-6">
              <div className="flex min-w-0 flex-col">
                <span className="text-xs font-bold text-white/70">{cartLabel}</span>
                <span className="whitespace-nowrap font-heading text-[28px] leading-none">{formatBRL(cartTotal)}</span>
              </div>
              <button
                onClick={() => setShowCart(true)}
                className={cn("ml-auto flex h-14 min-w-14 items-center justify-center gap-2 rounded-full border-2 border-white/25 px-4 font-heading text-[22px] text-white hover:border-white/50 xs:px-5", focusRing)}
              >
                <ShoppingBag size={18} aria-hidden /> <span className="sr-only xs:not-sr-only">Ver</span>
              </button>
              <button
                onClick={() => setShowCheckout(true)}
                className={cn("flex h-14 items-center gap-2 rounded-full border-2 border-[#120714] bg-[#F0DF58] px-5 font-heading text-[22px] text-[#120714] hover:bg-[#F8EEA6]", focusRing)}
              >
                Finalizar <ArrowRight size={20} strokeWidth={2.5} />
              </button>
            </div>
          </footer>
        )}

        {/* Folha "Seu pedido" (celular) */}
        {showCart && (
          <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-labelledby="ready-cart-title">
            <button className="absolute inset-0 bg-[#120714]/75" aria-label="Fechar" onClick={() => setShowCart(false)} />
            <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[85dvh] w-full max-w-[680px] flex-col rounded-t-[32px] bg-[#241220] animate-in slide-in-from-bottom duration-300 ease-out">
              <div className="flex items-center justify-between px-5 pb-2 pt-5">
                <h3 id="ready-cart-title" className="font-heading text-[34px] leading-none text-[#F0DF58]">Seu Pedido</h3>
                <button autoFocus onClick={() => setShowCart(false)} aria-label="Fechar carrinho" className={cn("grid h-11 w-11 place-items-center rounded-full border-2 border-white/20", focusRing)}>
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-4" data-lenis-prevent>
                {cart.length === 0 ? <p className="py-6 text-center text-white/60">Nenhum produto adicionado.</p> : renderCartItems()}
              </div>
              <div className="border-t-2 border-[#120714] bg-[#2f1729] px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-4">
                <div className="mb-3 flex items-baseline justify-between">
                  <span className="font-heading text-2xl">Total</span>
                  <span className="font-heading text-4xl text-[#F0DF58]">{formatBRL(cartTotal)}</span>
                </div>
                <button
                  onClick={() => { setShowCart(false); setShowCheckout(true); }}
                  disabled={cart.length === 0}
                  className={cn(
                    "h-14 w-full rounded-full border-2 font-heading text-[26px]",
                    cart.length > 0 ? "border-[#120714] bg-[#F0DF58] text-[#120714] hover:bg-[#F8EEA6]" : "cursor-not-allowed border-white/10 bg-white/[0.06] text-white/40",
                    focusRing
                  )}
                >
                  Finalizar pedido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Checkout */}
        {showCheckout && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
            <button className="absolute inset-0 bg-[#120714]/75" aria-label="Fechar" onClick={() => setShowCheckout(false)} />
            <div className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[32px] border-2 border-white/10 bg-[#241220] p-5 sm:rounded-[32px] sm:p-7 animate-in slide-in-from-bottom duration-300 ease-out">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 id="checkout-title" className="font-heading text-[clamp(2rem,9vw,2.5rem)] leading-[0.9]">Finalizar Pedido</h2>
                  <p className="mt-2 text-sm text-white/70">{cartCount} {cartCount === 1 ? "produto" : "produtos"}</p>
                </div>
                <span className="whitespace-nowrap font-heading text-[clamp(1.5rem,7vw,2rem)] leading-none text-[#F0DF58]">{formatBRL(totalPrice)}</span>
              </div>

              {/* Resumo dos itens */}
              <ul className="mb-6 flex flex-col gap-2 rounded-[24px] border-2 border-white/10 bg-[#2f1729] p-4">
                {cart.map(item => (
                  <li key={item.id} className="flex items-baseline justify-between gap-3 text-[15px]">
                    <span className="text-white/85"><span className="font-bold text-white">{item.qty}x</span> {item.name}</span>
                    <span className="whitespace-nowrap font-heading text-lg">{formatBRL(item.price * item.qty)}</span>
                  </li>
                ))}
              </ul>

              {/* Entrega */}
              <section className="mb-6 flex flex-col gap-3">
                <h3 className="font-heading text-[28px] leading-none">1. Entrega</h3>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { id: "pickup", label: "Retirar", sub: "Grátis", Icon: Store },
                    { id: "delivery", label: "Receber", sub: `+ ${formatBRL(DELIVERY_FEE)}`, Icon: Bike },
                  ] as const).map(({ id, label, sub, Icon }) => {
                    const sel = deliveryMethod === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setDeliveryMethod(id)}
                        aria-pressed={sel}
                        className={cn("flex flex-col items-start gap-3 rounded-[24px] p-4 text-left xs:flex-row xs:items-center", tileBase, sel ? tileOn : tileIdle, focusRing)}
                      >
                        <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full border-2", sel ? "border-[#120714]" : "border-white/20 text-[#F0DF58]")}>
                          <Icon size={20} strokeWidth={2.25} />
                        </span>
                        <span className="flex flex-col">
                          <span className="font-heading text-[26px] leading-none">{label}</span>
                          <span className={cn("text-xs font-bold", sel ? "text-[#120714]/75" : "text-[#F58220]")}>{sub}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {deliveryMethod === "delivery" && (
                  <div className="grid grid-cols-1 gap-3 xs:grid-cols-3 animate-in fade-in duration-300">
                    {([
                      { key: "street", label: "Rua", placeholder: "Rua", span: "xs:col-span-3" },
                      { key: "number", label: "Número", placeholder: "Número", span: "xs:col-span-1" },
                      { key: "neighborhood", label: "Bairro / Complemento", placeholder: "Bairro / Complemento", span: "xs:col-span-2" },
                    ] as const).map(field => (
                      <label key={field.key} className={cn("flex flex-col gap-1.5", field.span)}>
                        <span className="text-sm font-bold text-white/80">{field.label}</span>
                        <input
                          type="text"
                          placeholder={field.placeholder}
                          value={address[field.key]}
                          onChange={(e) => setAddress(p => ({ ...p, [field.key]: e.target.value }))}
                          className="h-12 w-full rounded-2xl border-2 border-white/10 bg-[#2f1729] px-4 text-[16px] text-white placeholder:text-white/35 caret-[#F0DF58] transition-colors focus:border-[#F0DF58] focus:outline-none"
                        />
                      </label>
                    ))}
                  </div>
                )}
              </section>

              {/* Pagamento */}
              <section className="mb-7 flex flex-col gap-3">
                <h3 className="font-heading text-[28px] leading-none">2. Pagamento</h3>
                <div className="grid grid-cols-3 gap-2.5">
                  {([
                    { id: "pix", label: "Pix", Icon: QrCode },
                    { id: "card", label: "Cartão", Icon: CreditCard },
                    { id: "cash", label: "Dinheiro", Icon: Banknote },
                  ] as const).map(opt => {
                    const sel = paymentMethod === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setPaymentMethod(opt.id)}
                        aria-pressed={sel}
                        className={cn("flex flex-col items-center gap-2 rounded-[24px] px-2 py-4", tileBase, sel ? tileOn : tileIdle, focusRing)}
                      >
                        <span className={cn("grid h-11 w-11 place-items-center rounded-full border-2", sel ? "border-[#120714]" : "border-white/20 text-[#F0DF58]")}>
                          <opt.Icon size={20} strokeWidth={2.25} />
                        </span>
                        <span className="font-heading text-[22px] leading-none">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {paymentMethod === "cash" && (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-bold text-white/80">Troco para quanto?</span>
                      <span className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#F0DF58]">R$</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder="Troco para quanto?"
                          value={changeFor === "Não preciso" ? "" : changeFor}
                          onChange={(e) => setChangeFor(e.target.value)}
                          disabled={changeFor === "Não preciso"}
                          className="h-12 w-full rounded-2xl border-2 border-white/10 bg-[#2f1729] pl-12 pr-4 text-[16px] font-bold text-white placeholder:font-normal placeholder:text-white/35 caret-[#F0DF58] transition-colors focus:border-[#F0DF58] focus:outline-none disabled:opacity-40"
                        />
                      </span>
                    </label>
                    {changeFor && changeFor !== "Não preciso" && parseFloat(changeFor) < totalPrice && (
                      <p className="text-sm font-bold text-[#F58220]">O valor precisa ser maior que o total de {formatBRL(totalPrice)}.</p>
                    )}
                    <button
                      onClick={() => setChangeFor(p => p === "Não preciso" ? "" : "Não preciso")}
                      aria-pressed={changeFor === "Não preciso"}
                      className={cn(
                        "flex h-12 items-center justify-center gap-2 self-start rounded-full border-2 px-5 text-sm font-bold",
                        changeFor === "Não preciso" ? "border-[#120714] bg-[#F0DF58] text-[#120714]" : "border-white/20 text-white hover:border-white/40",
                        focusRing
                      )}
                    >
                      {changeFor === "Não preciso" && <Check size={16} strokeWidth={3} />}
                      Não preciso de troco
                    </button>
                  </div>
                )}
              </section>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCheckout(false)}
                  aria-label="Voltar ao carrinho"
                  className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-white/25 text-white hover:border-white/50", focusRing)}
                >
                  <ArrowLeft size={22} strokeWidth={2.5} />
                </button>
                <button
                  onClick={handleFinish}
                  disabled={!isCheckoutValid() || isSending}
                  aria-busy={isSending}
                  className={cn(
                    "flex h-14 flex-1 items-center justify-center gap-2 rounded-full border-2 font-heading text-[26px] transition-colors",
                    isCheckoutValid() && !isSending ? "border-[#120714] bg-[#25D366] text-[#120714]" : "cursor-not-allowed border-white/10 bg-white/[0.06] text-white/40",
                    focusRing
                  )}
                >
                  <Send size={20} strokeWidth={2.5} /> {isSending ? "Enviando..." : "Enviar Pedido"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </SmoothScrollProvider>
  );
}
