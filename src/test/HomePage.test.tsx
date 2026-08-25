import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  it('renders the "Monte o seu" link', () => {
    renderHomePage();
    expect(screen.getByText('Monte o seu')).toBeInTheDocument();
  });

  it('renders the "Compre Pronto" link', () => {
    renderHomePage();
    expect(screen.getByText('Compre Pronto')).toBeInTheDocument();
  });

  it('"Monte o seu" link points to /montar', () => {
    renderHomePage();
    const link = screen.getByText('Monte o seu').closest('a');
    expect(link).toHaveAttribute('href', '/montar');
  });

  it('"Compre Pronto" link points to /prontos', () => {
    renderHomePage();
    const link = screen.getByText('Compre Pronto').closest('a');
    expect(link).toHaveAttribute('href', '/prontos');
  });

  it('shows the footer brand name "Açaí no Kilo"', () => {
    renderHomePage();
    expect(screen.getByText(/Açaí no Kilo/)).toBeInTheDocument();
  });

  it('shows preloader when first visiting', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    expect(screen.getByText(/preparando seu açaí/i)).toBeInTheDocument();
  });

  it('skips preloader on subsequent visits', () => {
    sessionStorage.setItem('preloaderDone', 'true');
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    expect(screen.queryByText(/preparando seu açaí/i)).not.toBeInTheDocument();
  });
});
