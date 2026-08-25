# Memória do Projeto: Cardápio Açaí no Kilo & Diretrizes Globais de Engenharia

Este arquivo contém o contexto acumulado, regras de negócio, especificações do projeto e as diretrizes globais de engenharia, TDD, segurança, design e arquitetura a serem seguidas rigorosamente.

---

## 📌 1. Contexto Geral do Projeto
Cardápio interativo mobile-first para montagem de açaí personalizado e compra de açaís prontos, com envio de pedido via WhatsApp e Painel Administrativo para gestão em tempo real.

### 🛠️ Stack Tecnológica
- **Frontend:** React 19 + Vite + React Router Dom + TypeScript
- **Backend:** Node.js + Express + JWT + Bcrypt
- **Banco de Dados:** MongoDB (Local / Atlas)
- **Estilização:** Tailwind CSS (Glassmorphism & Dark Mode)
- **Animações:** GSAP + Tailwind Animate

### 🔐 Segurança e Acesso Específicos
- **Admin Panel:** Acessível em `/admin`.
- **Login:** Acessível em `/login`.
- **Autenticação:** JWT (JSON Web Tokens) armazenados no `localStorage`.
- **Acesso:** Utilizar as credenciais configuradas no banco de dados.
- **Proteção:** Rotas de API `/api/admin/*` exigem Token válido via header `Authorization: Bearer <token>`.

---

## ⚙️ 2. Modos de Operação

O projeto suporta dois modos de funcionamento para facilitar demonstrações sem a necessidade de um banco de dados ativo:

### 🟢 Modo Demonstração (Ativo por Fallback)
- **Como funciona:** O frontend tenta carregar os dados do backend local. Se o servidor estiver desligado ou o banco inacessível, o sistema carrega automaticamente os dados estáticos do arquivo `src/data/menu.ts`.
- **Admin Demo:** É possível acessar o painel mesmo com o servidor offline usando:
  - **Usuário:** `admin`
  - **Senha:** `admin`
- **Ideal para:** Apresentações rápidas ou execução quando o MongoDB não estiver rodando.
- **Limitação:** Pedidos e alterações de preço no Modo Demo são apenas visuais (não persistem no banco).

### 🚀 Modo Produção / Desenvolvimento Local
- **Como funciona:** Requer o MongoDB e o Servidor Node.js rodando.
- **Configuração:**
  - Banco Local: `mongodb://127.0.0.1:27017/cardapio-acai`
  - Backend: `http://localhost:3001`
- **Vantagem:** Permite salvar histórico real de pedidos e gerenciar estoque/preços via Painel Admin.

---

## 🗄️ 3. Arquitetura de Dados (MongoDB)
- **Database:** `cardapio-acai`
- **Collections:** 
  - `preco`: Itens do menu, categorias, preços e status de estoque (ativo/inativo).
  - `pedidos`: Histórico de pedidos realizados no site (itens, valores, cliente, método de pagamento e data).
  - `usuarios`: Credenciais criptografadas de acesso ao painel.
- **Migração:** Para popular o banco local, use `mongosh "mongodb://127.0.0.1:27017/cardapio-acai" migration.js`.

---

## 🚀 4. Comandos de Inicialização & Execução
- `npm run dev`: Inicia o servidor de desenvolvimento do frontend (Vite).
- `npm run server`: Inicia o backend Node.js (Porta 3001).
- `npm run build`: Compila TypeScript e gera o bundle de produção via Vite.
- `npm test` ou `npm run test`: Executa a suíte de testes automatizados.
- `node server/create-admin.js`: (Servidor) Cria/Reseta o usuário admin padrão.

---

## ⚙️ 5. Funcionalidades do Painel Admin
1. **Dashboard de Pedidos:** Visualização dos pedidos do dia com total, lista de itens, método de pagamento e status.
2. **Gestor de Preços:** Edição direta dos valores de cada item (salvamento automático no blur/change).
3. **Controle de Estoque:** Botão Power para ativar/desativar itens. Itens desativados somem do cardápio automaticamente.

---

