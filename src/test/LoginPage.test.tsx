import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import { DEMO_TOKEN } from '@/lib/demo';

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<p>Painel carregado</p>} />
      </Routes>
    </MemoryRouter>
  );
}

async function submit(username: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/e-mail \/ usuário/i), username);
  await user.type(screen.getByLabelText(/senha de acesso/i), password);
  await user.click(screen.getByRole('button', { name: /entrar no painel/i }));
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('com o servidor online', () => {
    it('guarda o token devolvido pela API e abre o painel', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ auth: true, token: 'jwt-real', role: 'boss' }), { status: 200 })
      );
      renderLogin();

      await submit('dono@loja.test', 'senha-correta');

      expect(await screen.findByText('Painel carregado')).toBeInTheDocument();
      expect(localStorage.getItem('adminToken')).toBe('jwt-real');
    });

    it('mostra a mensagem do servidor quando recusa', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ error: 'Usuário ou senha inválidos' }), { status: 401 })
      );
      renderLogin();

      await submit('admin', 'admin');

      expect(await screen.findByText('Usuário ou senha inválidos')).toBeInTheDocument();
      expect(localStorage.getItem('adminToken')).toBeNull();
    });
  });

  describe('com o servidor offline (modo demonstração)', () => {
    beforeEach(() => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    });

    it('entra no painel demo com admin/admin', async () => {
      renderLogin();

      await submit('admin', 'admin');

      expect(await screen.findByText('Painel carregado')).toBeInTheDocument();
      expect(localStorage.getItem('adminToken')).toBe(DEMO_TOKEN);
    });

    it('não aceita nenhuma credencial além da de demonstração', async () => {
      renderLogin();

      await submit('dono@loja.test', 'senha-pessoal-do-dono');

      expect(await screen.findByText(/e-mail ou senha incorretos/i)).toBeInTheDocument();
      expect(localStorage.getItem('adminToken')).toBeNull();
    });

    it('fica desligado quando VITE_DEMO_MODE=false', async () => {
      vi.stubEnv('VITE_DEMO_MODE', 'false');
      renderLogin();

      await submit('admin', 'admin');

      expect(await screen.findByText(/servidor indisponível/i)).toBeInTheDocument();
      expect(localStorage.getItem('adminToken')).toBeNull();
    });
  });

  it('usa um placeholder genérico no e-mail', () => {
    renderLogin();
    expect(screen.getByLabelText(/e-mail \/ usuário/i)).toHaveAttribute('placeholder', 'seu@email.com');
  });
});
