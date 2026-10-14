import { describe, it, expect, beforeEach } from 'vitest';
import { MENU_CACHE_KEY, readCachedMenuItems, groupBuilderMenu, normalizeMenuData } from '@/lib/menuCache';

const record = (overrides: Record<string, unknown>) => ({
  _id: 'db1', id: 'pot_500', name: 'Pote de 500', price: 17, category: 'Tamanho',
  original_category: 'sizes', active: true, ...overrides,
});

describe('readCachedMenuItems', () => {
  beforeEach(() => localStorage.clear());

  it('lê a mesma chave que o painel admin grava', () => {
    expect(MENU_CACHE_KEY).toBe('cardapio_admin_menu_items_v3');
    localStorage.setItem(MENU_CACHE_KEY, JSON.stringify([record({})]));
    expect(readCachedMenuItems().map(i => i.name)).toEqual(['Pote de 500']);
  });

  it('cai para a chave legada v2 quando não há v3', () => {
    localStorage.setItem('cardapio_admin_menu_items_v2', JSON.stringify([record({ name: 'Legado' })]));
    expect(readCachedMenuItems().map(i => i.name)).toEqual(['Legado']);
  });

  it('ignora cache corrompido ou itens malformados', () => {
    localStorage.setItem(MENU_CACHE_KEY, '{nao-e-json');
    expect(readCachedMenuItems()).toEqual([]);

    localStorage.setItem(MENU_CACHE_KEY, JSON.stringify([record({}), { name: 1 }, null, 'x']));
    expect(readCachedMenuItems()).toHaveLength(1);
  });
});

describe('ids estáveis', () => {
  it('usa o _id do banco quando o item não tem id (itens criados pelo admin)', () => {
    const menu = groupBuilderMenu([
      record({ id: undefined, _id: 'a1', name: 'Calda A', original_category: 'toppings' }),
      record({ id: undefined, _id: 'b2', name: 'Calda B', original_category: 'toppings' }),
    ]);
    expect(menu.toppings.map(i => i.id)).toEqual(['a1', 'b2']);
  });

  it('normaliza a resposta de GET /api/menu', () => {
    const menu = normalizeMenuData({
      sizes: [record({ id: undefined, _id: 'x9' })],
      toppings: [record({ id: undefined, _id: 't1', name: 'Mel' }), { bad: true }],
      ready_made: [],
    });
    expect(menu?.sizes[0].id).toBe('x9');
    expect(menu?.toppings.map(i => i.name)).toEqual(['Mel']);
    expect(menu?.fillings).toEqual([]);
  });

  it('devolve null para respostas sem cardápio', () => {
    expect(normalizeMenuData(null)).toBeNull();
    expect(normalizeMenuData({ error: 'x' })).toBeNull();
  });
});