## 📝 6. Regras de Negócio e Implementação do Cardápio
- **Persistência Pré-WhatsApp:** Pedidos são salvos no banco de dados ANTES do redirecionamento para a URL da API do WhatsApp.
- **Formato das Imagens (`.webp`):** Todas as imagens no diretório `public/assets/` devem usar o formato `.webp` otimizado (peso médio ~15KB-30KB) para garantir carregamento instantâneo no mobile. Formatos pesados ou incompatíveis com a web (como `.HEIC` ou `.PNG` sem compressão) devem ser convertidos antes do uso.
- **Estilo Visual dos Complementos:** Listas de complementos mantêm o estilo clássico (horizontal, minimalista, zoom suave de 25% interno na imagem).
- **Cards de Tamanhos:** A tela de seleção de tamanhos possui cards destacados com imagens mapeadas diretamente em `OrderPage.tsx`.
- **Página de Prontos (`ReadyMadePage`):** Layout Bento Box com imagens ocupando o topo, botão `+` em destaque, título de linha única padronizado e preço em tipografia `font-heading` (`Bebas Neue`).

---

## 🚨 7. Metodologia de Desenvolvimento: TDD Estrito & Fluxo Incremental

> [!IMPORTANT]
> **O desenvolvimento é guiado por testes (Test-Driven Development) e construído de forma incremental (feature por feature).**  
> Nenhum código de funcionalidade é considerado concluído sem que seus respectivos testes automatizados passem com 100% de sucesso.

### 🔄 Ciclo Red-Green-Refactor Obrigatório:
1. 🔴 **Fase RED (Teste Primeiro):** Escrever primeiro o teste unitário/integração que define o comportamento esperado do componente, função ou endpoint. Executar o teste e garantir que ele **falhe propositalmente**.
2. 🟢 **Fase GREEN (Código Mínimo):** Implementar o código estritamente necessário para fazer o teste passar.
3. 🔵 **Fase REFACTOR (Refatoração Limpa):** Melhorar a estrutura, legibilidade, tipagem e performance do código, garantindo que 100% da suíte de testes permaneça verde.
4. ⏩ **Avanço Incremental:** Concluir e testar uma funcionalidade por completo antes de iniciar a próxima. Nunca crie múltiplos módulos interdependentes sem validar a base.

### 🧪 Tipos de Testes Exigidos:
- **Testes Unitários:** Validação de regras de negócio puras, utilitários, cálculos de total, máscaras de formulário e formatadores de dados.
- **Testes de Integração:** Validação de rotas de API, middlewares de autenticação, contratos de payload e persistência em banco.
- **Testes de Concorrência e Resiliência:** Cenários de dados vazios, inputs maliciosos, serviços externos indisponíveis e limites de caracteres.

---

## 🔀 8. Controle de Versão & Conventional Commits

> [!TIP]
> **Commits frequentes e atômicos após cada funcionalidade concluída e testada.**  
> Evite commits gigantescos no fim do dia ou do projeto. Faça commits atômicos conforme cada componente, endpoint ou correção atinge o estado verde no TDD.

### 📝 Padrão Conventional Commits:
Todo commit deve seguir a convenção semântica com descrição clara e objetiva:

| Prefixo | Finalidade | Exemplo |
| :--- | :--- | :--- |
| `feat:` | Nova funcionalidade ou recurso para o usuário | `feat: implement atomic reservation lock to prevent overbooking` |
| `test:` | Adição, ajuste ou refatoração de testes automatizados | `test: add unit tests for whatsapp phone mask and validation` |
| `fix:` | Correção de bug ou comportamento inesperado | `fix: correct price calculation on multi-item selection` |
| `refactor:` | Refatoração de código sem alteração de comportamento | `refactor: extract business logic to order calculation service` |
| `perf:` | Otimização de performance ou tempo de carregamento | `perf: convert item catalog images to compressed webp format` |
| `style:` | Ajustes puramente visuais, CSS, formatação ou micro-animações | `style: apply dark glassmorphism styling and card hover effects` |
| `docs:` | Alteração ou adição de documentação e regras (`GEMINI.md`) | `docs: update setup guide and environment variables checklist` |
| `chore:` | Ajustes em dependências, scripts de build ou configs de CI/CD | `chore: configure vitest and linter settings` |

---

## 🔒 9. Segurança & Proteção de Dados (Security by Design)

> [!CAUTION]
> **Segurança não é um adendo final; ela é nativa do código desde a primeira linha.**

