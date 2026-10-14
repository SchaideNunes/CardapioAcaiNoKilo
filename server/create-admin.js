const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MIN_PASSWORD_LENGTH = 12;

// Uso: ADMIN_EMAIL=dono@loja.com ADMIN_PASSWORD='...' node server/create-admin.js
// (ou defina as duas variáveis em server/.env). A senha nunca fica no código nem nos logs.
async function setupAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    console.error('Defina ADMIN_EMAIL e ADMIN_PASSWORD (no ambiente ou em server/.env).');
    process.exit(1);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`ADMIN_PASSWORD precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const usersCollection = db.collection('usuarios');

    // 1. Remove o usuário 'admin' antigo por segurança
    await usersCollection.deleteOne({ username: 'admin' });

    // 2. Cria ou redefine o administrador informado
    const hashedPassword = await bcrypt.hash(password, 12);
    await usersCollection.updateOne(
      { username: email },
      { $set: { username: email, email, password: hashedPassword, role: 'boss' } },
      { upsert: true }
    );

    console.log(`Administrador "${email}" configurado com sucesso!`);
  } finally {
    await client.close();
  }
}

setupAdmin();
