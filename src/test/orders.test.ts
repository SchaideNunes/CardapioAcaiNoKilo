import { describe, it, expect } from 'vitest';
import {
  normalizeDeliveryMethod,
  normalizePaymentMethod,
  DELIVERY_LABELS,
  PAYMENT_LABELS,
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
