export type DeliveryMethod = "pickup" | "delivery";
export type PaymentMethod = "pix" | "card" | "cash";
export type OrderOrigin = "custom" | "ready_made";

export interface Address {
  street: string;
  number: string;
  neighborhood: string;
}

/** Corpo enviado para POST /api/orders (validado em server/validation.js). */
export type OrderPayload = {
  origin: OrderOrigin;
  items: string[];
  total: number;
  deliveryMethod: DeliveryMethod | null;
  paymentMethod: PaymentMethod | null;
  address?: Address;
  changeFor?: string;
  [extra: string]: unknown;
};

/**
 * Pedido como devolvido por GET /api/admin/orders. Pedidos antigos (e os de demonstração)
 * guardam entrega/pagamento como rótulos em português — leia com os normalizadores de src/lib/orders.
 */
export interface OrderRecord {
  _id: string;
  origin?: OrderOrigin;
  total: number;
  paymentMethod: string | null;
  deliveryMethod: string;
  items: string[];
  createdAt: string;
  address?: {
    street: string;
    neighborhood: string;
    number?: string;
  };
  changeFor?: string;
}
