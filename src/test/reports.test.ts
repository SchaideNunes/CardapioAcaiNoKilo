import { describe, it, expect } from 'vitest';
import { periodStart, earliestReportStart, filterOrdersByPeriod, computeOrderMetrics } from '@/lib/reports';
import type { OrderRecord } from '@/types/order';

// Quarta, 15/10/2026 às 14:30 no horário local
const NOW = new Date(2026, 9, 15, 14, 30);

const order = (createdAt: Date, overrides: Partial<OrderRecord> = {}): OrderRecord => ({
  _id: String(createdAt.getTime()),
  total: 10,
  deliveryMethod: 'pickup',
  paymentMethod: 'pix',
  items: ['Pote de 500'],
  createdAt: createdAt.toISOString(),
  ...overrides,
});

describe('periodStart', () => {
  it('hoje começa à meia-noite local', () => {
    expect(periodStart('today', NOW)).toEqual(new Date(2026, 9, 15, 0, 0));
  });

  it('7 dias inclui hoje e os 6 dias anteriores', () => {
    expect(periodStart('week', NOW)).toEqual(new Date(2026, 9, 9, 0, 0));
  });

  it('mês começa no dia 1 do mês atual', () => {
    expect(periodStart('month', NOW)).toEqual(new Date(2026, 9, 1, 0, 0));
  });

  it('o início mais antigo cobre a semana mesmo no começo do mês', () => {
    const day3 = new Date(2026, 9, 3, 10, 0);
    expect(earliestReportStart(day3)).toEqual(new Date(2026, 8, 27, 0, 0));
    expect(earliestReportStart(NOW)).toEqual(new Date(2026, 9, 1, 0, 0));
  });
});

describe('filterOrdersByPeriod', () => {
  const orders = [
    order(new Date(2026, 9, 15, 9, 0)),   // hoje
    order(new Date(2026, 9, 14, 23, 59)), // ontem
    order(new Date(2026, 9, 9, 0, 1)),    // 6 dias atrás
    order(new Date(2026, 9, 2, 12, 0)),   // começo do mês
    order(new Date(2026, 8, 30, 12, 0)),  // mês passado
  ];

  it.each([
    ['today', 1],
    ['week', 3],
    ['month', 4],
  ] as const)('%s → %i pedidos', (period, expected) => {
    expect(filterOrdersByPeriod(orders, period, NOW)).toHaveLength(expected);
  });

  it('ignora pedidos com data inválida', () => {
    expect(filterOrdersByPeriod([order(NOW, { createdAt: 'lixo' })], 'month', NOW)).toEqual([]);
  });
});

describe('computeOrderMetrics', () => {
  it('soma faturamento, ticket médio, entrega/retirada e pagamentos', () => {
    const m = computeOrderMetrics([
      order(NOW, { total: 20, deliveryMethod: 'delivery', paymentMethod: 'card', items: ['Pote de 500', 'Mel 50ml'] }),
      order(NOW, { total: 10, deliveryMethod: 'Retirada', paymentMethod: 'Dinheiro', items: ['Pote de 500'] }),
      order(NOW, { total: 30, deliveryMethod: 'pickup', paymentMethod: null, items: ['Pote de 1L'] }),
    ]);

    expect(m.totalOrdersCount).toBe(3);
    expect(m.totalRevenue).toBe(60);
    expect(m.avgTicket).toBe(20);
    expect(m.deliveryCount).toBe(1);
    expect(m.pickupCount).toBe(2);
    expect(m.card).toEqual({ count: 1, revenue: 20 });
    expect(m.cash).toEqual({ count: 1, revenue: 10 });
    expect(m.pix).toEqual({ count: 0, revenue: 0 });
    expect(m.topItems[0]).toEqual({ name: 'Pote de 500', count: 2 });
  });

  it('pedidos cancelados não entram no faturamento nem nas contagens', () => {
    const m = computeOrderMetrics([
      order(NOW, { total: 20 }),
      order(NOW, { total: 50, status: 'cancelled', items: ['Pote de 1L'] }),
    ]);
    expect(m.totalOrdersCount).toBe(1);
    expect(m.totalRevenue).toBe(20);
    expect(m.cancelledCount).toBe(1);
    expect(m.topItems.map(i => i.name)).not.toContain('Pote de 1L');
  });

  it('zera tudo sem pedidos', () => {
    const m = computeOrderMetrics([]);
    expect(m.totalOrdersCount).toBe(0);
    expect(m.avgTicket).toBe(0);
    expect(m.topItems).toEqual([]);
  });
});
