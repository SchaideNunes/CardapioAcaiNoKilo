import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Os testes rodam a partir da raiz do projeto; reutiliza o binário do mongod baixado no postinstall de server/.
process.env.MONGOMS_DOWNLOAD_DIR ??= fileURLToPath(new URL('../node_modules/.cache/mongodb-memory-server', import.meta.url));

// Carrega os módulos CommonJS do servidor (e suas dependências em server/node_modules) pelo require nativo do Node.
const require = createRequire(import.meta.url);
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
export const request = require('supertest');
const { createApp } = require('../app.js');

export const JWT_SECRET = 'test-secret-with-enough-entropy-for-hs256-signing-0123456789abcdef';
export const MENU_COLLECTION = 'preco';
export const ADMIN = { username: 'admin@loja.test', password: 'senha-forte-de-teste' };

/** Sobe um MongoDB em memória e devolve helpers para montar o app nos testes. */
export async function startTestServer() {
  const mongo = await MongoMemoryServer.create();
  const client = new MongoClient(mongo.getUri());
  await client.connect();
  const db = client.db('cardapio-acai-test');

  return {
    db,
    createApp: (overrides = {}) => createApp({ db, jwtSecret: JWT_SECRET, menuCollection: MENU_COLLECTION, ...overrides }),
    async reset() {
      await db.dropDatabase();
      await db.collection('usuarios').insertOne({
        username: ADMIN.username,
        email: ADMIN.username,
        password: await bcrypt.hash(ADMIN.password, 10),
        role: 'boss',
      });
    },
    adminToken: () => jwt.sign({ id: 'test-admin', role: 'boss' }, JWT_SECRET, { expiresIn: 60 }),
    async stop() {
      await client.close();
      await mongo.stop();
    },
  };
}
