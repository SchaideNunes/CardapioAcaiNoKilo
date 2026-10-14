import { describe, it, expect, afterEach, vi } from 'vitest';

async function loadApi() {
  vi.resetModules();
  return import('@/lib/api');
}

describe('apiUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('usa o backend local quando VITE_API_URL não está definida', async () => {
    vi.stubEnv('VITE_API_URL', '');
    const { apiUrl } = await loadApi();
    expect(apiUrl('/api/menu')).toBe('http://localhost:3001/api/menu');
  });

  it('usa VITE_API_URL e ignora a barra final', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.acainokilo.com.br/');
    const { apiUrl } = await loadApi();
    expect(apiUrl('/api/orders')).toBe('https://api.acainokilo.com.br/api/orders');
  });
});
