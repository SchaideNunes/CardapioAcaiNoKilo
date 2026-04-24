require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function setupAdmin() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const usersCollection = db.collection('usuarios');

    // 1. Remove o usuário 'admin' antigo por segurança
    await usersCollection.deleteOne({ username: 'admin' });
    console.log('Usuário "admin" removido.');

    // 2. Cria o seu usuário personalizado
    const username = 'schaidenunes';
    const password = 'Schaide134679852'; 
    const hashedPassword = await bcrypt.hash(password, 10);

    await usersCollection.updateOne(
      { username },
      { $set: { username, password: hashedPassword, role: 'boss' } },
      { upsert: true }
    );

    console.log(`Usuário "${username}" criado com sucesso!`);
  } finally {
    await client.close();
  }
}

setupAdmin();
