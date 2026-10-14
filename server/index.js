const path = require('path');
// Carrega server/.env mesmo quando iniciado da raiz (npm run server)
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { MongoClient } = require('mongodb');
const { createApp } = require('./app');

const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3001;
const MIN_SECRET_LENGTH = 32;
// Origens do Vite (dev e preview) liberadas por padrão fora de produção
const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173'];

function fail(message) {
  console.error(`[config] ${message}`);
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) fail('JWT_SECRET não definido em server/.env');
if (JWT_SECRET.length < MIN_SECRET_LENGTH) {
  const message = `JWT_SECRET tem ${JWT_SECRET.length} caracteres; use pelo menos ${MIN_SECRET_LENGTH} (recomendado 64).`;
  if (isProduction) fail(message);
  console.warn(`[config] ${message}`);
}

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
  : (isProduction ? [] : DEV_ORIGINS);
if (corsOrigins.length === 0) console.warn('[config] CORS_ORIGINS vazio: nenhum site poderá chamar a API pelo navegador.');

// Número de proxies reversos à frente do servidor (ex.: 1 no Render/Railway), para o rate limit usar o IP real do cliente
const trustProxy = process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : false;

const client = new MongoClient(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
// O driver conecta sob demanda; as rotas respondem 500 enquanto o banco estiver indisponível.
const db = client.db(process.env.DB_NAME);

client.connect()
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

const app = createApp({
  db,
  jwtSecret: JWT_SECRET,
  menuCollection: process.env.COLLECTION_NAME,
  corsOrigins,
  trustProxy,
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
