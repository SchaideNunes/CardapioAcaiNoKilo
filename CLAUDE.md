# CLAUDE.md — Cardápio Açaí no Kilo

Cardápio mobile-first para montar açaí personalizado (`/montar`) e comprar açaís prontos (`/prontos`), com envio do pedido via WhatsApp e painel admin (`/admin`). O histórico longo de decisões de design e as diretrizes completas estão em [GEMINI.md](GEMINI.md); este arquivo é a versão operacional: o que é verdade no código hoje e as regras de trabalho.

## Comandos

| Comando | O que faz |
| :--- | :--- |
| `npm run dev` | Frontend Vite |
| `npm run server` | Backend Express em `:3001` (precisa de `server/.env` e MongoDB) |
| `npm test` | Vitest com dois projetos: `web` (jsdom, `src/test/`) e `server` (Node + MongoDB em memória, `server/test/`). Requer `npm install --prefix server` |
| `npx vitest run --project server` | Só os testes da API |
| `npx tsc -b` | Typecheck (é o primeiro passo do `npm run build`) |
| `npm run lint` | ESLint — **tem dívida existente** (ver Backlog); não piore a contagem |
| `ADMIN_EMAIL=... ADMIN_PASSWORD=... node server/create-admin.js` | Cria/reseta o admin (senha ≥ 12 caracteres; também lê de `server/.env`) |

Setup: `npm install && npm install --prefix server`, copie [server/.env.example](server/.env.example) para `server/.env` (e, se precisar, [.env.example](.env.example) para `.env.local`). Variável de ambiente nova = documentar no `.env.example` correspondente no mesmo commit.

Ambiente: Windows, caminho do projeto contém `ç` (`Cardapio Açai`) e assets com espaço/acentos (`Logo açai.webp`) — sempre use aspas em caminhos.

## Mapa do código (estado real)

- [src/main.tsx](src/main.tsx) — rotas: `/`, `/montar`, `/prontos`, `/login`, `/admin`.
- [src/pages/](src/pages/) — cada página é um componente grande e autocontido (`AdminPage.tsx` ~1.900 linhas, `OrderPage.tsx` ~800). Não há camada de services/hooks no frontend ainda.
- [src/lib/orders.ts](src/lib/orders.ts) — `saveOrder()`: persistência do pedido usada por `OrderPage` e `ReadyMadePage` (nunca lança; campo `origin`: `"custom"` | `"ready_made"`). Lógica compartilhada nova vai em `src/lib/`.
- [src/data/menu.ts](src/data/menu.ts) — cardápio estático usado como fallback offline. [migration.js](migration.js) tem os mesmos dados para popular o Mongo; **mantenha os dois em sincronia** ao mudar itens/preços.
- [server/app.js](server/app.js) — `createApp({ db, jwtSecret, menuCollection })`: todas as rotas, sem abrir porta nem conexão. [server/index.js](server/index.js) só lê o `.env`, cria o cliente Mongo e chama `listen`. Express 5 + driver `mongodb` nativo (sem Mongoose), CommonJS. Rotas:
  - Públicas: `GET /api/menu`, `POST /api/login`, `POST /api/orders`
  - Protegidas (`verifyToken`): `GET|POST /api/admin/menu`, `PUT|DELETE /api/admin/menu/:id`, `GET /api/admin/orders`
  - Coleção do cardápio vem de `process.env.COLLECTION_NAME`; pedidos em `pedidos`; usuários em `usuarios`.
- [src/lib/api.ts](src/lib/api.ts) — `apiUrl("/api/...")` monta a URL do backend a partir de `VITE_API_URL` (padrão `http://localhost:3001`). Nunca escreva a URL do backend à mão.

### Modo Demo / fallback
- Se o `fetch` falha, as páginas usam `src/data/menu.ts` e/ou o cache em `localStorage` (`cardapio_admin_menu_items_v3`, legado `_v2`).
- Login offline aceita **apenas** `admin`/`admin` ([src/lib/demo.ts](src/lib/demo.ts)) e grava `DEMO_TOKEN`; o `AdminPage` verifica esse token para pular chamadas à API. Os testes do admin dependem desse caminho. `VITE_DEMO_MODE=false` desliga o modo demo (use em produção).
- Qualquer mudança no fluxo de dados precisa preservar o fallback offline.

## Regras de trabalho

### Fluxo (TDD incremental)
1. Uma funcionalidade por vez. Escreva/ajuste o teste primeiro em `src/test/<Página>.test.tsx`, veja falhar, implemente, refatore.
2. Antes de declarar pronto: `npm test` 100% verde **e** `npx tsc -b` sem erros. Rode `npx eslint <arquivos alterados>` e não introduza novos erros.
3. Testes de API ficam em `server/test/*.test.mjs` (ESM; carregam o servidor CJS via `createRequire`) e usam [server/test/helpers.mjs](server/test/helpers.mjs): `startTestServer()` sobe um MongoDB em memória, `reset()` limpa o banco e cria o admin de teste, `adminToken()` gera um JWT válido. Use `supertest` contra `server.createApp()`.
4. Testes de frontend usam React Testing Library + `BrowserRouter`; `window.open`, `scrollTo`, `ResizeObserver` e `Image` já são mockados em [src/test/setup.ts](src/test/setup.ts). Para chamadas de API, mocke `fetch` com `vi.fn()` / `vi.spyOn(global, "fetch")` — nunca dependa do backend rodando.
5. Prefira queries acessíveis (`getByRole`, `getByLabelText`) a seletores por classe.

