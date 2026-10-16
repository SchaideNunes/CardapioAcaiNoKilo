import { apiUrl } from "./api";
import type { DeliveryMethod, OrderPayload, OrderStatus, PaymentMethod } from "@/types/order";

export const ORDERS_ENDPOINT = apiUrl("/api/orders");

export const DELIVERY_LABELS: Record<DeliveryMethod, string> = { delivery: "Entrega", pickup: "Retirada" };
export const PAYMENT_LABELS: Record<PaymentMethod, string> = { pix: "Pix", card: "Cartão", cash: "Dinheiro" };

function normalizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

/**
 * Aceita o código gravado pelo site ("delivery" | "pickup") e os rótulos
 * legados em português ("Entrega", "Retirada", "Receber em casa"...).
 */
export function normalizeDeliveryMethod(value: unknown): DeliveryMethod | null {
  const text = normalizeText(value);
  if (text === "delivery" || text.startsWith("entrega") || text.startsWith("receber")) return "delivery";
  if (text === "pickup" || text.startsWith("retira")) return "pickup";
  return null;
}

/** Aceita "pix" | "card" | "cash" e os rótulos legados ("Cartão", "Dinheiro"...). */
export function normalizePaymentMethod(value: unknown): PaymentMethod | null {
  const text = normalizeText(value);
  if (text === "pix") return "pix";
  if (text === "card" || text.startsWith("cartao")) return "card";
  if (text === "cash" || text === "dinheiro") return "cash";
  return null;
}

const ORDER_STATUSES: OrderStatus[] = ["new", "preparing", "ready", "done", "cancelled"];
const STATUS_FLOW: Partial<Record<OrderStatus, OrderStatus>> = { new: "preparing", preparing: "ready", ready: "done" };

/** Pedidos gravados antes do controle de status não têm o campo: contam como "new". */
export function normalizeOrderStatus(value: unknown): OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus) ? (value as OrderStatus) : "new";
}

/** Próxima etapa do pedido; null quando já foi concluído ou cancelado. */
export function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  return STATUS_FLOW[status] ?? null;
}

/** "Pronto" vira "Saiu para entrega" ou "Pronto para retirar" conforme a entrega. */
export function orderStatusLabel(status: OrderStatus, delivery: DeliveryMethod | null): string {
  if (status === "ready") return delivery === "delivery" ? "Saiu para entrega" : "Pronto para retirar";
  return { new: "Novo", preparing: "Em preparo", done: "Concluído", cancelled: "Cancelado" }[status];
}

/**
 * Persiste o pedido para o painel admin. Nunca lança: uma falha ao salvar
 * não pode impedir o cliente de enviar o pedido pelo WhatsApp. Usa keepalive para
 * a requisição sobreviver se a aba for trocada/fechada logo depois (abertura do WhatsApp).
 */
export async function saveOrder(order: OrderPayload): Promise<boolean> {
  try {
    const res = await fetch(ORDERS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
      keepalive: true,
    });
    return res.ok;
  } catch (e) {
    console.error("Erro ao salvar pedido no banco, mas enviando WhatsApp...", e);
    return false;
  }
}
