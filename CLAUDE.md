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
| `npm run lint` | ESLint — **deve ficar com 0 erros e 0 avisos** |
| `ADMIN_EMAIL=... ADMIN_PASSWORD=... node server/create-admin.js` | Cria/reseta o admin (senha ≥ 12 caracteres; também lê de `server/.env`) |

Setup: `npm install && npm install --prefix server`, copie [server/.env.example](server/.env.example) para `server/.env` (e, se precisar, [.env.example](.env.example) para `.env.local`). Variável de ambiente nova = documentar no `.env.example` correspondente no mesmo commit.

Ambiente: Windows, caminho do projeto contém `ç` (`Cardapio Açai`) e assets com espaço/acentos (`Logo açai.webp`) — sempre use aspas em caminhos.

## Mapa do código (estado real)

- [src/main.tsx](src/main.tsx) — rotas: `/`, `/montar`, `/prontos`, `/login`, `/admin`.
- [src/pages/](src/pages/) — cada página é um componente grande e autocontido (`AdminPage.tsx` ~1.600 linhas, `OrderPage.tsx` ~800). Não há camada de services no frontend; o único hook compartilhado é [src/lib/useEscapeKey.ts](src/lib/useEscapeKey.ts) (Esc fecha diálogos e folhas — use em todo diálogo novo).
- [src/lib/orders.ts](src/lib/orders.ts) — `saveOrder()`: persistência do pedido usada por `OrderPage` e `ReadyMadePage` (nunca lança; campo `origin`: `"custom"` | `"ready_made"`). Lógica compartilhada nova vai em `src/lib/`.
- [src/types/](src/types/) — tipos de domínio compartilhados: `menu.ts` (`MenuItem`, `MenuItemRecord` = item do banco/admin, `MenuData`, `ReadyProduct`, `MENU_CATEGORIES`) e `order.ts` (`OrderPayload`, `OrderRecord`, `DeliveryMethod`, `PaymentMethod`). Não declare tipos de domínio dentro das páginas.
- [src/lib/reports.ts](src/lib/reports.ts) — períodos dos relatórios (`periodStart`: hoje à meia-noite local, últimos 7 dias, mês corrente), `filterOrdersByPeriod` e `computeOrderMetrics` (cancelados ficam fora do faturamento). O admin busca pedidos a partir de `earliestReportStart`.
- [src/lib/menuCache.ts](src/lib/menuCache.ts) — leitura tipada do cardápio salvo pelo admin no `localStorage` e agrupamento por etapa.
- [src/data/menu.ts](src/data/menu.ts) — cardápio estático (`menuData`) e açaís prontos (`readyMadeProducts`) usados como fallback offline. [migration.js](migration.js) tem os mesmos dados para popular o Mongo; **mantenha os dois em sincronia** ao mudar itens/preços.
- [server/app.js](server/app.js) — `createApp({ db, jwtSecret, menuCollection })`: todas as rotas, sem abrir porta nem conexão. [server/index.js](server/index.js) só lê o `.env`, cria o cliente Mongo e chama `listen`. Express 5 + driver `mongodb` nativo (sem Mongoose), CommonJS. Rotas:
  - Públicas: `GET /api/menu`, `POST /api/login`, `POST /api/orders`
  - Protegidas (`verifyToken`): `GET|POST /api/admin/menu`, `PUT|DELETE /api/admin/menu/:id`, `GET /api/admin/orders?from=&to=` (datas ISO opcionais, teto de 2000), `PATCH /api/admin/orders/:id/status`
  - Coleção do cardápio vem de `process.env.COLLECTION_NAME`; pedidos em `pedidos`; usuários em `usuarios`.
- [src/lib/api.ts](src/lib/api.ts) — `apiUrl("/api/...")` monta a URL do backend a partir de `VITE_API_URL` (padrão `http://localhost:3001`). Nunca escreva a URL do backend à mão.

### Modo Demo / fallback
- Se o `fetch` falha, as páginas usam `src/data/menu.ts` e/ou o cache em `localStorage` (`cardapio_admin_menu_items_v3`, legado `_v2`).
- Login offline aceita **apenas** `admin`/`admin` ([src/lib/demo.ts](src/lib/demo.ts)) e grava `DEMO_TOKEN`; o `AdminPage` verifica esse token para pular chamadas à API. Os testes do admin dependem desse caminho. `VITE_DEMO_MODE=false` desliga o modo demo (use em produção).
- Qualquer mudança no fluxo de dados precisa preservar o fallback offline.

## Regras de trabalho

