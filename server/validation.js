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

module.exports = { validateOrder, isNonEmptyString, isPlainObject };