### Commits
- Conventional Commits com escopo, descrição em inglês, minúscula: `feat(admin): ...`, `fix(order): ...`, `style(home): ...`, `test(ready): ...`, `docs: ...`. Escopos usados: `admin`, `order`, `home`, `ready`, `auth`, `preloader`, `assets`, `server`.
- Commits atômicos, um por funcionalidade verde. Não commitar sem pedido explícito do usuário na sessão.
- Nunca editar ou commitar à mão arquivos de `dist/` (saída de build).

### Segurança
- Nunca commitar `.env` / `server/.env` (já cobertos pelo `.gitignore`) nem imprimir seus valores.
- Rotas novas de escrita administrativa sempre atrás de `verifyToken` (sem token/Bearer → 401; só HS256).
- Já implementado em [server/app.js](server/app.js): Helmet, CORS por lista (`corsOrigins`), rate limit de 5 logins/min e 10 pedidos/min por IP. Rotas públicas novas que gravam dados precisam de limiter próprio.
- Configuração do servidor via env ([server/index.js](server/index.js)): `JWT_SECRET` obrigatório (≥ 32 caracteres em produção, senão o processo não sobe), `CORS_ORIGINS` (lista separada por vírgula; fora de produção o padrão libera o Vite local), `TRUST_PROXY` (nº de proxies à frente, para o rate limit ver o IP real).
- Validar e sanitizar tudo que vem de `req.body` / `req.params` no servidor: tipos primitivos esperados (rejeitar objetos onde se espera string — injeção de operadores `$`), tamanhos máximos, números finitos e ≥ 0 em preços.
- Nunca montar `RegExp` com input do usuário sem escapar.
- Nunca colocar credenciais reais no código, testes ou documentação (o repositório é público).

### Design / UI
- Mobile-first, de 320px a ultrawide, **zero scroll horizontal** (`w-full max-w-full overflow-x-hidden` nos contêineres raiz). Alvos de toque ≥ 44×44px.
- Tema escuro roxo profundo + amarelo ouro. Na prática o código usa `#F0DF58` (ouro) e fundos `#170a18` / `#241220` / `#120714` hardcoded; o token `primary` do Tailwind (`#E6D62E`) quase não é usado. Ao criar UI nova, siga as cores já em uso na página e não invente novas.
- Tipografia: `font-heading` (Bebas Neue) para títulos, preços e números; `font-sans` (Raleway) para o resto.
- Estética sóbria: hovers sutis (borda `white/10 → white/25`, `-translate-y-0.5`, 150–250ms `ease-out`), nada de neon, gradientes caóticos ou blur decorativo sem propósito. Animações via GSAP / `tailwindcss-animate`, sempre com função clara.
- Imagens em `public/assets/` sempre `.webp` otimizado (~15–30KB). Converter antes de usar.
- Toda tela com dados precisa de estados de loading, vazio e erro.
- Textos de interface em português do Brasil.

### Regras de negócio
- O pedido deve ser salvo via `POST /api/orders` **antes** de abrir o WhatsApp; falha ao salvar não pode impedir o envio pelo WhatsApp.
- Número da loja no WhatsApp: `557591585290` (hoje duplicado em `OrderPage` e `ReadyMadePage`).
- Pedidos são gravados com códigos (`deliveryMethod: "delivery"|"pickup"`, `paymentMethod: "pix"|"card"|"cash"`). Ao ler pedidos, sempre passe por `normalizeDeliveryMethod` / `normalizePaymentMethod` (aceitam também rótulos legados em português) e exiba com `DELIVERY_LABELS` / `PAYMENT_LABELS`.
- `POST /api/orders` valida o payload em [server/validation.js](server/validation.js) e grava **só** os campos conhecidos (`origin`, `items`, `total`, `deliveryMethod`, `paymentMethod`, `address` se entrega, `changeFor` se dinheiro). Campo novo no pedido = atualizar o validador e os testes. Inválido → 422.
- `POST|PUT /api/admin/menu` validam com `validateMenuItem` (categorias fixas: `sizes`, `flavors`, `toppings`, `addons`, `creams`, `fruits`, `fillings`, `ready_made`; `image` aceita `/assets/...`, `https://` ou data URL base64 de até ~200KB). Campos desconhecidos são ignorados.
- O `total` é calculado no cliente e serve de referência; o servidor não recalcula pelos preços do banco — o valor final é confirmado pela loja no WhatsApp.
- Retirada no `/montar` pula a etapa de pagamento (paga no balcão): `paymentMethod: null` é válido.
- Pagamento em dinheiro exige "troco para" ≥ total ou "Não preciso".
- Entrega exige rua, número e bairro.

## Backlog conhecido (dívidas encontradas na análise de 14/10/2026)

Prioridade alta — corretude/segurança:

Prioridade média — estrutura:
1. `dist/` está versionado no git — adicionar ao `.gitignore` e remover do índice.
2. Lint: 71 erros (maioria `no-undef` em arquivos Node do `server/`, `migration.js` e `scripts/` por falta de `globals.node` na config; `any` em `OrderPage`/`ReadyMadePage`).
3. Tipos de domínio (`MenuItem`, `Order`) duplicados entre páginas — centralizar em `src/types/`.
4. Lógica de total/mensagem de WhatsApp duplicada entre `OrderPage` e `ReadyMadePage` — extrair para `src/lib/` com testes unitários.
5. `window.open` do WhatsApp roda depois de um `await` (salvar pedido) — validar em iPhone/Safari real se o pop-up não é bloqueado; se for, abrir a aba de forma síncrona e só depois definir a URL.

Ao concluir um item, remova-o daqui no mesmo commit.
