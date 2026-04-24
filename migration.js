const data = {
  sizes: [
    { id: "cup_360", name: "Copo 360ml", price: 14.00, category: "Tamanho", type: "Copo" },
    { id: "cup_500", name: "Copo 500ml", price: 17.00, category: "Tamanho", type: "Copo" },
    { id: "cup_750", name: "Copo 750ml", price: 22.00, category: "Tamanho", type: "Copo" },
    { id: "pot_500", name: "Pote 500ml", price: 17.99, category: "Tamanho", type: "Pote" },
    { id: "pot_1l", name: "Pote 1L", price: 29.99, category: "Tamanho", type: "Pote" },
    { id: "pot_2l", name: "Pote 2L", price: 49.99, category: "Tamanho", type: "Pote" },
  ],
  flavors: [
    { id: "f_natural", name: "Açaí Natural", price: 0, category: "Sabor" },
    { id: "f_banana", name: "Açaí Banana", price: 0, category: "Sabor" },
    { id: "f_morango", name: "Açaí Morango", price: 0, category: "Sabor" },
    { id: "f_diet", name: "Açaí Diet", price: 0, category: "Sabor" },
  ],
  toppings: [
    { id: "t_calda", name: "Calda 50ml", price: 1.50, category: "Cobertura" },
    { id: "t_leite_cond", name: "Leite condensado 50ml", price: 1.50, category: "Cobertura" },
    { id: "t_mel", name: "Mel 50ml", price: 2.50, category: "Cobertura" },
    { id: "t_melaco", name: "Melaço 50ml", price: 1.50, category: "Cobertura" },
  ],
  addons: [
    { id: "a_granola_trad", name: "Granola tradicional 50ml", price: 1.00, category: "Adicional" },
    { id: "a_granulado_croc", name: "Granulado crocante 50ml", price: 1.00, category: "Adicional" },
    { id: "a_farinha_lactea", name: "Farinha láctea nestlé 50ml", price: 1.50, category: "Adicional" },
    { id: "a_amendoim", name: "Amendoim torrado 50ml", price: 1.00, category: "Adicional" },
    { id: "a_neston", name: "Neston 50ml", price: 1.00, category: "Adicional" },
    { id: "a_aveia", name: "Aveia 50ml", price: 1.00, category: "Adicional" },
    { id: "a_castanha", name: "Castanha de caju 50ml", price: 2.00, category: "Adicional" },
    { id: "a_chocopower", name: "Chocopower ao leite e branco 50ml", price: 1.50, category: "Adicional" },
    { id: "a_chocoball", name: "Choco power ball 50ml", price: 1.50, category: "Adicional" },
    { id: "a_mini_pastilha", name: "Mini pastilha confeitada 50ml", price: 1.50, category: "Adicional" },
    { id: "a_leite_po", name: "Leite em pó 50ml", price: 2.00, category: "Adicional" },
    { id: "a_sucrilhos", name: "Cereal nestlé sucrilhos 50ml", price: 1.00, category: "Adicional" },
    { id: "a_gotas_pingo", name: "Gotas pingo de chocolate 50ml", price: 1.50, category: "Adicional" },
    { id: "a_coco_flocado", name: "Coco flocado 50ml", price: 1.50, category: "Adicional" },
    { id: "a_negresco", name: "Biscoito negresco 50ml", price: 1.00, category: "Adicional" },
    { id: "a_farofa_pacoca", name: "Farofa de paçoca 50ml", price: 1.00, category: "Adicional" },
    { id: "a_uva_passas", name: "Uva passas 50ml", price: 1.00, category: "Adicional" },
    { id: "a_jujuba", name: "Jujuba gomets 50ml", price: 1.00, category: "Adicional" },
    { id: "a_bis_leite", name: "Bis ao leite", price: 1.50, category: "Adicional" },
    { id: "a_bis_branco", name: "Bis branco", price: 1.50, category: "Adicional" },
    { id: "a_bombom", name: "Bombom", price: 1.00, category: "Adicional" },
    { id: "a_bala_goma", name: "Bala de goma porção", price: 2.00, category: "Adicional" },
  ],
  creams: [
    { id: "c_cupuacu", name: "Creme de Cupuaçu 100ml", price: 3.00, category: "Creme" },
    { id: "c_morango", name: "Creme de Morango 100ml", price: 3.00, category: "Creme" },
    { id: "c_maracuja", name: "Creme Mousse de Maracujá 100ml", price: 3.00, category: "Creme" },
    { id: "c_pitaya", name: "Creme de Pitaya 100ml", price: 3.00, category: "Creme" },
    { id: "c_creninho", name: "Creninho 100ml", price: 4.00, category: "Creme" },
    { id: "c_milho", name: "Creme de Milho Verde 100ml", price: 3.00, category: "Creme" },
    { id: "c_pacoca", name: "Creme de Paçoca 100ml", price: 3.00, category: "Creme" },
    { id: "c_iogurte", name: "Creme Iogurte Grego 100ml", price: 3.00, category: "Creme" },
    { id: "c_supremo", name: "Creme Supremo de Avelã 100ml", price: 3.00, category: "Creme" },
  ],
  fruits: [
    { id: "fr_abacaxi", name: "Abacaxi", price: 1.00, category: "Fruta" },
    { id: "fr_banana", name: "Banana", price: 1.00, category: "Fruta" },
    { id: "fr_kiwi", name: "Kiwi", price: 1.50, category: "Fruta" },
    { id: "fr_manga", name: "Manga", price: 1.50, category: "Fruta" },
    { id: "fr_morango", name: "Morango", price: 1.50, category: "Fruta" },
    { id: "fr_uva", name: "Uva", price: 1.50, category: "Fruta" },
  ],
  fillings: [
    { id: "fi_beijinho", name: "Beijinho caseiro 50ml", price: 2.00, category: "Recheio" },
    { id: "fi_brigadeiro", name: "Brigadeiro caseiro 50ml", price: 2.00, category: "Recheio" },
    { id: "fi_mousse_mor", name: "Mousse morango copo 50ml", price: 2.00, category: "Recheio" },
    { id: "fi_mousse_mar", name: "Mousse maracujá copo 50ml", price: 2.00, category: "Recheio" },
    { id: "fi_mousse_lim", name: "Mousse limão copo 50ml", price: 2.00, category: "Recheio" },
    { id: "fi_mousse_ver", name: "Mousse frutas vermelhas 50ml", price: 2.00, category: "Recheio" },
    { id: "fi_doce_leite", name: "Doce de leite cremoso 50ml", price: 2.50, category: "Recheio" },
    { id: "fi_calda_bri", name: "Calda brigadeiro 50ml", price: 2.50, category: "Recheio" },
    { id: "fi_calda_ver", name: "Calda de frutas vermelhas 50ml", price: 2.00, category: "Recheio" },
    { id: "fi_calda_mar", name: "Calda de maracujá 50ml", price: 2.00, category: "Recheio" },
    { id: "fi_calda_mor", name: "Calda de morango 50ml", price: 2.00, category: "Recheio" },
    { id: "fi_ameixa", name: "Ameixa 50ml", price: 2.00, category: "Recheio" },
    { id: "fi_amora", name: "Amora 50ml", price: 2.00, category: "Recheio" },
    { id: "fi_abacaxi_v", name: "Abacaxi ao vinho 50ml", price: 2.00, category: "Recheio" },
    { id: "fi_pessego", name: "Pêssego 50ml", price: 2.00, category: "Recheio" },
    { id: "fi_creme_avela", name: "Creme de chocolate c/avelã 50ml", price: 3.00, category: "Recheio" },
    { id: "fi_pasta_amend", name: "Pasta de amendoim 50ml", price: 2.50, category: "Recheio" },
    { id: "fi_choco_crok", name: "Choco crokante 50ml", price: 2.50, category: "Recheio" },
    { id: "fi_chocoskimo", name: "Chocoskimo ao leite 50ml", price: 2.50, category: "Recheio" },
    { id: "fi_chocotine", name: "Chocotine cream 50ml", price: 3.00, category: "Recheio" },
    { id: "fi_chocowaffer", name: "Chocowaffer 50ml", price: 2.50, category: "Recheio" },
    { id: "fi_coco_branco", name: "Creme de coco branco 50ml", price: 2.50, category: "Recheio" },
    { id: "fi_pacoca_cream", name: "Pacoca cream 50ml", price: 2.50, category: "Recheio" },
    { id: "fi_amarena", name: "Recheio de amarena 50ml", price: 2.50, category: "Recheio" },
    { id: "fi_cookies_b", name: "Recheio de cookies branco 50ml", price: 2.50, category: "Recheio" },
    { id: "fi_leitinho", name: "Recheio leitinho 50ml", price: 3.50, category: "Recheio" },
  ],
};

const allItems = [];
for (const category in data) {
  data[category].forEach(item => {
    allItems.push({
      ...item,
      original_category: category,
      updatedAt: new Date()
    });
  });
}

const db = db.getSiblingDB('cardapio-acai');
const collection = db.getCollection('preco');

print(`Limpando coleção preco...`);
collection.deleteMany({});

print(`Inserindo ${allItems.length} itens...`);
const result = collection.insertMany(allItems);
print(`Inserção concluída: ${result.insertedCount} documentos inseridos.`);