### 🔑 1. Gestão de Segredos & Variáveis de Ambiente
- **Proibido Commitar Segredos:** Arquivos `.env`, `server/.env`, chaves de API, credenciais do MongoDB, segredos JWT (`JWT_SECRET`) e certificados NUNCA devem ser versionados no Git.
- **`.gitignore` Rigoroso:** Manter configurado para ignorar `.env`, `.env.local`, `server/.env`, `node_modules/`, logs e arquivos temporários.
- **Template `.env.example`:** Sempre manter um arquivo `.env.example` documentado com todas as chaves exigidas pela aplicação (com valores fictícios e descritivos).
- **Isolamento entre Ambientes:** Nunca conectar ou modificar bancos de dados de produção sem autorização expressa.

### 🛡️ 2. Prevenção de Injeções (NoSQL / SQL / XSS)
- **Consultas Seguras:** Sanitizar queries e inputs para evitar injeções de NoSQL no MongoDB (como operadores `$gt`, `$ne` indevidos).
- **Sanitização de Entradas:** Sanitizar e validar todos os inputs do usuário para neutralizar scripts maliciosos (XSS) e injeções de HTML.
- **Validação de Schemas:** Utilizar validadores estritos para checar tipos, tamanhos e formatos antes de processar qualquer requisição.

### 🔐 3. Autenticação & Autorização
- **Criptografia de Senhas:** Senhas administrativas devem ser armazenadas com hash seguro (`bcrypt` com custo $\ge 10$). Nunca salvar senhas em texto puro.
- **Proteção por Tokens:** Uso de JWT (JSON Web Tokens) assinados com segredo forte e tempo de expiração (`exp`) definido.
- **Middlewares de Guarda:** Todas as rotas administrativas `/api/admin/*` devem exigir validação do token JWT; acessos inválidos devem retornar `401 Unauthorized` ou `403 Forbidden`.

### 🌐 4. Proteção HTTP & Infraestrutura
- **Headers Seguros:** Utilizar `Helmet` no Express para proteção contra clickjacking, MIME sniffing e XSS.
- **Rate Limiting:** Implementar limitador de requisições em rotas críticas (login, checkout e envio de pedidos) para bloquear ataques de força bruta.
- **CORS Estrito:** Configurar políticas de CORS liberando apenas as origens confiáveis necessárias.

---

## 🎨 10. Diretrizes de Design, UI/UX & Frontend de Alto Padrão

> [!NOTE]
> **A interface deve impressionar pela sofisticação, autenticidade e acabamento refinado.**  
> Designs amadores, templates genéricos ou com "cara de IA" (efeitos artificiais e poluídos) não são aceitos. O produto deve transmitir a sensação de software artesanal de elite (padrão Linear, Apple, Stripe).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ESTÉTICA & EXPERIÊNCIA                          │
│                                                                        │
│  ✨ Visual Premium      🔤 Tipografia Curada     ⚡ Animações Vivas    │
│  Dark/Glassmorphism     Google Fonts Modernas    GSAP Suave            │
│                                                                        │
│  🚫 Padrão Anti-IA      📱 100% Mobile-First     🛡️ Validação Reativa  │
│  Sem Efeitos Exagerados 320px a Ultrawide        Tailwind & Micro-UX   │
└────────────────────────────────────────────────────────────────────────┘
```

### 🚫 1. Padrão Anti-IA: Design Autêntico, Humano e Sem Clichês
- **Sem Exageros e Poluição Visual:** Proibido o uso indiscriminado de gradientes caóticos, neons artificiais, borrões excessivos ("auroras") espalhados sem propósito ou múltiplos efeitos brigando por atenção.
- **Hovers Sutis & Elegantes:** Micro-interações discretas:
  - Variações leves de borda (`border-white/10` para `border-white/25`);
  - Elevação sutil (`translate-y-[-2px]`);
  - Transições suaves de opacidade e cor de fundo com timing natural (150ms a 250ms com curva `ease-out`).
- **Animações com Propósito:** Toda animação deve servir para enriquecer a experiência do usuário (ex: guiar a leitura, indicar carregamento ou responder a uma ação).

### 🛠️ 2. Stack de Estilização & Animação
- **Tailwind CSS:** Base de estilização ágil, responsiva e padronizada através de design tokens claros, espaçamentos consistentes e utilitários modernos.
- **GSAP (GreenSock):** Utilizado para transições orquestradas, revelações graduais de conteúdo (*stagger*) e micro-interações de altíssima precisão.

### 💎 3. Paleta de Cores e Estética Visual
- **Tema do Projeto:** Dark Mode sofisticado em tons de roxo profundo (`#1F0D1A`), fundos escuros translúcidos e acentos no amarelo ouro (`#E6D62E` - `primary`).
- **Glassmorphism Elegante:** Fundos translúcidos (`backdrop-blur`), bordas sutis com gradientes suaves e sombras com elevação natural.
- **Hierarquia Visual:** Contraste nítido entre títulos, subtítulos, preços, textos de apoio e botões.

