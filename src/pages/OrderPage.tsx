import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { menuData as localFallbackData } from "@/data/menu";
import type { MenuData, MenuItem } from "@/types/menu";
import { groupBuilderMenu, normalizeMenuData, readCachedMenuItems } from "@/lib/menuCache";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Bike,
  Check,
  CreditCard,
  QrCode,
  Search,
  Send,
  ShoppingBag,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import { saveOrder, PAYMENT_LABELS } from "@/lib/orders";
import { buildCheckoutSection, buildWhatsAppUrl, deliveryFee, formatBRL, openWhatsApp, DELIVERY_FEE } from "@/lib/whatsapp";
import { apiUrl } from "@/lib/api";

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

// Nome curto de cada etapa, usado no botão "Próximo: …"
const SHORT_TITLES: Record<string, string> = {
  size: "Tamanho",
  flavor: "Sabor",
  toppings: "Coberturas",
  addons: "Adicionais",
  creams: "Cremes",
  fruits: "Frutas",
  fillings: "Recheios",
  delivery: "Entrega",
  payment: "Pagamento",
  summary: "Resumo",
};

// Fotos dos potes: os arquivos pot_*.webp estão vazios, então os tamanhos usam as fotos dos copos
const SIZE_IMAGES: Record<string, string> = {
  pot_360: "/assets/items/Açai_350ml.webp",
  pot_500: "/assets/items/Açai_500ml.webp",
  pot_750: "/assets/items/Açai_750ml.webp",
  pot_1l: "/assets/items/POTE_LITRO.webp",
};

const sizeImage = (item: MenuItem | null) => (item && SIZE_IMAGES[item.id]) || "/assets/Acai_montar.webp";

const fallbackAvatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2f1729&color=F0DF58&font-size=0.33&bold=true`;

// Separa a porção do fim do nome ("Calda 50ml" → "Calda" + "50ml") só para exibição
const splitPortion = (fullName: string) => {
  const match = fullName.match(/^(.*\S)\s+(\d+\s?ml)$/i);
  return match ? { name: match[1], portion: match[2] } : { name: fullName, portion: "" };
};

const normalizeSearch = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

// Contorno, cápsula e foco compartilhados pelos controles chapados
const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F0DF58]";
const tileBase = "border-2 transition-colors duration-200 ease-out";
const tileIdle = "bg-[#2f1729] border-white/10 hover:border-white/30";
const tileOn = "bg-[#F0DF58] border-[#120714] text-[#120714]";

export default function OrderPage() {
  const [apiData, setApiData] = useState<MenuData | null>(() => {
    const cached = readCachedMenuItems();
    return cached.length > 0 ? groupBuilderMenu(cached) : localFallbackData;
  });
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
    fetch(apiUrl("/api/menu"))
      .then(res => res.json())
      .then(data => {
        const menu = normalizeMenuData(data);
        if (menu) setApiData(menu);
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
  const [isSending, setIsSending] = useState(false);

  const allSelectedItems = useMemo(() => [
    ...order.toppings, ...order.addons, ...order.creams, ...order.fruits, ...order.fillings
  ], [order.toppings, order.addons, order.creams, order.fruits, order.fillings]);

  const totalPrice = useMemo(() => {
    let total = order.size?.price || 0;
    total += allSelectedItems.reduce((sum, item) => sum + item.price, 0);
    total += deliveryFee(order.deliveryMethod);
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
    return message + buildCheckoutSection(order, totalPrice);
  };

  const sendWhatsApp = () => {
    if (isSending) return;
    setIsSending(true);
    // Dispara o salvamento para o Admin Panel antes de abrir o WhatsApp. A abertura não espera a
    // resposta para continuar dentro do clique: Safari/iOS bloqueia pop-ups abertos depois de um await.
    saveOrder({
      ...order,
      origin: "custom",
      total: totalPrice,
      // Tamanho e sabor entram na lista para aparecerem no admin e no ranking dos relatórios
      items: [order.size, order.flavor, ...allSelectedItems].filter((i): i is MenuItem => !!i).map(i => i.name)
    }).finally(() => setIsSending(false));
    openWhatsApp(buildWhatsAppUrl(formatWhatsAppMessage()));
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

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const nextIndex = step.id === "delivery" && order.deliveryMethod === "pickup" ? currentStep + 2 : currentStep + 1;
  const nextTitle = SHORT_TITLES[STEPS[nextIndex]?.id] ?? "";
  const stepValid = isStepValid();
  const itemCount = allSelectedItems.length + (order.size ? 1 : 0);

  const categoryOf = (item: MenuItem) =>
    (Object.keys(order) as (keyof OrderState)[]).find(k =>
      Array.isArray(order[k]) && (order[k] as MenuItem[]).some(i => i.id === item.id)
    ) as keyof OrderState;

  const goToStep = (idx: number) => {
    if (idx < currentStep) {
      setCurrentStep(idx);
      setSearchQuery("");
      window.scrollTo(0, 0);
    }
  };

  const stepHint = () => {
    if (step.id === "size") return "Toque no pote que você quer.";
    if (step.id === "flavor") return order.size ? `Para o seu ${order.size.name}.` : "Toque para escolher um.";
    if (step.multiple) return "Escolha quantos quiser — ou pule esta etapa.";
    if (step.id === "delivery") return "Como o açaí chega até você?";
    if (step.id === "payment") return "Você paga na entrega.";
    return "Confira tudo antes de enviar para a loja.";
  };

  // ---------- Etapas de escolha (tamanho, sabor e complementos) ----------
  const renderChoices = () => {
    const filtered = step.data?.filter(i => normalizeSearch(i.name).includes(normalizeSearch(searchQuery))) ?? [];
    const cat = step.id as keyof OrderState;
    const isSelected = (item: MenuItem) => {
      const val = order[cat];
      return Array.isArray(val) ? (val as MenuItem[]).some(i => i.id === item.id) : (val as MenuItem | null)?.id === item.id;
    };

    return (
      <div className="flex flex-col gap-5">
        {step.data && step.data.length > 6 && (
          <label className="relative block">
            <span className="sr-only">Buscar em {step.title}</span>
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" aria-hidden />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 rounded-full bg-[#2f1729] border-2 border-white/10 pl-11 pr-5 text-[15px] text-white placeholder:text-white/40 caret-[#F0DF58] focus:outline-none focus:border-[#F0DF58] transition-colors"
            />
          </label>
        )}

        {filtered.length === 0 && (
          <p className="py-10 text-center text-white/60">Nada encontrado para “{searchQuery}”.</p>
        )}

        {step.id === "size" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {filtered.map(item => {
              const sel = isSelected(item);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleItem(cat, item, step.multiple)}
                  aria-pressed={sel}
                  className={cn("flex flex-col rounded-[28px] overflow-hidden text-left", tileBase, sel ? tileOn : tileIdle, focusRing)}
                >
                  <span className={cn("block aspect-square w-full overflow-hidden", sel ? "bg-[#F8EEA6]" : "bg-[#3a1d33]")}>
                    <img
                      src={sizeImage(item)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className={cn("h-full w-full object-cover", sel && "anim-pop")}
                    />
                  </span>
                  <span className="flex flex-col gap-1 px-3.5 pb-3.5 pt-3">
                    <span className="font-heading text-[26px] leading-[0.95]">{item.name}</span>
                    <span className={cn("font-heading text-[22px] leading-none", sel ? "text-[#120714]" : "text-[#F0DF58]")}>{formatBRL(item.price)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className={cn("grid gap-x-3 gap-y-6", step.multiple ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3")}>
            {filtered.map(item => {
              const sel = isSelected(item);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleItem(cat, item, step.multiple)}
                  aria-pressed={sel}
                  className={cn("group flex h-full flex-col items-center gap-2 rounded-3xl p-1 text-center", focusRing)}
                >
                  <span className="relative">
                    <span
                      className={cn(
                        "block aspect-square overflow-hidden rounded-full border-[3px] transition-colors duration-200",
                        step.multiple ? "w-[88px] sm:w-[104px] lg:w-[116px]" : "w-[136px] sm:w-[150px]",
                        sel ? "border-[#F0DF58] outline outline-2 outline-[#120714] anim-pop" : "border-[#F8EEA6]"
                      )}
                    >
                      <img
                        src={`/assets/items/${item.id}.webp`}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = fallbackAvatar(item.name);
                        }}
                        className="h-full w-full scale-[1.4] object-cover"
                      />
                    </span>
                    {sel && (
                      <span className="absolute -right-1 top-0 grid h-8 w-8 place-items-center rounded-full border-2 border-[#120714] bg-[#F0DF58] text-[#120714]">
                        <Check size={16} strokeWidth={3.5} />
                      </span>
                    )}
                  </span>
                  {(() => {
                    // A porção ("50ml") sai do nome e vai para a linha do preço, para o nome caber inteiro
                    const { name, portion } = splitPortion(item.name);
                    return (
                      <>
                        {/* Nome em texto simples; ocupa a sobra da linha da grade para os preços ficarem alinhados */}
                        <span
                          className={cn(
                            "flex w-full flex-1 items-start justify-center px-1 font-sans font-bold leading-tight text-balance transition-colors duration-200",
                            step.multiple ? "text-[13px]" : "text-[16px]",
                            sel ? "text-[#F0DF58]" : "text-white"
                          )}
                        >
                          {name}
                          {portion && <span className="sr-only"> {portion}</span>}
                        </span>
                        {(item.price > 0 || portion || step.multiple) && (
                          <span className="flex flex-wrap justify-center gap-x-1.5 font-heading text-lg leading-none text-[#F0DF58]" aria-hidden={!item.price}>
                            {item.price > 0 && <span className="whitespace-nowrap">+ {formatBRL(item.price)}</span>}
                            {portion && <span className="text-white/60" aria-hidden>{portion}</span>}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ---------- Entrega ou retirada ----------
  const renderDelivery = () => (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {([
          { id: "pickup", label: "Retirar na Loja", sub: "Grátis", Icon: Store },
          { id: "delivery", label: "Receber em Casa", sub: `+ ${formatBRL(DELIVERY_FEE)}`, Icon: Bike },
        ] as const).map(({ id, label, sub, Icon }) => {
          const sel = order.deliveryMethod === id;
          return (
            <button
              key={id}
              onClick={() => setOrder(p => ({ ...p, deliveryMethod: id }))}
              aria-pressed={sel}
              className={cn("flex flex-col items-start gap-5 rounded-[28px] p-5 text-left", tileBase, sel ? tileOn : tileIdle, focusRing)}
            >
              <span className={cn("grid h-12 w-12 place-items-center rounded-full border-2", sel ? "border-[#120714]" : "border-white/20 text-[#F0DF58]")}>
                <Icon size={24} strokeWidth={2.25} />
              </span>
              <span className="flex flex-col gap-1">
                <span className="font-heading text-[28px] leading-[0.95]">{label}</span>
                <span className={cn("text-sm font-bold", sel ? "text-[#120714]/75" : "text-[#F58220]")}>{sub}</span>
              </span>
            </button>
          );
        })}
      </div>

      {order.deliveryMethod === "delivery" && (
        <fieldset className="flex flex-col gap-3 animate-in fade-in duration-300">
          <legend className="mb-3 font-heading text-[28px] leading-none">Endereço de entrega</legend>
          {([
            { key: "street", label: "Rua", placeholder: "Rua", className: "" },
            { key: "number", label: "Número", placeholder: "Número", className: "" },
            { key: "neighborhood", label: "Bairro / Complemento", placeholder: "Bairro / Complemento", className: "" },
          ] as const).map(field => (
            <label key={field.key} className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-white/80">{field.label}</span>
              <input
                type="text"
                placeholder={field.placeholder}
                value={order.address[field.key]}
                onChange={(e) => setOrder(p => ({ ...p, address: { ...p.address, [field.key]: e.target.value } }))}
                className="h-12 w-full rounded-2xl border-2 border-white/10 bg-[#2f1729] px-4 text-[16px] text-white placeholder:text-white/35 caret-[#F0DF58] transition-colors focus:border-[#F0DF58] focus:outline-none"
              />
            </label>
          ))}
        </fieldset>
      )}
    </div>
  );

  // ---------- Forma de pagamento ----------
  const renderPayment = () => (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {([
          { id: "pix", label: "Pix", Icon: QrCode },
          { id: "card", label: "Cartão", Icon: CreditCard },
          { id: "cash", label: "Dinheiro", Icon: Banknote },
        ] as const).map(opt => {
          const sel = order.paymentMethod === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setOrder(p => ({ ...p, paymentMethod: opt.id }))}
              aria-pressed={sel}
              className={cn("flex flex-col items-center gap-3 rounded-[24px] px-2 py-5", tileBase, sel ? tileOn : tileIdle, focusRing)}
            >
              <span className={cn("grid h-12 w-12 place-items-center rounded-full border-2", sel ? "border-[#120714]" : "border-white/20 text-[#F0DF58]")}>
                <opt.Icon size={24} strokeWidth={2.25} />
              </span>
              <span className="font-heading text-2xl leading-none">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {order.paymentMethod === "cash" && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-300">
          <h3 className="font-heading text-[28px] leading-none">Precisa de troco?</h3>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-white/80">Troco para quanto?</span>
            <span className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#F0DF58]">R$</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="Valor para troco"
                value={order.changeFor === "Não preciso" ? "" : order.changeFor}
                onChange={(e) => setOrder(prev => ({ ...prev, changeFor: e.target.value }))}
                disabled={order.changeFor === "Não preciso"}
                className="h-12 w-full rounded-2xl border-2 border-white/10 bg-[#2f1729] pl-12 pr-4 text-[16px] font-bold text-white placeholder:font-normal placeholder:text-white/35 caret-[#F0DF58] transition-colors focus:border-[#F0DF58] focus:outline-none disabled:opacity-40"
              />
            </span>
          </label>
          {order.changeFor && order.changeFor !== "Não preciso" && parseFloat(order.changeFor) < totalPrice && (
            <p className="text-sm font-bold text-[#F58220]">O valor precisa ser maior que o total de {formatBRL(totalPrice)}.</p>
          )}
          <button
            onClick={() => setOrder(p => ({ ...p, changeFor: p.changeFor === "Não preciso" ? "" : "Não preciso" }))}
            aria-pressed={order.changeFor === "Não preciso"}
            className={cn(
              "flex h-12 items-center justify-center gap-2 self-start rounded-full border-2 px-5 text-sm font-bold",
              order.changeFor === "Não preciso" ? "border-[#120714] bg-[#F0DF58] text-[#120714]" : "border-white/20 text-white hover:border-white/40",
              focusRing
            )}
          >
            {order.changeFor === "Não preciso" && <Check size={16} strokeWidth={3} />}
            Não preciso de troco
          </button>
        </div>
      )}
    </div>
  );

  // ---------- Resumo ----------
  const renderSummary = () => (
    <div className="flex flex-col gap-4">
      <section className="rounded-[28px] border-2 border-white/10 bg-[#2f1729] p-5">
        <div className="flex items-center gap-4">
          <img src={sizeImage(order.size)} alt="" className="h-20 w-16 rounded-2xl object-cover bg-[#3a1d33]" />
          <div className="min-w-0 flex-1">
            <p className="font-heading text-[28px] leading-[0.95]">{order.size?.name}</p>
            <p className="mt-1 text-sm font-bold text-[#F0DF58]">{order.flavor?.name}</p>
          </div>
          <span className="font-heading text-2xl">{order.size && formatBRL(order.size.price)}</span>
        </div>

        {allSelectedItems.length > 0 && (
          <ul className="mt-5 flex flex-col gap-2.5 border-t-2 border-white/10 pt-4">
            {allSelectedItems.map(i => (
              <li key={i.id} className="flex items-baseline justify-between gap-3 text-[15px]">
                <span className="text-white/85">{i.name}</span>
                <span className="font-heading text-lg text-white/85">{i.price > 0 ? formatBRL(i.price) : "Grátis"}</span>
              </li>
            ))}
          </ul>
        )}

        <dl className="mt-5 flex flex-col gap-2 border-t-2 border-white/10 pt-4 text-[15px]">
          <div className="flex justify-between gap-3">
            <dt className="text-white/70">Entrega</dt>
            <dd className="font-bold">{order.deliveryMethod === "delivery" ? `Receber em casa (+ ${formatBRL(DELIVERY_FEE)})` : "Retirar na loja"}</dd>
          </div>
          {order.deliveryMethod === "delivery" && (
            <div className="flex justify-between gap-3">
              <dt className="text-white/70">Endereço</dt>
              <dd className="text-right font-bold">{order.address.street}, {order.address.number} — {order.address.neighborhood}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt className="text-white/70">Pagamento</dt>
            <dd className="font-bold">{order.paymentMethod ? PAYMENT_LABELS[order.paymentMethod] : "No balcão"}</dd>
          </div>
        </dl>
      </section>

      <div className="flex items-center justify-between rounded-[28px] border-2 border-[#120714] bg-[#F0DF58] px-5 py-4 text-[#120714]">
        <span className="font-heading text-[28px] leading-none">Total</span>
        <span className="font-heading text-5xl leading-none">{formatBRL(totalPrice)}</span>
      </div>
    </div>
  );

  const renderStepContent = () => {
    if (step.id === "delivery") return renderDelivery();
    if (step.id === "payment") return renderPayment();
    if (step.id === "summary") return renderSummary();
    return renderChoices();
  };

  // ---------- Lista do que já entrou (folha "Seu açaí") ----------
  const renderChosenList = () => (
    <ul className="flex flex-col gap-2">
      {allSelectedItems.map(i => (
        <li
          key={i.id}
          className={cn(
            "flex items-center gap-3 rounded-2xl border-2 px-3 py-2",
            deletingId === i.id ? "border-[#F58220] bg-[#F58220]/10" : "border-white/10 bg-white/[0.03]"
          )}
        >
          <img
            src={`/assets/items/${i.id}.webp`}
            alt=""
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = fallbackAvatar(i.name); }}
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
          <span className="min-w-0 flex-1 truncate text-[15px]">
            {deletingId === i.id ? "Remover do açaí?" : i.name}
          </span>
          {deletingId !== i.id && (
            <span className="font-heading text-lg text-[#F0DF58]">{i.price > 0 ? `+ ${formatBRL(i.price)}` : "Grátis"}</span>
          )}
          <button
            onClick={() => handleDeleteClick(categoryOf(i), i.id)}
            title={deletingId === i.id ? "Confirmar remoção" : "Remover item"}
            aria-label={deletingId === i.id ? `Confirmar remoção de ${i.name}` : `Remover ${i.name}`}
            className={cn(
              "grid h-11 min-w-11 place-items-center rounded-full text-sm font-bold",
              deletingId === i.id ? "bg-[#F58220] px-4 text-[#120714]" : "text-white/50 hover:text-[#F58220]",
              focusRing
            )}
          >
            {deletingId === i.id ? "Sim" : <Trash2 size={17} />}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <SmoothScrollProvider isDisabled={showCart}>
      <main className="relative flex min-h-[100dvh] flex-col bg-[#241220] text-white lining-nums tabular-nums selection:bg-[#F0DF58] selection:text-[#120714]">
        <h1 className="sr-only">Monte seu Açaí</h1>

        {/* Topo fixo: progresso em segmentos + voltar, logo e total */}
        <header className="sticky top-0 z-40 border-b-2 border-[#120714] bg-[#241220]">
          <div className="mx-auto w-full max-w-[680px] px-4 pt-3 sm:px-6">
            <nav aria-label="Etapas da montagem" className="flex gap-1.5">
              {STEPS.map((s, idx) => {
                const done = idx < currentStep;
                const current = idx === currentStep;
                const skipped = s.id === "payment" && order.deliveryMethod === "pickup" && currentStep > idx;
                return (
                  <button
                    key={s.id}
                    onClick={() => goToStep(idx)}
                    disabled={idx >= currentStep || skipped}
                    aria-label={`${SHORT_TITLES[s.id]}${current ? " (etapa atual)" : done ? " (concluída)" : ""}`}
                    aria-current={current ? "step" : undefined}
                    className="group flex-1 py-3 disabled:cursor-default"
                  >
                    <span className="block h-[5px] overflow-hidden rounded-full bg-white/15">
                      {(done || current) && !skipped && (
                        <span key={`${s.id}-${current}`} className={cn("block h-full rounded-full bg-[#F0DF58]", current && "anim-seg-fill", done && "group-hover:bg-[#F8EEA6]")} />
                      )}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-3 pb-3 pt-1">
              <Link to="/" aria-label="Sair da montagem e voltar para o início" className={cn("grid h-11 w-11 place-items-center rounded-full border-2 border-white/20 text-white hover:border-white/40", focusRing)}>
                <X size={20} />
              </Link>
              <img src="/assets/Logo açai.webp" alt="Açaí no Kilo" className="h-12 w-auto object-contain" />
              <button
                onClick={() => setShowCart(true)}
                aria-label={`Ver seu açaí: ${itemCount} ${itemCount === 1 ? "item" : "itens"}, total ${formatBRL(totalPrice)}`}
                className={cn("ml-auto flex h-11 items-center gap-2 rounded-full border-2 border-[#120714] bg-[#F0DF58] pl-1.5 pr-4 text-[#120714]", focusRing)}
              >
                <span className="flex h-7 items-center gap-1 rounded-full bg-[#120714] px-2 text-[#F0DF58]">
                  <ShoppingBag size={14} strokeWidth={2.5} />
                  <span className="text-xs font-bold">{itemCount}</span>
                </span>
                <span key={totalPrice} className="anim-pop font-heading text-2xl leading-none">{formatBRL(totalPrice)}</span>
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[680px] flex-1 px-4 pb-36 pt-6 sm:px-6">
          {/* Coluna da etapa */}
          <section key={currentStep} className="w-full min-w-0 animate-in fade-in slide-in-from-right-4 duration-300 ease-out">
            <h2 className="font-heading text-[clamp(3rem,12vw,4.75rem)] leading-[0.9] text-balance">{step.title}</h2>
            <p className="mb-6 mt-3 text-[15px] text-white/75">{stepHint()}</p>
            {renderStepContent()}
          </section>
        </div>

        {/* Rodapé fixo: voltar + próximo / finalizar */}
        <footer className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-[#120714] bg-[#2f1729] pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
          <div className="mx-auto flex w-full max-w-[680px] items-center gap-3 px-4 sm:px-6">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  aria-label="Voltar uma etapa"
                  className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-white/25 text-white hover:border-white/50", focusRing)}
                >
                  <ArrowLeft size={22} strokeWidth={2.5} />
                </button>
              )}
              {isLastStep ? (
                <button
                  onClick={sendWhatsApp}
                  disabled={isSending}
                  className={cn("flex h-14 flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#120714] bg-[#25D366] font-heading text-[26px] text-[#120714] transition-opacity disabled:opacity-50", focusRing)}
                >
                  <Send size={20} strokeWidth={2.5} /> Finalizar no WhatsApp
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!stepValid}
                  className={cn(
                    "flex h-14 flex-1 items-center justify-center gap-2 rounded-full border-2 font-heading text-[26px] transition-colors",
                    stepValid ? "border-[#120714] bg-[#F0DF58] text-[#120714] hover:bg-[#F8EEA6]" : "cursor-not-allowed border-white/10 bg-white/[0.06] text-white/40",
                    focusRing
                  )}
                >
                  Próximo: {nextTitle} <ArrowRight size={22} strokeWidth={2.5} />
                </button>
              )}
          </div>
        </footer>

        {/* Folha "Seu açaí" (celular) */}
        {showCart && (
          <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <button className="absolute inset-0 bg-[#120714]/75" aria-label="Fechar" onClick={() => setShowCart(false)} />
            <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[85dvh] w-full max-w-[680px] flex-col rounded-t-[32px] bg-[#241220] animate-in slide-in-from-bottom duration-300 ease-out">
              <div className="flex items-center justify-between px-5 pb-3 pt-5">
                <h3 id="cart-title" className="font-heading text-[34px] leading-none text-[#F0DF58]">Seu açaí</h3>
                <button autoFocus onClick={() => setShowCart(false)} aria-label="Fechar" className={cn("grid h-11 w-11 place-items-center rounded-full border-2 border-white/20", focusRing)}>
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-4" data-lenis-prevent>
                <div className="mb-4 flex items-center gap-3 rounded-2xl border-2 border-white/10 bg-[#2f1729] p-3">
                  <img src={sizeImage(order.size)} alt="" className="h-14 w-12 rounded-xl object-cover bg-[#3a1d33]" />
                  <div className="min-w-0 flex-1">
                    <p className="font-heading text-2xl leading-none">{order.size ? order.size.name : "Tamanho a escolher"}</p>
                    <p className="mt-1 text-sm font-bold text-[#F0DF58]">{order.flavor ? order.flavor.name : "Sabor a escolher"}</p>
                    {order.size && <p className="mt-0.5 text-sm text-white/60">Base: {formatBRL(order.size.price)}</p>}
                  </div>
                </div>
                {allSelectedItems.length === 0
                  ? <p className="py-4 text-sm text-white/60">Nenhum complemento ainda.</p>
                  : renderChosenList()}
              </div>
              <div className="border-t-2 border-[#120714] bg-[#2f1729] px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-4">
                <div className="mb-3 flex items-baseline justify-between">
                  <span className="font-heading text-2xl">Total</span>
                  <span className="font-heading text-4xl text-[#F0DF58]">{formatBRL(totalPrice)}</span>
                </div>
                <button onClick={() => setShowCart(false)} className={cn("h-14 w-full rounded-full border-2 border-[#120714] bg-[#F0DF58] font-heading text-[26px] text-[#120714]", focusRing)}>
                  Continuar montando
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </SmoothScrollProvider>
  );
}
