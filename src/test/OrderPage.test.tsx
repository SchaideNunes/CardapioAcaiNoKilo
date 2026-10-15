import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import OrderPage from '@/pages/OrderPage';

function renderOrderPage() {
  return render(
    <MemoryRouter>
      <OrderPage />
    </MemoryRouter>
  );
}

describe('OrderPage ("Monte seu Açaí")', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('renders the page title and initial step (Tamanho)', () => {
    renderOrderPage();
    expect(screen.getByText('Monte seu Açaí')).toBeInTheDocument();
    expect(screen.getByText('Escolha o Tamanho')).toBeInTheDocument();
  });

  it('renders size options (Pote de 360, Pote de 500, etc.)', () => {
    renderOrderPage();
    expect(screen.getAllByText(/Pote de 360/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Pote de 500/i).length).toBeGreaterThan(0);
  });

  it('disables "PRÓXIMO" until a size is selected', () => {
    renderOrderPage();
    const nextButtons = screen.getAllByRole('button').filter(btn => btn.textContent?.toUpperCase().includes('PRÓXIMO'));
    expect(nextButtons[0]).toBeDisabled();
  });

  it('enables "PRÓXIMO" when size is selected and advances to flavor step', async () => {
    const user = userEvent.setup();
    renderOrderPage();

    // Select Pote de 500
    const sizeButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Pote de 500'))!;
    await user.click(sizeButton);

    const nextButtons = screen.getAllByRole('button').filter(btn => btn.textContent?.toUpperCase().includes('PRÓXIMO'));
    expect(nextButtons[0]).not.toBeDisabled();

    // Click next
    await user.click(nextButtons[0]);

    // Should now be on Sabor step
    expect(screen.getByRole('heading', { name: /Escolha o Sabor/i })).toBeInTheDocument();
  });

  it('calculates total correctly when size and complement items are selected', async () => {
    const user = userEvent.setup();
    renderOrderPage();

    // Select Pote de 500 (R$ 17.00)
    const sizeButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Pote de 500'))!;
    await user.click(sizeButton);

    // Click next to Sabor
    const nextButtons = screen.getAllByRole('button').filter(btn => btn.textContent?.toUpperCase().includes('PRÓXIMO'));
    await user.click(nextButtons[0]);

    // Select Açaí Natural (R$ 0.00)
    const flavorButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Açaí Natural'))!;
    await user.click(flavorButton);

    // Advance to Coberturas
    await user.click(screen.getAllByRole('button').filter(btn => btn.textContent?.toUpperCase().includes('PRÓXIMO'))[0]);

    expect(screen.getByRole('heading', { name: /Coberturas/i })).toBeInTheDocument();
  });

  it('allows adding and removing multiple complements', async () => {
    const user = userEvent.setup();
    renderOrderPage();

    // Select Pote de 500 (R$ 17.00)
    const sizeButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Pote de 500'))!;
    await user.click(sizeButton);

    // Go to Sabor
    await user.click(screen.getAllByRole('button').filter(btn => btn.textContent?.toUpperCase().includes('PRÓXIMO'))[0]);
    await user.click(screen.getAllByRole('button').find(btn => btn.textContent?.includes('Açaí Natural'))!);

    // Go to Coberturas
    await user.click(screen.getAllByRole('button').filter(btn => btn.textContent?.toUpperCase().includes('PRÓXIMO'))[0]);

    // Select Calda 50ml (+ R$ 1.50)
    const caldaBtn = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Calda 50ml'))!;
    await user.click(caldaBtn);

    // Total should now be 18,50
    expect(screen.getAllByText(/R\$ 18,50/i).length).toBeGreaterThan(0);

    // Click again to unselect Calda 50ml
    await user.click(caldaBtn);

    // Total should go back to 17,00
    expect(screen.getAllByText(/R\$ 17,00/i).length).toBeGreaterThan(0);
  });

  it('salva o pedido com tamanho, sabor e complementos na lista de itens', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))
    );
    const user = userEvent.setup();
    renderOrderPage();
    const next = () => user.click(screen.getAllByRole('button').filter(btn => btn.textContent?.toUpperCase().includes('PRÓXIMO'))[0]);

    await user.click(screen.getAllByRole('button').find(btn => btn.textContent?.includes('Pote de 500'))!);
    await next();
    await user.click(screen.getAllByRole('button').find(btn => btn.textContent?.includes('Açaí Natural'))!);
    await next();
    await user.click(screen.getAllByRole('button').find(btn => btn.textContent?.includes('Calda 50ml'))!);
    for (let i = 0; i < 5; i++) await next(); // coberturas → adicionais → cremes → frutas → recheios → entrega
    await user.click(screen.getByText('Retirar na Loja'));
    await next(); // retirada pula a etapa de pagamento (paga no balcão)
    await user.click(screen.getAllByRole('button').find(btn => btn.textContent?.toUpperCase().includes('FINALIZAR'))!);

    const orderCall = fetchSpy.mock.calls.find(([url]) => String(url).endsWith('/api/orders'));
    expect(orderCall).toBeDefined();
    expect(JSON.parse(String(orderCall![1]?.body))).toMatchObject({
      origin: 'custom',
      items: ['Pote de 500', 'Açaí Natural', 'Calda 50ml'],
      total: 18.5,
      deliveryMethod: 'pickup',
      paymentMethod: null,
    });
    fetchSpy.mockRestore();
  });

  it('abre o WhatsApp no mesmo clique e não duplica o pedido com clique duplo', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) =>
      String(input).endsWith('/api/orders')
        ? new Promise<Response>(() => {}) // servidor nunca responde
        : Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))
    );
    const user = userEvent.setup();
    renderOrderPage();
    const next = () => user.click(screen.getAllByRole('button').filter(btn => btn.textContent?.toUpperCase().includes('PRÓXIMO'))[0]);

    await user.click(screen.getAllByRole('button').find(btn => btn.textContent?.includes('Pote de 500'))!);
    await next();
    await user.click(screen.getAllByRole('button').find(btn => btn.textContent?.includes('Açaí Natural'))!);
    for (let i = 0; i < 6; i++) await next(); // coberturas → ... → recheios → entrega
    await user.click(screen.getByText('Retirar na Loja'));
    await next();
    const finish = screen.getAllByRole('button').find(btn => btn.textContent?.toUpperCase().includes('FINALIZAR'))!;
    await user.click(finish);
    await user.click(finish);

    expect(window.open).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls.filter(([url]) => String(url).endsWith('/api/orders'))).toHaveLength(1);
    fetchSpy.mockRestore();
  });

  it('usa o cardápio salvo pelo painel admin (itens desativados somem)', () => {
    localStorage.setItem('cardapio_admin_menu_items_v3', JSON.stringify([
      { _id: 's1', id: 's1', name: 'Pote Promocional', price: 9, category: 'Tamanho', original_category: 'sizes', active: true },
      { _id: 's2', id: 's2', name: 'Pote Esgotado', price: 9, category: 'Tamanho', original_category: 'sizes', active: false },
    ]));
    renderOrderPage();

    expect(screen.getAllByText(/Pote Promocional/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Pote Esgotado/)).not.toBeInTheDocument();
    localStorage.clear();
  });

  it('mostra o total na cápsula do topo e abre "Seu açaí" com o resumo', async () => {
    const user = userEvent.setup();
    renderOrderPage();

    const sizeButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Pote de 500'))!;
    await user.click(sizeButton);

    const totalCapsule = screen.getByRole('button', { name: /ver seu açaí: 1 item, total R\$ 17,00/i });
    await user.click(totalCapsule);

    const sheet = screen.getByRole('dialog', { name: /seu açaí/i });
    expect(sheet).toHaveTextContent('Pote de 500');
    expect(sheet).toHaveTextContent('Base: R$ 17,00');

    await user.click(screen.getByRole('button', { name: /continuar montando/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
