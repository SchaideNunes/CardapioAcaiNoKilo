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
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
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
    console.log(`Itens encontrados no banco: ${items.length}`);
    
    const menuData = {
      sizes: items.filter(i => i.original_category === 'sizes'),
      flavors: items.filter(i => i.original_category === 'flavors'),
      toppings: items.filter(i => i.original_category === 'toppings'),
      addons: items.filter(i => i.original_category === 'addons'),
      creams: items.filter(i => i.original_category === 'creams'),
      fruits: items.filter(i => i.original_category === 'fruits'),
      fillings: items.filter(i => i.original_category === 'fillings'),
      ready_made: items.filter(i => i.original_category === 'ready_made'),
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

// Criar Novo Item
app.post('/api/admin/menu', verifyToken, async (req, res) => {
  try {
    const { name, price, category, original_category, image, description, type, active } = req.body;
    
    if (!name || price === undefined || !original_category) {
      return res.status(400).json({ error: 'Nome, preço e categoria são obrigatórios' });
    }

    const newItem = {
      name: name.trim(),
      price: parseFloat(price) || 0,
      category: category || original_category,
      original_category,
      image: image || '',
      description: description || '',
      type: type || '',
      active: active !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection(process.env.COLLECTION_NAME).insertOne(newItem);
    res.status(201).json({ success: true, item: { ...newItem, _id: result.insertedId } });
  } catch (error) {
    console.error('Erro ao criar item:', error);
    res.status(500).json({ error: 'Erro ao criar item' });
  }
});

// Atualizar Item Completo (Preço, Nome, Foto, Categoria, Estoque)
app.put('/api/admin/menu/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, price, category, original_category, image, description, type, active } = req.body;
  
  try {
    const updateData = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name.trim();
    if (price !== undefined) updateData.price = parseFloat(price);
    if (category !== undefined) updateData.category = category;
    if (original_category !== undefined) updateData.original_category = original_category;
    if (image !== undefined) updateData.image = image;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (active !== undefined) updateData.active = Boolean(active);

    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };
    const result = await db.collection(process.env.COLLECTION_NAME).updateOne(query, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    res.json({ success: true, updated: updateData });
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    res.status(500).json({ error: 'Erro ao atualizar item' });
  }
});

// Excluir Item do Cardápio
app.delete('/api/admin/menu/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };
    const result = await db.collection(process.env.COLLECTION_NAME).deleteOne(query);

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    res.json({ success: true, message: 'Item removido com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir item:', error);
    res.status(500).json({ error: 'Erro ao excluir item' });
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
