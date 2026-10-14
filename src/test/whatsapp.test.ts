import { describe, it, expect, vi } from 'vitest';
import {
  DELIVERY_FEE,
  STORE_WHATSAPP_NUMBER,
  buildCheckoutSection,
  buildWhatsAppUrl,
  deliveryFee,
  formatBRL,
  openWhatsApp,
} from '@/lib/whatsapp';

const address = { street: 'Rua das Flores', number: '42', neighborhood: 'Centro' };

describe('formatBRL', () => {
  it.each([
    [18, 'R$ 18,00'],
    [18.5, 'R$ 18,50'],
    [0, 'R$ 0,00'],
    [1234.5, 'R$ 1234,50'],
  ])('%s → %s', (value, expected) => {
    expect(formatBRL(value)).toBe(expected);
  });
});

describe('deliveryFee', () => {
  it('cobra a taxa só na entrega', () => {
    expect(DELIVERY_FEE).toBe(7);
    expect(deliveryFee('delivery')).toBe(7);
    expect(deliveryFee('pickup')).toBe(0);
    expect(deliveryFee(null)).toBe(0);
  });
});

describe('buildCheckoutSection', () => {
  it('retirada com Pix', () => {
    expect(buildCheckoutSection({ deliveryMethod: 'pickup', address, paymentMethod: 'pix', changeFor: '' }, 18)).toBe(
      '\n*Entrega:* Retirar na loja\n' +
      '\n*Pagamento:* Pix\n' +
      '\n*TOTAL: R$ 18,00*'
    );
  });

  it('entrega em dinheiro com troco', () => {
    expect(buildCheckoutSection({ deliveryMethod: 'delivery', address, paymentMethod: 'cash', changeFor: '50' }, 25)).toBe(
      '\n*Entrega:* Receber em casa\n' +
      '*Endereço:* Rua das Flores, 42 - Centro\n' +
      '\n*Pagamento:* Dinheiro\n' +
      '*Troco para:* R$ 50\n' +
      '\n*TOTAL: R$ 25,00*'
    );
  });

  it('dinheiro sem troco e pagamento não definido', () => {
    expect(buildCheckoutSection({ deliveryMethod: 'pickup', address, paymentMethod: 'cash', changeFor: 'Não preciso' }, 10))
      .toContain('*Troco:* Não preciso\n');
    expect(buildCheckoutSection({ deliveryMethod: 'pickup', address, paymentMethod: null, changeFor: '' }, 10))
      .toContain('*Pagamento:* Não definido\n');
  });
});

describe('openWhatsApp', () => {
  it('abre em nova aba', () => {
    const fakeWindow = { open: vi.fn(() => ({}) as Window), location: { href: '' } };
    openWhatsApp('https://wa.me/1', fakeWindow);
    expect(fakeWindow.open).toHaveBeenCalledWith('https://wa.me/1', '_blank');
    expect(fakeWindow.location.href).toBe('');
  });

  it('navega na própria aba quando o pop-up é bloqueado', () => {
    const fakeWindow = { open: vi.fn(() => null), location: { href: '' } };
    openWhatsApp('https://wa.me/1', fakeWindow);
    expect(fakeWindow.location.href).toBe('https://wa.me/1');
  });
});

describe('buildWhatsAppUrl', () => {
  it('codifica a mensagem para o número da loja', () => {
    expect(STORE_WHATSAPP_NUMBER).toBe('557591585290');
    expect(buildWhatsAppUrl('*NOVO PEDIDO*\nTotal: R$ 18,00')).toBe(
      'https://wa.me/557591585290?text=*NOVO%20PEDIDO*%0ATotal%3A%20R%24%2018%2C00'
    );
  });
});
