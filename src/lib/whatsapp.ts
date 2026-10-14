import { PAYMENT_LABELS } from "./orders";
import type { Address, DeliveryMethod, PaymentMethod } from "@/types/order";

export const STORE_WHATSAPP_NUMBER = "557591585290";
export const DELIVERY_FEE = 7;

export function deliveryFee(method: DeliveryMethod | null): number {
  return method === "delivery" ? DELIVERY_FEE : 0;
}

/** Valor no formato da mensagem do WhatsApp: "R$ 18,50". */
export function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export interface CheckoutDetails {
  deliveryMethod: DeliveryMethod | null;
  address: Address;
  paymentMethod: PaymentMethod | null;
  changeFor: string;
}

/** Trecho final da mensagem do pedido: entrega, endereço, pagamento, troco e total. */
export function buildCheckoutSection(details: CheckoutDetails, total: number): string {
  const { deliveryMethod, address, paymentMethod, changeFor } = details;
  let section = `\n*Entrega:* ${deliveryMethod === "delivery" ? "Receber em casa" : "Retirar na loja"}\n`;
  if (deliveryMethod === "delivery") section += `*Endereço:* ${address.street}, ${address.number} - ${address.neighborhood}\n`;
  section += `\n*Pagamento:* ${paymentMethod ? PAYMENT_LABELS[paymentMethod] : "Não definido"}\n`;
  if (paymentMethod === "cash" && changeFor) {
    section += changeFor === "Não preciso" ? `*Troco:* Não preciso\n` : `*Troco para:* R$ ${changeFor}\n`;
  }
  section += `\n*TOTAL: ${formatBRL(total)}*`;
  return section;
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
