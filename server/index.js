require('dotenv').config();
const { MongoClient } = require('mongodb');
const { createApp } = require('./app');

const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const client = new MongoClient(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
// O driver conecta sob demanda; as rotas respondem 500 enquanto o banco estiver indisponível.
const db = client.db(process.env.DB_NAME);

client.connect()
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

const app = createApp({ db, jwtSecret: JWT_SECRET, menuCollection: process.env.COLLECTION_NAME });

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
