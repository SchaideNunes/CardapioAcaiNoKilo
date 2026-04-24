require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  connectTimeoutMS: 30000,
  tls: true,
  tlsAllowInvalidCertificates: false,
});
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db(process.env.DB_NAME);
    console.log('Conectado ao MongoDB');
  } catch (err) {
    console.error('Erro ao conectar ao MongoDB:', err);
  }
}
connectDB();

// Middleware para verificar token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: 'Nenhum token fornecido' });

  jwt.verify(token.split(' ')[1], JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Falha na autenticação do token' });
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

// --- ROTAS PÚBLICAS ---

// Buscar Cardápio
app.get('/api/menu', async (req, res) => {
  try {
    const collection = db.collection(process.env.COLLECTION_NAME);
    const items = await collection.find({ active: { $ne: false } }).toArray();
    
    const menuData = {
      sizes: items.filter(i => i.original_category === 'sizes'),
      flavors: items.filter(i => i.original_category === 'flavors'),
      toppings: items.filter(i => i.original_category === 'toppings'),
      addons: items.filter(i => i.original_category === 'addons'),
      creams: items.filter(i => i.original_category === 'creams'),
      fruits: items.filter(i => i.original_category === 'fruits'),
      fillings: items.filter(i => i.original_category === 'fillings'),
    };
    res.json(menuData);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar menu' });
  }
});

// Login Admin
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`Tentativa de login para usuário: ${username}`);
  try {
    const user = await db.collection('usuarios').findOne({ username });
    if (!user) {
      console.log('Usuário não encontrado no banco.');
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const passwordIsValid = await bcrypt.compare(password, user.password);
    console.log(`Senha válida? ${passwordIsValid}`);
    
    if (!passwordIsValid) return res.status(401).json({ error: 'Senha incorreta' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: 86400 }); // 24h
    console.log('Login bem-sucedido, gerando token.');
    res.json({ auth: true, token, role: user.role });
  } catch (error) {
    console.error('Erro no servidor durante login:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Salvar Pedido (Vindo do site)
app.post('/api/orders', async (req, res) => {
  try {
    const order = { ...req.body, createdAt: new Date() };
    const result = await db.collection('pedidos').insertOne(order);
    res.json({ success: true, id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar pedido' });
  }
});

// --- ROTAS PROTEGIDAS (ADMIN) ---

// Buscar todos os itens (incluindo inativos)
app.get('/api/admin/menu', verifyToken, async (req, res) => {
  try {
    const items = await db.collection(process.env.COLLECTION_NAME).find({}).toArray();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar itens' });
  }
});

// Atualizar Preço/Estoque
app.put('/api/admin/menu/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { price, active } = req.body;
  try {
    await db.collection(process.env.COLLECTION_NAME).updateOne(
      { _id: new ObjectId(id) },
      { $set: { price: parseFloat(price), active } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar item' });
  }
});

// Buscar Pedidos do Dia
app.get('/api/admin/orders', verifyToken, async (req, res) => {
  try {
    const orders = await db.collection('pedidos').find().sort({ createdAt: -1 }).limit(50).toArray();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
