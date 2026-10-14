import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { startTestServer, request, ADMIN } from './helpers.mjs';

let server;

beforeAll(async () => {
  server = await startTestServer();
});

afterAll(async () => {
  await server?.stop();
});

beforeEach(async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  await server.reset();
});

const validOrder = {
  origin: 'ready_made',
  items: ['1x Açaí Natural 500ml'],
  total: 18,
  deliveryMethod: 'pickup',
  paymentMethod: 'pix',
};

describe('configuração', () => {
  it.each([undefined, ''])('não monta o app sem segredo JWT (%s)', (jwtSecret) => {
    expect(() => server.createApp({ jwtSecret })).toThrow(/JWT_SECRET/);
  });
});

describe('headers de segurança (Helmet)', () => {
  it('envia headers de proteção e não expõe o Express', async () => {
    const res = await request(server.createApp()).get('/api/menu');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('CORS', () => {
  const app = () => server.createApp({ corsOrigins: ['https://acainokilo.com.br'] });

  it('libera origens da lista', async () => {
    const res = await request(app()).get('/api/menu').set('Origin', 'https://acainokilo.com.br');
    expect(res.headers['access-control-allow-origin']).toBe('https://acainokilo.com.br');
  });

  it('não libera outras origens', async () => {
    const res = await request(app()).get('/api/menu').set('Origin', 'https://site-malicioso.test');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('não libera nenhuma origem quando a lista está vazia', async () => {
    const res = await request(server.createApp({ corsOrigins: [] })).get('/api/menu').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('autenticação das rotas admin', () => {
  it.each([
    ['sem header', undefined],
    ['header sem Bearer', 'token-solto'],
    ['Bearer vazio', 'Bearer '],
  ])('responde 401 (%s)', async (_label, header) => {
    const req = request(server.createApp()).get('/api/admin/menu');
    const res = header === undefined ? await req : await req.set('Authorization', header);
    expect(res.status).toBe(401);
  });

  it('recusa token assinado com outro algoritmo/segredo', async () => {
    const forged = [
      Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url'),
      Buffer.from(JSON.stringify({ id: 'x', role: 'boss' })).toString('base64url'),
      '',
    ].join('.');
    const res = await request(server.createApp()).get('/api/admin/menu').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });
});

describe('rate limiting', () => {
  it('bloqueia força bruta no login após 5 tentativas por minuto', async () => {
    const app = server.createApp();
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/login').send({ username: ADMIN.username, password: 'errada' });
      expect(res.status).toBe(401);
    }

    const blocked = await request(app).post('/api/login').send({ username: ADMIN.username, password: ADMIN.password });

    expect(blocked.status).toBe(429);
    expect(blocked.body.token).toBeUndefined();
    expect(blocked.body.error).toBeTruthy();
  });

  it('limita o envio de pedidos por IP', async () => {
    const app = server.createApp();
    for (let i = 0; i < 10; i++) {
      expect((await request(app).post('/api/orders').send(validOrder)).status).toBe(201);
    }

    const blocked = await request(app).post('/api/orders').send(validOrder);

    expect(blocked.status).toBe(429);
    expect(await server.db.collection('pedidos').countDocuments()).toBe(10);
  });

  it('não limita a leitura do cardápio', async () => {
    const app = server.createApp();
    for (let i = 0; i < 15; i++) {
      expect((await request(app).get('/api/menu')).status).toBe(200);
    }
  });
});