### Fluxo (TDD incremental)
1. Uma funcionalidade por vez. Escreva/ajuste o teste primeiro em `src/test/<Página>.test.tsx`, veja falhar, implemente, refatore.
2. Antes de declarar pronto: `npm test` 100% verde, `npx tsc -b` sem erros e `npm run lint` sem erros nem avisos.
   - React Compiler lint (`react-hooks/*`): nada de `Date.now()`/`Math.random()` no render, e nada de `setState` síncrono em efeito — busque dados em função fora do componente e aplique o resultado no `.then` (veja `fetchAdminData` no `AdminPage`); use `useEffectEvent` para lógica de efeito que lê estado/props.
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
- **O sistema visual está em [DESIGN.md](DESIGN.md)** (2D chapado, gerado do código da montagem e da home) — siga-o em UI nova. Resumo: chão `#241220`, painéis `#2f1729`, ouro `#F0DF58` só para seleção/ação com contorno `#120714` de 2px, creme `#F8EEA6` nos aros das fotos, laranja `#F58220` só em detalhes pequenos, verde WhatsApp só no botão de enviar. O token `primary` do Tailwind (`#E6D62E`) é legado — não use.
- Tipografia: `font-heading` (Bebas Neue) para títulos, preços e números; `font-sans` (Raleway) para o resto.
- **2D, sem profundidade** (regra do dono, ver PRODUCT.md): nada de sombra, vidro/desfoque, degradê ou elevação/escala no hover — o hover muda cor/borda. Números (preços, totais) em Bebas com `lining-nums tabular-nums`. Movimento: só o quique de 0,4s (`anim-seg-fill`, `anim-pop` em `src/index.css`), desligado em `prefers-reduced-motion`. Todas as telas (`/`, `/montar`, `/prontos`, `/login`, `/admin`) já seguem esse sistema; preços na interface sempre com `formatBRL` (`R$ 18,00`).
- Imagens em `public/assets/` sempre `.webp` otimizado (~15–30KB). Converter antes de usar.
- Toda tela com dados precisa de estados de loading, vazio e erro.
- Textos de interface em português do Brasil.

### Regras de negócio
- O `POST /api/orders` (com `keepalive`) é **disparado antes** de abrir o WhatsApp, mas a abertura **não espera** a resposta: precisa acontecer no mesmo clique, senão o Safari/iOS bloqueia o pop-up. Use `saveOrder(...)` + `openWhatsApp(buildWhatsAppUrl(...))` (que cai para navegação na mesma aba se o pop-up for bloqueado). Falha ao salvar nunca impede o envio, e o botão fica desabilitado enquanto o salvamento está pendente.
- WhatsApp da loja (`STORE_WHATSAPP_NUMBER`), taxa de entrega (`DELIVERY_FEE` = R$ 7) e o trecho de entrega/pagamento/troco/total da mensagem ficam em [src/lib/whatsapp.ts](src/lib/whatsapp.ts) — não repita essas regras nas páginas.
- Status do pedido: `new` → `preparing` → `ready` (rótulo "Saiu para entrega" ou "Pronto para retirar") → `done`, ou `cancelled`. O servidor grava `status: "new"` na criação (o cliente não define) e só muda via `PATCH /api/admin/orders/:id/status`. Pedidos antigos sem status contam como `new` (`normalizeOrderStatus`). Use `nextOrderStatus` / `orderStatusLabel` de `src/lib/orders.ts`.
- Pedidos são gravados com códigos (`deliveryMethod: "delivery"|"pickup"`, `paymentMethod: "pix"|"card"|"cash"`). Ao ler pedidos, sempre passe por `normalizeDeliveryMethod` / `normalizePaymentMethod` (aceitam também rótulos legados em português) e exiba com `DELIVERY_LABELS` / `PAYMENT_LABELS`.
- `POST /api/orders` valida o payload em [server/validation.js](server/validation.js) e grava **só** os campos conhecidos (`origin`, `items`, `total`, `deliveryMethod`, `paymentMethod`, `address` se entrega, `changeFor` se dinheiro). Campo novo no pedido = atualizar o validador e os testes. Inválido → 422.
- `POST|PUT /api/admin/menu` validam com `validateMenuItem` (categorias fixas: `sizes`, `flavors`, `toppings`, `addons`, `creams`, `fruits`, `fillings`, `ready_made`; `image` aceita `/assets/...`, `https://` ou data URL base64 de até ~200KB). Campos desconhecidos são ignorados.
- O `total` é calculado no cliente e serve de referência; o servidor não recalcula pelos preços do banco — o valor final é confirmado pela loja no WhatsApp.
- Retirada no `/montar` pula a etapa de pagamento (paga no balcão): `paymentMethod: null` é válido.
- Pagamento em dinheiro exige "troco para" ≥ total ou "Não preciso".
- Entrega exige rua, número e bairro.

## Backlog conhecido

Itens da análise de 14/10/2026 concluídos. Pendências e sugestões abertas:

1. **Antes da hospedagem própria (produção):** criar o admin com senha nova via `create-admin.js` e definir um `JWT_SECRET` forte. A senha antiga ficou no histórico público do git (commits anteriores a `6bcbe49`) e não deve ser reutilizada em produção. O deploy atual na Vercel é só demonstração para o cliente (roda em modo demo, sem backend). No domínio próprio, adicionar `og:image` com URL absoluta no [index.html](index.html) (a prévia do link no WhatsApp não aceita caminho relativo).
2. Validar em iPhone/Safari real o fluxo de envio (WhatsApp abre na hora; pedido aparece no admin).
3. O total do pedido vem do cliente; se um dia o pagamento deixar de ser confirmado no WhatsApp, recalcular no servidor a partir dos preços do banco (exige enviar ids em vez de nomes).
4. O token do admin fica em `localStorage` (exposto a XSS); avaliar cookie `httpOnly` + `SameSite` quando houver domínio próprio.

Ao concluir um item, remova-o daqui no mesmo commit.
