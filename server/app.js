const express = require('express');
const { ObjectId } = require('mongodb');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateOrder, validateMenuItem, isNonEmptyString } = require('./validation');

const INVALID_CREDENTIALS = 'Usuário ou senha inválidos';
const MAX_USERNAME_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('senha-inexistente', 10);

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Monta a aplicação Express sem abrir porta nem conexão, para que possa ser
 * testada com um banco em memória.
 * @param {{ db: import('mongodb').Db, jwtSecret: string, menuCollection: string }} options
 */
function createApp({ db, jwtSecret, menuCollection }) {
  const app = express();
  const JWT_SECRET = jwtSecret;

  app.use(cors());
  // Limite acima do padrão (100kb) para comportar o upload de imagem em base64 do admin
  app.use(express.json({ limit: '300kb' }));

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
      const collection = db.collection(menuCollection);
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
    const { username, password } = req.body ?? {};
    if (!isNonEmptyString(username, MAX_USERNAME_LENGTH) || !isNonEmptyString(password, MAX_PASSWORD_LENGTH)) {
      return res.status(400).json({ error: 'Informe usuário e senha' });
    }

    try {
      // Comparação exata sem diferenciar maiúsculas; o texto digitado nunca é interpretado como regex
      const searchRegex = new RegExp(`^${escapeRegex(username.trim())}$`, 'i');
      const user = await db.collection('usuarios').findOne({
        $or: [{ username: searchRegex }, { email: searchRegex }]
      });

      // Compara contra um hash fictício quando o usuário não existe para não revelar, pelo tempo de resposta, quais usuários existem
      const passwordIsValid = await bcrypt.compare(password, user?.password ?? DUMMY_PASSWORD_HASH);
      if (!user || !passwordIsValid) {
        console.log('Tentativa de login recusada.');
        return res.status(401).json({ error: INVALID_CREDENTIALS });
      }

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
    const { value, error } = validateOrder(req.body);
    if (error) return res.status(422).json({ error });

    try {
      const order = { ...value, createdAt: new Date() };
      const result = await db.collection('pedidos').insertOne(order);
      res.status(201).json({ success: true, id: result.insertedId });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao salvar pedido' });
    }
  });

  // --- ROTAS PROTEGIDAS (ADMIN) ---

  // Buscar todos os itens (incluindo inativos)
  app.get('/api/admin/menu', verifyToken, async (req, res) => {
    try {
      const items = await db.collection(menuCollection).find({}).toArray();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar itens' });
    }
  });

  // Criar Novo Item
  app.post('/api/admin/menu', verifyToken, async (req, res) => {
    const { value, error } = validateMenuItem(req.body);
    if (error) return res.status(422).json({ error });

    try {
      const newItem = {
        name: value.name,
        price: value.price,
        category: value.category || value.original_category,
        original_category: value.original_category,
        image: value.image || '',
        description: value.description || '',
        type: value.type || '',
        active: value.active !== false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection(menuCollection).insertOne(newItem);
      res.status(201).json({ success: true, item: { ...newItem, _id: result.insertedId } });
    } catch (error) {
      console.error('Erro ao criar item:', error);
      res.status(500).json({ error: 'Erro ao criar item' });
    }
  });

  // Atualizar Item Completo (Preço, Nome, Foto, Categoria, Estoque)
  app.put('/api/admin/menu/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { value, error } = validateMenuItem(req.body, { partial: true });
    if (error) return res.status(422).json({ error });

    try {
      const updateData = { ...value, updatedAt: new Date() };

      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };
      const result = await db.collection(menuCollection).updateOne(query, { $set: updateData });

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
      const result = await db.collection(menuCollection).deleteOne(query);

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

  return app;
}

module.exports = { createApp };
