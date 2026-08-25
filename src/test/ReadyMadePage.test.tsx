import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ReadyMadePage from '@/pages/ReadyMadePage';

function renderPage() {
  return render(
    <MemoryRouter>
      <ReadyMadePage />
    </MemoryRouter>
  );
}

describe('ReadyMadePage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders the page title', () => {
    renderPage();
    expect(screen.getByText('Comprar Pronto')).toBeInTheDocument();
  });

  it('renders all 13 products', () => {
    renderPage();
    const productNames = ['Açaí Natural', 'Açaí c/ Banana', 'Açaí c/ Morango'];
    productNames.forEach(name => {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    });
    // Count product images
    const images = screen.getAllByRole('img').filter(img => img.getAttribute('alt') !== 'Logo');
    expect(images.length).toBe(13);
  });

  it('shows product names and prices', () => {
    renderPage();
    expect(screen.getAllByText('Açaí Natural').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/18/).length).toBeGreaterThan(0);
  });

  it('displays the back link to home', () => {
    renderPage();
    const backLink = screen.getByRole('link');
    expect(backLink).toHaveAttribute('href', '/');
  });

  it('cart badge shows 0 initially', () => {
    renderPage();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('selects a product when clicking on it (toggle style)', async () => {
    const user = userEvent.setup();
    renderPage();

    // Click the first product card
    const productButtons = screen.getAllByRole('button');
    const productButton = productButtons.find(btn => btn.textContent?.includes('Açaí Natural'))!;
    await user.click(productButton);

    // Should now be selected
    expect(productButton.className).toContain('bg-primary');
  });

  it('deselects a product when clicking again', async () => {
    const user = userEvent.setup();
    renderPage();

    const productButtons = screen.getAllByRole('button');
    const productButton = productButtons.find(btn => btn.textContent?.includes('Açaí Natural'))!;

    // Select
    await user.click(productButton);
    expect(productButton.className).toContain('bg-primary');

    // Deselect
    await user.click(productButton);
    expect(productButton.className).toContain('bg-black/20');
  });

  it('shows bottom bar when a product is selected', async () => {
    const user = userEvent.setup();
    renderPage();

    // Initially no bottom bar
    expect(screen.queryByText(/item/)).not.toBeInTheDocument();

    // Select a product
    const productButtons = screen.getAllByRole('button');
    const productButton = productButtons.find(btn => btn.textContent?.includes('Açaí Natural'))!;
    await user.click(productButton);

    // Bottom bar should appear
    expect(screen.getByText('1 item')).toBeInTheDocument();
  });

  it('can select multiple different products', async () => {
    const user = userEvent.setup();
    renderPage();

    const productButtons = screen.getAllByRole('button');
    const product1 = productButtons.find(btn => btn.textContent?.includes('Açaí Natural'))!;
    const product2 = productButtons.find(btn => btn.textContent?.includes('Açaí c/ Banana'))!;

    await user.click(product1);
    await user.click(product2);

    // Should show "2 itens"
    expect(screen.getByText('2 itens')).toBeInTheDocument();
  });

  it('opens cart drawer and shows selected products', async () => {
    const user = userEvent.setup();
    renderPage();

    // Select a product
    const productButtons = screen.getAllByRole('button');
    const productButton = productButtons.find(btn => btn.textContent?.includes('Açaí Natural'))!;
    await user.click(productButton);

    // Click "Ver" in footer to open cart
    await user.click(screen.getByText('Ver'));

    // Cart should show "Seu Pedido"
    expect(screen.getByText('Seu Pedido')).toBeInTheDocument();
  });

  it('shows checkout modal with delivery and payment options', async () => {
    const user = userEvent.setup();
    renderPage();

    // Select a product
    const productButtons = screen.getAllByRole('button');
    const productButton = productButtons.find(btn => btn.textContent?.includes('Açaí Natural'))!;
    await user.click(productButton);

    // Click "Finalizar" in bottom bar
    const finalizarBtn = screen.getByText('Finalizar');
    await user.click(finalizarBtn);

    // Checkout modal should show
    expect(screen.getByText('Finalizar Pedido')).toBeInTheDocument();
    expect(screen.getByText('1. Entrega')).toBeInTheDocument();
    expect(screen.getByText('2. Pagamento')).toBeInTheDocument();
  });

  it('disables "Enviar Pedido" until form is complete', async () => {
    const user = userEvent.setup();
    renderPage();

    const productButtons = screen.getAllByRole('button');
    const productButton = productButtons.find(btn => btn.textContent?.includes('Açaí Natural'))!;
    await user.click(productButton);

    await user.click(screen.getByText('Finalizar'));

    const sendButton = screen.getByText('Enviar Pedido').closest('button');
    expect(sendButton).toBeDisabled();
  });

  it('enables "Enviar Pedido" when pickup + pix selected', async () => {
    const user = userEvent.setup();
    renderPage();

    const productButtons = screen.getAllByRole('button');
    const productButton = productButtons.find(btn => btn.textContent?.includes('Açaí Natural'))!;
    await user.click(productButton);
    await user.click(screen.getByText('Finalizar'));

    await user.click(screen.getByText('Retirar'));
    await user.click(screen.getByText('Pix'));

    const sendButton = screen.getByText('Enviar Pedido').closest('button');
    expect(sendButton).not.toBeDisabled();
  });

  it('shows address fields when delivery is selected', async () => {
    const user = userEvent.setup();
    renderPage();

    const productButtons = screen.getAllByRole('button');
    const productButton = productButtons.find(btn => btn.textContent?.includes('Açaí Natural'))!;
    await user.click(productButton);
    await user.click(screen.getByText('Finalizar'));

    await user.click(screen.getByText('Receber'));

    expect(screen.getByPlaceholderText('Rua')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Número')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Bairro / Complemento')).toBeInTheDocument();
  });

  it('removes a product from cart via cart drawer', async () => {
    const user = userEvent.setup();
    renderPage();

    // Select two products
    const productButtons = screen.getAllByRole('button');
    const product1 = productButtons.find(btn => btn.textContent?.includes('Açaí Natural'))!;
    const product2 = productButtons.find(btn => btn.textContent?.includes('Açaí c/ Banana'))!;
    await user.click(product1);
    await user.click(product2);

    expect(screen.getByText('2 itens')).toBeInTheDocument();

    // Open cart
    await user.click(screen.getByText('Ver'));
    expect(screen.getByText('Seu Pedido')).toBeInTheDocument();

    // Find and click trash button
    const trashButtons = screen.getAllByRole('button').filter(btn =>
      btn.className.includes('bg-red-500/10')
    );
    expect(trashButtons.length).toBe(2);
    await user.click(trashButtons[0]);

    const remainingTrash = screen.getAllByRole('button').filter(btn =>
      btn.className.includes('bg-red-500/10')
    );
    expect(remainingTrash.length).toBe(1);
  });

  it('calculates total correctly with multiple products', async () => {
    const user = userEvent.setup();
    renderPage();

    // Açaí Natural = 18.00, Açaí c/ Banana = 20.00
    const productButtons = screen.getAllByRole('button');
    const product1 = productButtons.find(btn => btn.textContent?.includes('Açaí Natural'))!;
    const product2 = productButtons.find(btn => btn.textContent?.includes('Açaí c/ Banana'))!;
    await user.click(product1);
    await user.click(product2);

    // Total should be R$ 38.00
    expect(screen.getAllByText(/38\.00/).length).toBeGreaterThan(0);
  });
});
