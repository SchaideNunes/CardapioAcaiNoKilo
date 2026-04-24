# Memória do Projeto: Cardápio Açaí no Kilo

Este arquivo contém o contexto acumulado, regras de negócio e diretrizes técnicas para garantir a continuidade e estabilidade do projeto.

## 📌 Contexto Geral
Cardápio interativo mobile-first para montagem de açaí personalizado, com envio de pedido via WhatsApp e Painel Administrativo para gestão em tempo real.

## 🛠️ Stack Tecnológica
- **Frontend:** React 19 + Vite + React Router Dom
- **Backend:** Node.js + Express + JWT + Bcrypt
- **Banco de Dados:** MongoDB
- **Estilização:** Tailwind CSS (Glassmorphism)
- **Animações:** GSAP + Tailwind Animate

## 🔐 Segurança e Acesso
- **Admin Panel:** Acessível em `/admin`.
- **Login:** Acessível em `/login`.
- **Autenticação:** JWT (JSON Web Tokens) armazenados no localStorage.
- **Acesso:** Utilizar as credenciais pessoais configuradas no banco de dados.
- **Proteção:** Rotas de API `/api/admin/*` exigem Token válido.

## ⚙️ Modos de Operação

O projeto agora suporta dois modos de funcionamento para facilitar demonstrações sem a necessidade de um banco de dados ativo:

### 1. Modo Demonstração (Ativo por Padrão)
- **Como funciona:** O frontend tenta carregar os dados do backend local. Se o servidor estiver desligado ou o banco inacessível, o sistema carrega automaticamente os dados estáticos do arquivo `src/data/menu.ts`.
- **Admin Demo:** É possível acessar o painel mesmo com o servidor offline usando:
  - **Usuário:** `admin`
  - **Senha:** `admin`
- **Ideal para:** Mostrar o projeto em outros computadores ou quando o banco de dados não estiver rodando.
- **Limitação:** Pedidos e alterações de preço no Modo Demo são apenas visuais (não salvam no banco).

### 2. Modo Produção / Desenvolvimento Local
- **Como funciona:** Requer o MongoDB e o Servidor Node.js rodando.
- **Configuração:**
  - Banco Local: `mongodb://127.0.0.1:27017`
  - Backend: `http://localhost:3001`
- **Vantagem:** Permite salvar pedidos e gerenciar o estoque/preços via Painel Admin.

## 🗄️ Arquitetura de Dados (MongoDB)
- **Database:** `cardapio-acai`
- **Collections:** 
  - `preco`: Itens do menu, preços e status de estoque.
  - `pedidos`: Histórico de pedidos realizados no site.
  - `usuarios`: Credenciais de acesso ao painel.
- **Migração:** Para popular o banco local, use `mongosh "mongodb://127.0.0.1:27017/cardapio-acai" migration.js`.

## 🚀 Comandos de Inicialização
- `npm run server`: Inicia o backend (Porta 3001).
- `npm run dev`: Inicia o frontend.
- `node server/create-admin.js`: (Servidor) Cria/Reseta o usuário admin padrão.

## ⚙️ Funcionalidades do Painel Admin
1.  **Dashboard de Pedidos:** Visualização dos pedidos do dia com total, itens e método de pagamento.
2.  **Gestor de Preços:** Edição direta dos valores de cada item (salvamento automático no blur).
3.  **Controle de Estoque:** Botão Power para ativar/desativar itens. Itens desativados somem do cardápio automaticamente.

## 📝 Regras de Implementação
- **Persistência:** Pedidos são salvos no banco ANTES do redirecionamento para o WhatsApp.
- **Segurança Git:** O arquivo `server/.env` está no `.gitignore`. Nunca subir a `JWT_SECRET`.
- **UX:** Transições suaves entre etapas e feedback visual de carregamento.

---
*Atualizado em: 24 de Abril de 2026*
