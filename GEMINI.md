# Memória do Projeto: Cardápio Açaí no Kilo

Este arquivo contém o contexto acumulado, regras de negócio e diretrizes técnicas para garantir a continuidade e estabilidade do projeto.

## 📌 Contexto Geral
Cardápio interativo mobile-first para montagem de açaí personalizado, com envio de pedido via WhatsApp. Experiência "Premium" com dados dinâmicos vindos de banco de dados.

## 🛠️ Stack Tecnológica
- **Frontend:** React 19 + Vite (TypeScript)
- **Backend:** Node.js + Express
- **Banco de Dados:** MongoDB (Local ou Atlas)
- **Estilização:** Tailwind CSS (Glassmorphism)
- **Animações:** GSAP + Framer Motion
- **Scroll:** Lenis (Smooth Scroll)
- **Ícones:** Lucide React

## 🗄️ Arquitetura de Dados (MongoDB)
- **Database:** `cardapio-acai`
- **Collection:** `preco`
- **Fluxo:** O frontend consome a API em `http://localhost:3001/api/menu` que organiza os itens por categorias dinâmicas (sizes, flavors, toppings, etc).

## 🎨 Identidade Visual
- **Cor Primária:** `#F6E632` (Amarelo vibrante)
- **Cor Secundária:** `#b32aa6` (Ametista Vibrante)
- **Fundo Deep:** `#3d1b34` (Deep Violet)
- **Fontes:** `Bebas Neue` (Títulos) e `Raleway` (Textos)

## 🚀 Comandos de Inicialização
- `npm run server`: Inicia o backend (Porta 3001). **Obrigatório para o site funcionar.**
- `npm run dev`: Inicia o frontend Vite.
- `node migration.js`: Script (na raiz) para resetar/migrar dados do arquivo local para o MongoDB.

## ⚙️ Funcionalidades Cruciais
1.  **Dynamic Loading:** O site exibe "Carregando Menu..." enquanto busca dados da API.
2.  **Multi-step:** Navegação entre os 10 passos.
3.  **Cálculo de Preço:** Valor base + opcionais + R$ 7,00 (frete delivery).
4.  **Hold to Delete:** Exclusão no carrinho requer segurar a lixeira por 1s (barra de progresso).
5.  **WhatsApp Link:** Formatação automática com endereço, troco e método de pagamento.

## 📝 Regras de Implementação
- **Mobile-First:** Prioridade absoluta para interface mobile.
- **Segurança:** Arquivos `.env` no servidor gerenciam a conexão com o banco.
- **Git:** `server/node_modules` deve ser ignorado.
- **TypeScript:** Utilizar `"ignoreDeprecations": "6.0"` no `tsconfig.json` para evitar avisos de `baseUrl`.

## 🧪 Plano de Testes Manuais
- [ ] O menu carrega corretamente do banco de dados (API Online)?
- [ ] O total soma R$ 7,00 ao escolher "Receber em Casa"?
- [ ] O campo de troco aparece apenas em "Dinheiro" e valida o valor?
- [ ] O scroll funciona dentro do carrinho (`data-lenis-prevent`)?
- [ ] A mensagem do WhatsApp contém todos os itens e o total correto?

---
*Atualizado em: 24 de Abril de 2026*
