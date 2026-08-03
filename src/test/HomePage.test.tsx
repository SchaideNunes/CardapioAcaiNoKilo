import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '@/pages/HomePage';

function renderHomePage() {
  // Skip preloader by setting sessionStorage
  sessionStorage.setItem('preloaderDone', 'true');
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders the logo image', () => {
    renderHomePage();
    const logo = screen.getByAltText('Logo Açaí');
    expect(logo).toBeInTheDocument();
  });

  it('renders the "Criar o Seu" link', () => {
    renderHomePage();
    expect(screen.getByText('Criar o Seu')).toBeInTheDocument();
  });

  it('renders the "Comprar Pronto" link', () => {
    renderHomePage();
    expect(screen.getByText('Comprar Pronto')).toBeInTheDocument();
  });

  it('"Criar o Seu" link points to /montar', () => {
    renderHomePage();
    const link = screen.getByText('Criar o Seu').closest('a');
    expect(link).toHaveAttribute('href', '/montar');
  });

  it('"Comprar Pronto" link points to /prontos', () => {
    renderHomePage();
    const link = screen.getByText('Comprar Pronto').closest('a');
    expect(link).toHaveAttribute('href', '/prontos');
  });

  it('displays the hero image', () => {
    renderHomePage();
    const heroImage = screen.getByAltText('Açaí');
    expect(heroImage).toBeInTheDocument();
    expect(heroImage).toHaveAttribute('src', '/assets/Açai_hero.webp');
  });

  it('shows the footer brand name "Açaí no Kilo"', () => {
    renderHomePage();
    expect(screen.getByText(/Açaí no Kilo/)).toBeInTheDocument();
  });

  it('shows preloader when first visiting', () => {
    // Don't set sessionStorage - preloader should be shown
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Preparando seu açaí/)).toBeInTheDocument();
  });

  it('skips preloader on subsequent visits', () => {
    sessionStorage.setItem('preloaderDone', 'true');
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    expect(screen.queryByText(/Preparando seu açaí/)).not.toBeInTheDocument();
  });
});
