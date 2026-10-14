export const ORDERS_ENDPOINT = "http://localhost:3001/api/orders";

export type DeliveryMethod = "pickup" | "delivery";
export type PaymentMethod = "pix" | "card" | "cash";

export type OrderPayload = {
  origin: "custom" | "ready_made";
  items: string[];
  total: number;
  deliveryMethod: DeliveryMethod | null;
  paymentMethod: PaymentMethod | null;
  address?: { street: string; number: string; neighborhood: string };
  changeFor?: string;
  [extra: string]: unknown;
};

/**
 * Persiste o pedido para o painel admin. Nunca lança: uma falha ao salvar
 * não pode impedir o cliente de enviar o pedido pelo WhatsApp.
 */
export async function saveOrder(order: OrderPayload): Promise<boolean> {
  try {
    const res = await fetch(ORDERS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    return res.ok;
  } catch (e) {
    console.error("Erro ao salvar pedido no banco, mas enviando WhatsApp...", e);
    return false;
  }
}
