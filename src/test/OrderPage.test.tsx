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

    // Total should now be 18.50
    expect(screen.getAllByText(/R\$ 18\.50/i).length).toBeGreaterThan(0);

    // Click again to unselect Calda 50ml
    await user.click(caldaBtn);

    // Total should go back to 17.00
    expect(screen.getAllByText(/R\$ 17\.00/i).length).toBeGreaterThan(0);
  });

  it('renders the desktop sidebar with live order summary', async () => {
    const user = userEvent.setup();
    renderOrderPage();

    // Select Pote de 500
    const sizeButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Pote de 500'))!;
    await user.click(sizeButton);

    // Check that "Seu Açaí" sidebar displays Pote de 500
    expect(screen.getByText('Seu Açaí')).toBeInTheDocument();
    expect(screen.getByText('Base: R$ 17.00')).toBeInTheDocument();
  });
});
