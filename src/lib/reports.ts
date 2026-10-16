import { normalizeDeliveryMethod, normalizePaymentMethod } from "./orders";
import type { OrderRecord } from "@/types/order";

export type ReportPeriod = "today" | "week" | "month";

/** Início do período no horário local: hoje (meia-noite), 7 dias (hoje + 6 anteriores) ou mês (dia 1). */
export function periodStart(period: ReportPeriod, now: Date): Date {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "week") start.setDate(start.getDate() - 6);
  if (period === "month") start.setDate(1);
  return start;
}

/** Data mais antiga que algum filtro de relatório pode precisar (a semana pode começar no mês anterior). */
export function earliestReportStart(now: Date): Date {
  const week = periodStart("week", now);
  const month = periodStart("month", now);
  return week < month ? week : month;
}

export function filterOrdersByPeriod(orders: OrderRecord[], period: ReportPeriod, now: Date): OrderRecord[] {
  const start = periodStart(period, now).getTime();
  return orders.filter(order => {
    const created = new Date(order.createdAt).getTime();
    return !Number.isNaN(created) && created >= start;
  });
}

export interface OrderMetrics {
  totalOrdersCount: number;
  totalRevenue: number;
  avgTicket: number;
  deliveryCount: number;
  pickupCount: number;
  pix: { count: number; revenue: number };
  card: { count: number; revenue: number };
  cash: { count: number; revenue: number };
  topItems: { name: string; count: number }[];
}

const orderTotal = (order: OrderRecord) => Number(order.total) || 0;

export function computeOrderMetrics(orders: OrderRecord[]): OrderMetrics {
  const totalOrdersCount = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + orderTotal(o), 0);
  const deliveryCount = orders.filter(o => normalizeDeliveryMethod(o.deliveryMethod) === "delivery").length;

  const byPayment = (method: "pix" | "card" | "cash") => {
    const matching = orders.filter(o => normalizePaymentMethod(o.paymentMethod) === method);
    return { count: matching.length, revenue: matching.reduce((sum, o) => sum + orderTotal(o), 0) };
  };

  // Itens mais pedidos (ranking de frequência)
  const itemFrequency = new Map<string, number>();
  for (const order of orders) {
    for (const item of Array.isArray(order.items) ? order.items : []) {
      const name = item.trim();
      if (name) itemFrequency.set(name, (itemFrequency.get(name) ?? 0) + 1);
    }
  }
  const topItems = [...itemFrequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  return {
    totalOrdersCount,
    totalRevenue,
    avgTicket: totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0,
    deliveryCount,
    pickupCount: totalOrdersCount - deliveryCount,
    pix: byPayment("pix"),
    card: byPayment("card"),
    cash: byPayment("cash"),
    topItems,
  };
}
