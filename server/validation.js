// Validação de payloads recebidos pela API. Cada validador devolve
// { value } com apenas os campos conhecidos, ou { error } com a mensagem para o cliente.

const ORDER_ORIGINS = ['custom', 'ready_made'];
const DELIVERY_METHODS = ['pickup', 'delivery'];
const PAYMENT_METHODS = ['pix', 'card', 'cash'];

const MAX_ORDER_ITEMS = 100;
const MAX_ITEM_LENGTH = 120;
const MAX_ORDER_TOTAL = 10000;

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

function validateAddress(address) {
  if (!isPlainObject(address)) return { error: 'Endereço é obrigatório para entrega' };
  const { street, number, neighborhood } = address;
  if (!isNonEmptyString(street, 120) || !isNonEmptyString(number, 20) || !isNonEmptyString(neighborhood, 120)) {
    return { error: 'Endereço incompleto: informe rua, número e bairro' };
  }
  return { value: { street: street.trim(), number: number.trim(), neighborhood: neighborhood.trim() } };
}

/**
 * Valida o pedido vindo do site. O total é calculado no cliente e serve como
 * referência: o valor final é confirmado pela loja no WhatsApp.
 */
function validateOrder(body) {
  if (!isPlainObject(body)) return { error: 'Pedido inválido' };
  const { origin, items, total, deliveryMethod, paymentMethod = null, address, changeFor } = body;

  if (!ORDER_ORIGINS.includes(origin)) return { error: 'Origem do pedido inválida' };

  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ORDER_ITEMS) {
    return { error: `O pedido deve ter entre 1 e ${MAX_ORDER_ITEMS} itens` };
  }
  if (!items.every(item => isNonEmptyString(item, MAX_ITEM_LENGTH))) {
    return { error: 'Itens do pedido inválidos' };
  }

  if (typeof total !== 'number' || !Number.isFinite(total) || total < 0 || total > MAX_ORDER_TOTAL) {
    return { error: 'Total do pedido inválido' };
  }

  if (!DELIVERY_METHODS.includes(deliveryMethod)) return { error: 'Forma de entrega inválida' };
  if (paymentMethod !== null && !PAYMENT_METHODS.includes(paymentMethod)) {
    return { error: 'Forma de pagamento inválida' };
  }

  const order = {
    origin,
    items: items.map(item => item.trim()),
    total: Math.round(total * 100) / 100,
    deliveryMethod,
    paymentMethod,
  };

  if (deliveryMethod === 'delivery') {
    const result = validateAddress(address);
    if (result.error) return result;
    order.address = result.value;
  }

  if (paymentMethod === 'cash' && changeFor !== undefined && changeFor !== '') {
    if (!isNonEmptyString(changeFor, 20)) return { error: 'Valor de troco inválido' };
    order.changeFor = changeFor.trim();
  }

  return { value: order };
}

const MENU_CATEGORIES = ['sizes', 'flavors', 'toppings', 'addons', 'creams', 'fruits', 'fillings', 'ready_made'];
const MAX_PRICE = 10000;

function parsePrice(value) {
  const price = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0 || price > MAX_PRICE) return null;
  return Math.round(price * 100) / 100;
}

function isOptionalString(value, maxLength) {
  return typeof value === 'string' && value.length <= maxLength;
}

// Upload do admin chega como data URL; ~200KB cobre as fotos .webp otimizadas (15–30KB) com folga
const MAX_IMAGE_LENGTH = 200_000;
const IMAGE_PATTERN = /^(\/|https?:\/\/|data:image\/(webp|png|jpeg|gif|avif);base64,)/i;

function isValidImage(value) {
  return isOptionalString(value, MAX_IMAGE_LENGTH) && (value === '' || IMAGE_PATTERN.test(value));
}

/**
 * Valida um item do cardápio vindo do painel admin. Campos desconhecidos são
 * ignorados (o admin envia o formulário inteiro, com _id e afins).
 * @param {{ partial?: boolean }} options partial = atualização (PUT): só os campos enviados
 */
function validateMenuItem(body, { partial = false } = {}) {
  if (!isPlainObject(body)) return { error: 'Item inválido' };
  const { name, price, category, original_category, image, description, type, active } = body;
  const item = {};

  if (name !== undefined || !partial) {
    if (!isNonEmptyString(name, 120)) return { error: 'Nome é obrigatório (até 120 caracteres)' };
    item.name = name.trim();
  }
  if (price !== undefined || !partial) {
    const parsed = parsePrice(price);
    if (parsed === null) return { error: `Preço deve ser um número entre 0 e ${MAX_PRICE}` };
    item.price = parsed;
  }
  if (original_category !== undefined || !partial) {
    if (!MENU_CATEGORIES.includes(original_category)) return { error: 'Categoria inválida' };
    item.original_category = original_category;
  }

  if (image !== undefined) {
    if (!isValidImage(image)) return { error: 'Imagem inválida: use um caminho /assets, uma URL https ou um upload de imagem' };
    item.image = image;
  }

  const optionalStrings = { category: [category, 60], description: [description, 500], type: [type, 60] };
  for (const [field, [value, maxLength]] of Object.entries(optionalStrings)) {
    if (value === undefined) continue;
    if (!isOptionalString(value, maxLength)) return { error: `Campo ${field} inválido` };
    item[field] = value;
  }

  if (active !== undefined) {
    if (typeof active !== 'boolean') return { error: 'Campo active deve ser verdadeiro ou falso' };
    item.active = active;
  }

  if (partial && Object.keys(item).length === 0) return { error: 'Nenhum campo válido para atualizar' };
  return { value: item };
}

/**
 * Valida o filtro de período de GET /api/admin/orders (?from=&to=, datas ISO).
 * Os dois são opcionais; devolve o filtro do Mongo para createdAt.
 */
function validateDateRange(query) {
  const range = {};
  for (const key of ['from', 'to']) {
    const raw = query[key];
    if (raw === undefined) continue;
    if (typeof raw !== 'string') return { error: `Parâmetro ${key} inválido` };
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return { error: `Data inválida em ${key}` };
    range[key] = date;
  }
  if (range.from && range.to && range.from > range.to) return { error: 'O fim do período é anterior ao início' };

  const createdAt = {};
  if (range.from) createdAt.$gte = range.from;
  if (range.to) createdAt.$lte = range.to;
  return { value: Object.keys(createdAt).length ? { createdAt } : {} };
}

module.exports = { validateOrder, validateMenuItem, validateDateRange, isNonEmptyString, isPlainObject };
