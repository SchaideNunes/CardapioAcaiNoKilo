# CLAUDE.md — Cardápio Açaí no Kilo

Cardápio mobile-first para montar açaí personalizado (`/montar`) e comprar açaís prontos (`/prontos`), com envio do pedido via WhatsApp e painel admin (`/admin`). O histórico longo de decisões de design e as diretrizes completas estão em [GEMINI.md](GEMINI.md); este arquivo é a versão operacional: o que é verdade no código hoje e as regras de trabalho.

## Comandos

| Comando | O que faz |
| :--- | :--- |
| `npm run dev` | Frontend Vite |
| `npm run server` | Backend Express em `:3001` (precisa de `server/.env` e MongoDB) |
| `npm test` | Vitest (jsdom) — suíte em `src/test/` |
| `npx tsc -b` | Typecheck (é o primeiro passo do `npm run build`) |
| `npm run lint` | ESLint — **tem dívida existente** (ver Backlog); não piore a contagem |
| `node server/create-admin.js` | Cria/reseta o usuário admin |

Ambiente: Windows, caminho do projeto contém `ç` (`Cardapio Açai`) e assets com espaço/acentos (`Logo açai.webp`) — sempre use aspas em caminhos.

## Mapa do código (estado real)

- [src/main.tsx](src/main.tsx) — rotas: `/`, `/montar`, `/prontos`, `/login`, `/admin`.
- [src/pages/](src/pages/) — cada página é um componente grande e autocontido (`AdminPage.tsx` ~1.900 linhas, `OrderPage.tsx` ~800). Não há camada de services/hooks no frontend ainda.
- [src/lib/orders.ts](src/lib/orders.ts) — `saveOrder()`: persistência do pedido usada por `OrderPage` e `ReadyMadePage` (nunca lança; campo `origin`: `"custom"` | `"ready_made"`). Lógica compartilhada nova vai em `src/lib/`.
- [src/data/menu.ts](src/data/menu.ts) — cardápio estático usado como fallback offline. [migration.js](migration.js) tem os mesmos dados para popular o Mongo; **mantenha os dois em sincronia** ao mudar itens/preços.
- [server/index.js](server/index.js) — Express 5 + driver `mongodb` nativo (sem Mongoose), CommonJS, arquivo único. Rotas:
  - Públicas: `GET /api/menu`, `POST /api/login`, `POST /api/orders`
  - Protegidas (`verifyToken`): `GET|POST /api/admin/menu`, `PUT|DELETE /api/admin/menu/:id`, `GET /api/admin/orders`
  - Coleção do cardápio vem de `process.env.COLLECTION_NAME`; pedidos em `pedidos`; usuários em `usuarios`.
- A URL da API está hardcoded como `http://localhost:3001` em todas as páginas.

### Modo Demo / fallback
- Se o `fetch` falha, as páginas usam `src/data/menu.ts` e/ou o cache em `localStorage` (`cardapio_admin_menu_items_v3`, legado `_v2`).
- Login offline aceita credenciais de demo e grava o token `"demo-token-123"`; o `AdminPage` verifica esse token para pular chamadas à API. Os testes do admin dependem desse caminho.
- Qualquer mudança no fluxo de dados precisa preservar o fallback offline.

## Regras de trabalho

### Fluxo (TDD incremental)
1. Uma funcionalidade por vez. Escreva/ajuste o teste primeiro em `src/test/<Página>.test.tsx`, veja falhar, implemente, refatore.
2. Antes de declarar pronto: `npm test` 100% verde **e** `npx tsc -b` sem erros. Rode `npx eslint <arquivos alterados>` e não introduza novos erros.
3. Testes usam React Testing Library + `BrowserRouter`; `window.open`, `scrollTo`, `ResizeObserver` e `Image` já são mockados em [src/test/setup.ts](src/test/setup.ts). Para chamadas de API, mocke `fetch` com `vi.fn()` / `vi.spyOn(global, "fetch")` — nunca dependa do backend rodando.
4. Prefira queries acessíveis (`getByRole`, `getByLabelText`) a seletores por classe.

### Commits
- Conventional Commits com escopo, descrição em inglês, minúscula: `feat(admin): ...`, `fix(order): ...`, `style(home): ...`, `test(ready): ...`, `docs: ...`. Escopos usados: `admin`, `order`, `home`, `ready`, `auth`, `preloader`, `assets`, `server`.
- Commits atômicos, um por funcionalidade verde. Não commitar sem pedido explícito do usuário na sessão.
- Nunca editar ou commitar à mão arquivos de `dist/` (saída de build).

### Segurança
- Nunca commitar `.env` / `server/.env` (já cobertos pelo `.gitignore`) nem imprimir seus valores.
- Rotas novas de escrita administrativa sempre atrás de `verifyToken`.
- Validar e sanitizar tudo que vem de `req.body` / `req.params` no servidor: tipos primitivos esperados (rejeitar objetos onde se espera string — injeção de operadores `$`), tamanhos máximos, números finitos e ≥ 0 em preços.
- Nunca montar `RegExp` com input do usuário sem escapar.
- Não adicionar novas credenciais hardcoded no frontend.

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
- Pagamento em dinheiro exige "troco para" ≥ total ou "Não preciso".
- Entrega exige rua, número e bairro.

## Backlog conhecido (dívidas encontradas na análise de 14/10/2026)

Prioridade alta — corretude/segurança:
1. `POST /api/login` monta `RegExp` com o username sem escapar (ReDoS / bypass com `.*`) e retorna 404 vs 401 diferentes (enumeração de usuários).
2. `POST /api/orders` grava `req.body` cru, sem validação — aceita qualquer payload, inclusive `total` arbitrário calculado no cliente.
3. `JWT_SECRET` cai em `'fallback_secret'` se ausente; `cors()` aberto para qualquer origem; sem Helmet nem rate limiting (o GEMINI.md descreve isso como existente, mas não está implementado).
4. Credenciais de demo hardcoded em `LoginPage.tsx` e `server/create-admin.js`.

Prioridade média — estrutura:
5. Extrair `API_URL` para `import.meta.env.VITE_API_URL` (hoje `localhost` fixo quebra o deploy no Vercel).
6. Criar `.env.example` (raiz e `server/`).
7. `dist/` está versionado no git — adicionar ao `.gitignore` e remover do índice.
8. Lint: 71 erros (maioria `no-undef` em arquivos Node do `server/`, `migration.js` e `scripts/` por falta de `globals.node` na config; `any` em `OrderPage`/`ReadyMadePage`).
9. Tipos de domínio (`MenuItem`, `Order`) duplicados entre páginas — centralizar em `src/types/`.
10. Lógica de total/mensagem de WhatsApp duplicada entre `OrderPage` e `ReadyMadePage` — extrair para `src/lib/` com testes unitários.
11. Servidor sem testes (sugestão: `supertest` + `mongodb-memory-server`).
12. `window.open` do WhatsApp roda depois de um `await` (salvar pedido) — validar em iPhone/Safari real se o pop-up não é bloqueado; se for, abrir a aba de forma síncrona e só depois definir a URL.

Ao concluir um item, remova-o daqui no mesmo commit.