### 🔤 4. Tipografia Moderna
- **Fontes Oficiais:**
  - `Bebas Neue` (`font-heading`): Títulos principais, valores monetários e números em destaque.
  - `Raleway` (`font-sans`): Textos corridos, botões, descrições e formulários.
- **Escala Modular:** Definir pesos e tamanhos com proporções consistentes.

### 📱 5. Responsividade & Mobile-First
- **Adaptação Completa:** Layout totalmente fluido garantindo usabilidade impecável de 320px (smartphones compactos) até monitores ultrawide.
- **Sem Scroll Indevido na Home:** A tela inicial deve acomodar perfeitamente logo, opções de pedido e rodapé no viewport mobile.
- **Áreas de Toque Adequadas:** Botões e elementos clicáveis com dimensões mínimas confortáveis para toque no celular.
- **Máscaras de Entrada:** Formatação automática em tempo real para campos como WhatsApp `(XX) XXXXX-XXXX` e CEP.

---

## 🏛️ 11. Arquitetura de Software & Clean Code

### 📐 1. Separação de Responsabilidades
- **Rotas / Controllers:** Apenas recebem requisições, validam schemas e retornam códigos HTTP semânticos.
- **Services / Camada de Negócio:** Contêm as regras da aplicação, orquestração e fluxos lógicos independentes de framework.
- **Repositories / Acesso a Dados:** Realizam a comunicação direta com o MongoDB / Mongoose.
- **Schemas / Tipos:** Interfaces e tipos TypeScript estritos e imutáveis.

### 🛡️ 2. Tipagem Estática Rigorosa
- **TypeScript Estrito:** `noImplicitAny: true`, interfaces claras para todas as entidades (produtos, adicionais, pedidos, carrinho, usuário).
- **Guardas contra `undefined` / `null`:** Sempre utilizar optional chaining (`?.`) e valores padrão defensivos.

### ⚠️ 3. Tratamento Resiliente de Erros & Códigos HTTP
- `200 OK` / `201 Created` para operações bem-sucedidas.
- `400 Bad Request` / `422 Unprocessable Entity` para falhas de validação de payload.
- `401 Unauthorized` / `403 Forbidden` para problemas de autenticação e permissão.
- `404 Not Found` para recursos inexistentes.
- `500 Internal Server Error` tratado com logs estruturados.

---

## 📋 12. Checklist de Testes & Homologação

Antes de homologar qualquer versão ou nova funcionalidade, valide:

### 📱 A. Interface e Experiência do Usuário (UI/UX)
- [ ] O layout foi testado e é perfeitamente legível em telas mobile (320px, 375px, 414px) e desktop?
- [ ] Os cards de produto exibem imagens nítidas sem esticar ou cortar indevidamente?
- [ ] Máscaras de telefone/WhatsApp aceitam somente dígitos válidos?
- [ ] Estados de loading, erro e confirmação (toasts/modais) são exibidos claramente?

### 🔄 B. Fluxos de Negócio & Pedidos
- [ ] A montagem de açaí calcula o total correto com todos os complementos selecionados?
- [ ] A seleção de açaí pronto adiciona/remove itens do carrinho e atualiza o total corretamente?
- [ ] A persistência do pedido no banco ocorre com sucesso antes de abrir o WhatsApp?
- [ ] O fluxo de fallback funciona perfeitamente quando o servidor está offline?

### 🔐 C. Painel Administrativo & Segurança
- [ ] Acessar rotas administrativas sem token redireciona para a tela de login?
- [ ] Senhas no banco de dados estão protegidas com hash (`bcrypt`)?
- [ ] Variáveis sensíveis e credenciais estão protegidas pelo `.gitignore`?

---

*Documento atualizado em: 25 de Agosto de 2026*
