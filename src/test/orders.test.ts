import { describe, it, expect } from 'vitest';
import {
  normalizeDeliveryMethod,
  normalizePaymentMethod,
  DELIVERY_LABELS,
  PAYMENT_LABELS,
  normalizeOrderStatus,
  nextOrderStatus,
  orderStatusLabel,
} from '@/lib/orders';

describe('normalizeDeliveryMethod', () => {
  it.each([
    ['delivery', 'delivery'],
    ['Entrega', 'delivery'],
    ['Receber em casa', 'delivery'],
    ['pickup', 'pickup'],
    ['Retirada', 'pickup'],
    ['Retirar na loja', 'pickup'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeDeliveryMethod(input)).toBe(expected);
  });

  it.each([undefined, null, '', 'qualquer', 42, { $ne: null }])('retorna null para %s', (input) => {
    expect(normalizeDeliveryMethod(input)).toBeNull();
  });
});

describe('normalizePaymentMethod', () => {
  it.each([
    ['pix', 'pix'],
    ['Pix', 'pix'],
    ['card', 'card'],
    ['Cartão', 'card'],
    ['cartao', 'card'],
    ['cash', 'cash'],
    ['Dinheiro', 'cash'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePaymentMethod(input)).toBe(expected);
  });

  it.each([undefined, null, '', 'boleto', 42])('retorna null para %s', (input) => {
    expect(normalizePaymentMethod(input)).toBeNull();
  });
});

describe('rótulos', () => {
  it('exibe entrega e pagamento em português', () => {
    expect(DELIVERY_LABELS).toEqual({ delivery: 'Entrega', pickup: 'Retirada' });
    expect(PAYMENT_LABELS).toEqual({ pix: 'Pix', card: 'Cartão', cash: 'Dinheiro' });
  });
});

describe('status do pedido', () => {
  it('pedido sem status (antigo) conta como novo', () => {
    expect(normalizeOrderStatus(undefined)).toBe('new');
    expect(normalizeOrderStatus('qualquer')).toBe('new');
    expect(normalizeOrderStatus('done')).toBe('done');
  });

  it('avança novo → em preparo → pronto → concluído', () => {
    expect(nextOrderStatus('new')).toBe('preparing');
    expect(nextOrderStatus('preparing')).toBe('ready');
    expect(nextOrderStatus('ready')).toBe('done');
    expect(nextOrderStatus('done')).toBeNull();
    expect(nextOrderStatus('cancelled')).toBeNull();
  });

  it('o rótulo de "pronto" depende da entrega', () => {
    expect(orderStatusLabel('ready', 'delivery')).toBe('Saiu para entrega');
    expect(orderStatusLabel('ready', 'pickup')).toBe('Pronto para retirar');
    expect(orderStatusLabel('new', 'pickup')).toBe('Novo');
    expect(orderStatusLabel('cancelled', 'delivery')).toBe('Cancelado');
  });
});
