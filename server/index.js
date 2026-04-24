require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function getMenuData() {
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection(process.env.COLLECTION_NAME);
    
    const items = await collection.find({}).toArray();
    
    // Organiza os dados no formato que o frontend espera
    const menuData = {
      sizes: items.filter(i => i.original_category === 'sizes'),
      flavors: items.filter(i => i.original_category === 'flavors'),
      toppings: items.filter(i => i.original_category === 'toppings'),
      addons: items.filter(i => i.original_category === 'addons'),
      creams: items.filter(i => i.original_category === 'creams'),
      fruits: items.filter(i => i.original_category === 'fruits'),
      fillings: items.filter(i => i.original_category === 'fillings'),
    };
    
    return menuData;
  } finally {
    // Não fechamos a conexão aqui para manter o pool ativo
  }
}

app.get('/api/menu', async (req, res) => {
  try {
    const data = await getMenuData();
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
