import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { startTestServer, request, ADMIN, MENU_COLLECTION } from './helpers.mjs';

let server;
let app;

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
  app = server.createApp();
});

const auth = () => ({ Authorization: `Bearer ${server.adminToken()}` });

describe('GET /api/menu', () => {
  it('agrupa os itens ativos por categoria e omite os desativados', async () => {
    await server.db.collection(MENU_COLLECTION).insertMany([
      { id: 'pot_500', name: 'Pote de 500', price: 17, original_category: 'sizes' },
      { id: 'f_natural', name: 'Açaí Natural', price: 0, original_category: 'flavors' },
      { id: 'fr_kiwi', name: 'Kiwi', price: 1.5, original_category: 'fruits', active: false },
    ]);

    const res = await request(app).get('/api/menu');

    expect(res.status).toBe(200);
    expect(res.body.sizes.map(i => i.name)).toEqual(['Pote de 500']);
    expect(res.body.flavors.map(i => i.name)).toEqual(['Açaí Natural']);
    expect(res.body.fruits).toEqual([]);
    expect(Object.keys(res.body)).toEqual(
      ['sizes', 'flavors', 'toppings', 'addons', 'creams', 'fruits', 'fillings', 'ready_made']
    );
  });
});

describe('POST /api/login', () => {
  it('devolve um token com credenciais válidas (e-mail sem diferenciar maiúsculas)', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: ADMIN.username.toUpperCase(), password: ADMIN.password });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ auth: true, role: 'boss' });
    expect(typeof res.body.token).toBe('string');
  });

  it('recusa senha incorreta com 401', async () => {
    const res = await request(app).post('/api/login').send({ username: ADMIN.username, password: 'errada' });
    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  it('responde igual para usuário inexistente e senha errada (sem enumeração de usuários)', async () => {
    const wrongPassword = await request(app).post('/api/login').send({ username: ADMIN.username, password: 'errada' });
    const unknownUser = await request(app).post('/api/login').send({ username: 'ninguem@loja.test', password: 'errada' });

    expect(unknownUser.status).toBe(401);
    expect(unknownUser.body).toEqual(wrongPassword.body);
  });

  it.each(['.*', 'admin.*', '^.+$', '[a-z@.]+'])('trata o usuário como texto literal, não regex (%s)', async (username) => {
    const res = await request(app).post('/api/login').send({ username, password: ADMIN.password });
    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  it.each([
    ['operador NoSQL no usuário', { username: { $gt: '' }, password: ADMIN.password }],
    ['operador NoSQL na senha', { username: ADMIN.username, password: { $ne: null } }],
    ['campos ausentes', {}],
    ['usuário vazio', { username: '   ', password: ADMIN.password }],
    ['usuário longo demais', { username: 'a'.repeat(300), password: ADMIN.password }],
  ])('recusa payload inválido com 400 (%s)', async (_label, body) => {
    const res = await request(app).post('/api/login').send(body);
    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
  });
});

describe('POST /api/orders', () => {
  const validOrder = () => ({
    origin: 'ready_made',
    items: ['1x Açaí Natural 500ml'],
    total: 18,
    deliveryMethod: 'pickup',
    paymentMethod: 'pix',
  });

  const deliveryOrder = () => ({
    ...validOrder(),
    total: 25,
    deliveryMethod: 'delivery',
    paymentMethod: 'cash',
    changeFor: '50',
    address: { street: 'Rua das Flores', number: '42', neighborhood: 'Centro' },
  });

  it('grava o pedido com data de criação', async () => {
    const res = await request(app).post('/api/orders').send(validOrder());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const saved = await server.db.collection('pedidos').findOne({});
    expect(saved).toMatchObject({ origin: 'ready_made', total: 18, items: ['1x Açaí Natural 500ml'] });
    expect(saved.createdAt).toBeInstanceOf(Date);
  });

  it('grava endereço e troco de pedidos de entrega em dinheiro', async () => {
    const res = await request(app).post('/api/orders').send(deliveryOrder());

    expect(res.status).toBe(201);
    const saved = await server.db.collection('pedidos').findOne({});
    expect(saved).toMatchObject({
      deliveryMethod: 'delivery',
      paymentMethod: 'cash',
      changeFor: '50',
      address: { street: 'Rua das Flores', number: '42', neighborhood: 'Centro' },
    });
  });

  it('aceita retirada sem forma de pagamento (pagamento no balcão)', async () => {
    const res = await request(app).post('/api/orders').send({ ...validOrder(), origin: 'custom', paymentMethod: null });
    expect(res.status).toBe(201);
  });

  it('grava apenas os campos conhecidos e ignora o que o cliente controlar a mais', async () => {
    await request(app).post('/api/orders').send({
      ...validOrder(),
      size: { id: 'pot_500', name: 'Pote de 500', price: 17 },
      createdAt: '1999-01-01',
      _id: 'forjado',
      status: 'pago',
      address: { street: 'Rua X', number: '1', neighborhood: 'Y' }, // ignorado: pedido é retirada
    });

    const saved = await server.db.collection('pedidos').findOne({});
    expect(Object.keys(saved).sort()).toEqual(
      ['_id', 'createdAt', 'deliveryMethod', 'items', 'origin', 'paymentMethod', 'total'].sort()
    );
    expect(saved._id).not.toBe('forjado');
    expect(saved.createdAt.getFullYear()).toBeGreaterThan(2000);
  });

  it.each([
    ['sem itens', { items: [] }],
    ['itens que não são texto', { items: [{ $gt: '' }] }],
    ['item longo demais', { items: ['x'.repeat(500)] }],
    ['itens demais', { items: Array.from({ length: 101 }, (_, i) => `item ${i}`) }],
    ['total negativo', { total: -5 }],
    ['total que não é número', { total: '18' }],
    ['total absurdo', { total: 1e9 }],
    ['origem desconhecida', { origin: 'hacker' }],
    ['entrega desconhecida', { deliveryMethod: 'drone' }],
    ['pagamento desconhecido', { paymentMethod: 'boleto' }],
    ['entrega sem endereço', { deliveryMethod: 'delivery', address: undefined }],
    ['endereço incompleto', { deliveryMethod: 'delivery', address: { street: 'Rua', number: '', neighborhood: 'Centro' } }],
    ['endereço com operador', { deliveryMethod: 'delivery', address: { street: { $ne: '' }, number: '1', neighborhood: 'C' } }],
  ])('recusa pedido inválido com 422 (%s)', async (_label, patch) => {
    const res = await request(app).post('/api/orders').send({ ...validOrder(), ...patch });

    expect(res.status).toBe(422);
    expect(res.body.error).toBeTruthy();
    expect(await server.db.collection('pedidos').countDocuments()).toBe(0);
  });

  it('recusa corpo que não é um objeto JSON', async () => {
    const res = await request(app).post('/api/orders').set('Content-Type', 'application/json').send('[1,2,3]');
    expect(res.status).toBe(422);
  });
});

describe('rotas /api/admin', () => {
  it('rejeitam requisições sem token', async () => {
    const res = await request(app).get('/api/admin/menu');
    expect([401, 403]).toContain(res.status);
  });

  it('rejeitam token inválido com 401', async () => {
    const res = await request(app).get('/api/admin/orders').set('Authorization', 'Bearer token-falso');
    expect(res.status).toBe(401);
  });

  it('criam, listam, atualizam e excluem itens do cardápio', async () => {
    const created = await request(app).post('/api/admin/menu').set(auth())
      .send({ name: '  Kiwi  ', price: '1.5', original_category: 'fruits' });
    expect(created.status).toBe(201);
    expect(created.body.item).toMatchObject({ name: 'Kiwi', price: 1.5, category: 'fruits', active: true });
    const id = created.body.item._id;

    const updated = await request(app).put(`/api/admin/menu/${id}`).set(auth()).send({ price: 2, active: false });
    expect(updated.status).toBe(200);

    const list = await request(app).get('/api/admin/menu').set(auth());
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ name: 'Kiwi', price: 2, active: false });

    const deleted = await request(app).delete(`/api/admin/menu/${id}`).set(auth());
    expect(deleted.status).toBe(200);
    expect(await server.db.collection(MENU_COLLECTION).countDocuments()).toBe(0);
  });

  it('atualizam itens pelo id legado (string) do seed', async () => {
    await server.db.collection(MENU_COLLECTION).insertOne({ id: 'fr_kiwi', name: 'Kiwi', price: 1.5, original_category: 'fruits' });

    const res = await request(app).put('/api/admin/menu/fr_kiwi').set(auth()).send({ price: 1.75 });

    expect(res.status).toBe(200);
    expect((await server.db.collection(MENU_COLLECTION).findOne({ id: 'fr_kiwi' })).price).toBe(1.75);
  });

  it('devolvem 404 para item inexistente', async () => {
    const res = await request(app).delete('/api/admin/menu/nao_existe').set(auth());
    expect(res.status).toBe(404);
  });

  it('listam pedidos do mais recente para o mais antigo', async () => {
    await server.db.collection('pedidos').insertMany([
      { items: ['antigo'], total: 10, createdAt: new Date('2026-10-01T10:00:00Z') },
      { items: ['recente'], total: 20, createdAt: new Date('2026-10-14T10:00:00Z') },
    ]);

    const res = await request(app).get('/api/admin/orders').set(auth());

    expect(res.status).toBe(200);
    expect(res.body.map(o => o.items[0])).toEqual(['recente', 'antigo']);
  });
});
