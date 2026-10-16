const express = require('express');
const { ObjectId } = require('mongodb');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateOrder, validateOrderStatus, validateMenuItem, validateDateRange, isNonEmptyString } = require('./validation');

const INVALID_CREDENTIALS = 'Usuário ou senha inválidos';
const MAX_USERNAME_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;
// Teto de segurança por consulta; um mês de pedidos de uma loja fica bem abaixo disso
const MAX_ORDERS_PER_QUERY = 2000;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('senha-inexistente', 10);

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createLimiter(limit, message) {
  return rateLimit({
    windowMs: 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: message },
  });
}

/**
 * Monta a aplicação Express sem abrir porta nem conexão, para que possa ser
 * testada com um banco em memória.
 * @param {object} options
 * @param {import('mongodb').Db} options.db
 * @param {string} options.jwtSecret segredo de assinatura dos tokens (obrigatório)
 * @param {string} options.menuCollection coleção do cardápio
 * @param {string[]} [options.corsOrigins] origens liberadas no CORS; vazio = nenhuma
 * @param {number | boolean} [options.trustProxy] saltos de proxy confiáveis, para o rate limit enxergar o IP real
 */
function createApp({ db, jwtSecret, menuCollection, corsOrigins = [], trustProxy = false }) {
  if (!jwtSecret) throw new Error('JWT_SECRET é obrigatório para iniciar a API');

  const app = express();
  const JWT_SECRET = jwtSecret;

  app.set('trust proxy', trustProxy);
  app.use(helmet());
  app.use(cors({ origin: (origin, callback) => callback(null, corsOrigins.includes(origin)) }));
  // Limite acima do padrão (100kb) para comportar o upload de imagem em base64 do admin
  app.use(express.json({ limit: '300kb' }));

  const loginLimiter = createLimiter(5, 'Muitas tentativas de login. Aguarde um minuto e tente novamente.');
  const ordersLimiter = createLimiter(10, 'Muitos pedidos em sequência. Aguarde um minuto e tente novamente.');

  // Middleware para verificar token JWT
  const verifyToken = (req, res, next) => {
    const [scheme, token] = (req.headers['authorization'] || '').split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Token de acesso ausente' });

    jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }, (err, decoded) => {
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
    } catch {
      res.status(500).json({ error: 'Erro ao buscar menu' });
    }
  });

  // Login Admin
  app.post('/api/login', loginLimiter, async (req, res) => {
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
    } catch (err) {
      console.error('Erro no servidor durante login:', err);
      res.status(500).json({ error: 'Erro no servidor' });
    }
  });

  // Salvar Pedido (Vindo do site)
  app.post('/api/orders', ordersLimiter, async (req, res) => {
    const { value, error } = validateOrder(req.body);
    if (error) return res.status(422).json({ error });

    try {
      const order = { ...value, status: 'new', createdAt: new Date() };
      const result = await db.collection('pedidos').insertOne(order);
      res.status(201).json({ success: true, id: result.insertedId });
    } catch {
      res.status(500).json({ error: 'Erro ao salvar pedido' });
    }
  });

  // --- ROTAS PROTEGIDAS (ADMIN) ---

  // Buscar todos os itens (incluindo inativos)
  app.get('/api/admin/menu', verifyToken, async (req, res) => {
    try {
      const items = await db.collection(menuCollection).find({}).toArray();
      res.json(items);
    } catch {
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
    } catch (err) {
      console.error('Erro ao criar item:', err);
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
    } catch (err) {
      console.error('Erro ao atualizar item:', err);
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
    } catch (err) {
      console.error('Erro ao excluir item:', err);
      res.status(500).json({ error: 'Erro ao excluir item' });
    }
  });

  // Buscar pedidos (opcionalmente de um período: ?from=&to= em ISO)
  // Atualizar o status de um pedido (novo, em preparo, pronto, concluído, cancelado)
  app.patch('/api/admin/orders/:id/status', verifyToken, async (req, res) => {
    const { value: status, error } = validateOrderStatus(req.body);
    if (error) return res.status(422).json({ error });
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Pedido não encontrado' });

    try {
      const result = await db.collection('pedidos').updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status, statusUpdatedAt: new Date() } }
      );
      if (result.matchedCount === 0) return res.status(404).json({ error: 'Pedido não encontrado' });
      res.json({ success: true, status });
    } catch (err) {
      console.error('Erro ao atualizar status do pedido:', err);
      res.status(500).json({ error: 'Erro ao atualizar status do pedido' });
    }
  });

  app.get('/api/admin/orders', verifyToken, async (req, res) => {
    const { value: filter, error } = validateDateRange(req.query);
    if (error) return res.status(422).json({ error });

    try {
      const orders = await db.collection('pedidos').find(filter).sort({ createdAt: -1 }).limit(MAX_ORDERS_PER_QUERY).toArray();
      res.json(orders);
    } catch {
      res.status(500).json({ error: 'Erro ao buscar pedidos' });
    }
  });

  return app;
}

module.exports = { createApp };
