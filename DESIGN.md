---
name: Açaí no Kilo
description: Cardápio mobile-first para montar açaí do seu jeito, em 2D chapado roxo e ouro.
colors:
  gold: "#F0DF58"
  cream: "#F8EEA6"
  ink: "#120714"
  ground: "#241220"
  panel: "#2f1729"
  panel-deep: "#3a1d33"
  orange: "#F58220"
  whatsapp-green: "#25D366"
  text: "#FFFFFF"
typography:
  display:
    fontFamily: "Bebas Neue, sans-serif"
    fontSize: "clamp(3rem, 12vw, 4.75rem)"
    fontWeight: 400
    lineHeight: 0.9
  headline:
    fontFamily: "Bebas Neue, sans-serif"
    fontSize: "28px"
    fontWeight: 400
    lineHeight: 0.95
  title:
    fontFamily: "Bebas Neue, sans-serif"
    fontSize: "26px"
    fontWeight: 400
    lineHeight: 1
  price:
    fontFamily: "Bebas Neue, sans-serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1
  body:
    fontFamily: "Raleway, Arial, Helvetica, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Raleway, Arial, Helvetica, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.25
  label-sm:
    fontFamily: "Raleway, Arial, Helvetica, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.25
rounded:
  md: "16px"
  lg: "24px"
  tile: "28px"
  sheet: "32px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.full}"
    height: "56px"
  button-primary-hover:
    backgroundColor: "{colors.cream}"
  button-primary-disabled:
    backgroundColor: "rgba(255,255,255,0.06)"
    textColor: "rgba(255,255,255,0.4)"
  button-whatsapp:
    backgroundColor: "{colors.whatsapp-green}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.full}"
    height: "56px"
  button-round-ghost:
    textColor: "{colors.text}"
    rounded: "{rounded.full}"
    size: "44px"
  total-capsule:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    height: "44px"
    padding: "0 16px 0 6px"
  tile:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.tile}"
    padding: "20px"
  tile-selected:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
  input:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    height: "48px"
    padding: "0 16px"
  input-search:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.full}"
    height: "48px"
    padding: "0 20px 0 44px"
  home-choice-card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.sheet}"
    padding: "20px"
---

# Design System: Açaí no Kilo

## Overview

**Creative North Star: "O Adesivo na Tampa"**

Um mundo chapado, recortado como adesivo: fundo roxo-profundo liso, painéis um tom acima, e tudo o que importa (seleção, ação principal, total) em campos sólidos de ouro contornados por uma linha de tinta quase preta. Nada flutua por sombra, nada é vidro: a profundidade é só troca de cor e contorno, para conversar com o logo e o mascote, que são ilustrações 2D (compromisso de marca do dono, 14/10/2026).

A densidade é de celular na mão: uma decisão por tela, controles grandes, títulos enormes em Bebas Neue e texto corrido curto em Raleway. As fotos dos ingredientes viram adesivos circulares com borda creme; escolher é ver o adesivo "pular" e ganhar borda de ouro. Toda forma interativa é cápsula ou círculo.

Rejeições confirmadas: o "card 3D" do visual anterior (sombras de profundidade, vidro/desfoque, gradientes, elevação no hover).

**Key Characteristics:**
- Chapado: cor e contorno de 2px fazem todo o trabalho de hierarquia; zero `box-shadow`.
- Ouro é estado: selecionado, ação primária e total. Não é decoração.
- Cápsulas e círculos para tudo o que se toca; cantos de 28px para blocos.
- Bebas Neue para títulos, preços e números; Raleway para o resto.
- Movimento curto e com função: preenchimento do progresso e "pulo" do adesivo, 0,4s.

## Colors

Roxo-profundo de fundo, ouro como voz única de ação, creme como luz secundária, e laranja só para fatos pequenos.

### Primary
- **Ouro Adesivo** (gold): campo sólido de seleção (tiles e adesivos escolhidos), botão primário "Próximo", cápsula do total, segmentos de progresso preenchidos, preços sobre fundo roxo, cursor de digitação, anel de foco e cor de seleção de texto.

### Secondary
- **Creme de Tampa** (cream): borda dos adesivos circulares não selecionados, estado hover do botão ouro, destaque de texto curto na home ("do seu jeito!") e fundo da foto do tamanho selecionado.

### Tertiary
- **Laranja de Etiqueta** (orange): apenas fatos secundários pequenos: taxa de entrega, aviso de troco insuficiente, confirmação de remoção na lista do carrinho (borda + fundo a 10% + botão "Sim").
- **Verde WhatsApp** (whatsapp-green): exceção citada, somente na cápsula final "Finalizar no WhatsApp", porque a ação sai do app e a cor diz para onde o pedido vai.

### Neutral
- **Tinta** (ink): contorno de 2px de todo campo ouro/verde, texto sobre ouro, linhas divisórias do cabeçalho e rodapé fixos, véu do modal a 75%.
- **Chão Roxo** (ground): fundo de página, cabeçalho fixo e folha "Seu açaí".
- **Painel** (panel): tiles, inputs, cards da home, rodapé fixo, base do total na folha.
- **Painel Fundo** (panel-deep): fundo atrás de fotos de tamanho e miniaturas.
- **Branco** (text): texto principal; em transparências para hierarquia: 85% (itens do resumo), 75–80% (dicas e rótulos), 60% (secundário, vazio), 35–40% (placeholder, desabilitado); bordas em 10% (repouso), 20–25% (botões fantasma), 30–50% (hover); trilho de progresso em 15%.

### Named Rules
**The Ouro É Estado Rule.** Ouro sólido marca o que está escolhido ou é a próxima ação. Um elemento ouro sem contorno de tinta de 2px não existe neste mundo.

**The Uma Saída Verde Rule.** O verde WhatsApp aparece uma única vez, no botão que envia o pedido. Nenhum outro elemento usa verde.

**The Laranja Pequeno Rule.** Laranja só em texto ou controle pequeno de fato secundário (taxa, aviso, remoção); nunca em campo grande nem em ação primária.

## Typography

**Display Font:** Bebas Neue (com sans-serif), via Google Fonts
**Body Font:** Raleway (com Arial, Helvetica, sans-serif), via Google Fonts, eixo de peso 100–900

**Character:** Bebas condensada e alta faz cartaz de balcão para títulos e preços; Raleway geométrica e legível carrega dicas, rótulos e nomes longos de ingredientes.

### Hierarchy
- **Display** (400, clamp(3rem, 12vw, 4.75rem), 0.9): título de cada etapa da montagem, com `text-balance`. Na home, os títulos dos cards usam a mesma face em 36–60px, maiúsculas.
- **Headline** (400, 28px, 0.95): nomes em tiles de entrega, legendas de fieldset ("Endereço de entrega"), "Total" e linha do tamanho no resumo. O título da folha "Seu açaí" sobe a 34px em ouro.
- **Title** (400, 26px, 1): rótulo dos botões grandes (Próximo, WhatsApp, Continuar montando) e nome do tamanho no tile.
- **Price** (400, 22px, 1): preço no tile de tamanho; preços de complementos e itens de lista em 18px; total na cápsula em 24px; total do resumo em 48px.
- **Body** (400, 15px): dica da etapa (branco 75%), itens do resumo e da lista do carrinho.
- **Label** (700, 14px): rótulos de campo (branco 80%), subtítulos de tile, sabor escolhido em ouro.
- **Label-sm** (700, 13px): nome do ingrediente nas grades de múltipla escolha (16px nas de escolha única), centralizado e balanceado.

### Named Rules
**The Número É Cartaz Rule.** Todo preço, total e contagem usa Bebas Neue com algarismos alinhados e tabulares (`lining-nums tabular-nums` na raiz; controles de formulário herdam via `font-variant-numeric: inherit`).

**The Títulos Apertados Rule.** Cabeçalhos h1–h6 usam Bebas com `letter-spacing: -0.02em` e entrelinha curta (0.9–1.1).

## Layout

Coluna única centrada de no máximo 680px na montagem (padding lateral 16px, 24px a partir de `sm`), com cabeçalho fixo no topo e rodapé fixo embaixo; o conteúdo reserva 144px de folga inferior para o rodapé. O rodapé respeita `env(safe-area-inset-bottom)` (mínimo 12px).

Grades: tamanhos em 2 colunas (4 a partir de `sm`); escolha única em 2 colunas (3 em `sm`); múltipla escolha em 3 colunas (4 em `sm`) com espaçamento horizontal 12px e vertical 24px; entrega em 2 colunas; pagamento em 3. O nome do ingrediente ocupa a sobra da célula para os preços ficarem alinhados na linha.

Ritmo: 8 / 12 / 16 / 20 / 24px. Tiles com 20px de padding interno; blocos de etapa separados por 20–24px.

Home: coluna centrada (448px, 672px em `lg`, 768px em `xl`) com logo e dois cards de escolha empilhados; mascotes ancorados nos cantos (comendo no topo esquerdo, de pé no canto inferior direito), crescendo com a tela. Breakpoints extras do Tailwind: `xs` 475px, `3xl` 1600px, `4xl` 1920px. Zero scroll horizontal de 320px em diante.

## Elevation & Depth

Sistema totalmente chapado. Não há `box-shadow`, `backdrop-filter` nem gradiente nas superfícies deste mundo. A profundidade vem de três camadas tonais (chão #241220, painel #2f1729, painel fundo #3a1d33), de bordas de 2px e de linhas de tinta separando o cabeçalho e o rodapé fixos do conteúdo. Sobreposições (folha "Seu açaí") se destacam por um véu de tinta a 75%, não por sombra.

### Named Rules
**The Sem Sombra Rule.** Nenhuma superfície ganha sombra, vidro ou desfoque, em repouso ou em hover. Se algo precisa se destacar, troque a cor de fundo ou da borda.

**The Hover Sem Elevação Rule.** Hover muda cor de borda (branco 10% → 30%, 20–25% → 40–50%) ou de fundo (ouro → creme); nunca desloca nem eleva o bloco. Na home, só a ilustração dentro do card cresce 5%.

## Shapes

Tudo o que se toca é cápsula (`9999px`) ou círculo: botões, total, busca, segmentos de progresso (5px de altura), botões de ícone (44px e 56px), selo de check (32px). Blocos usam cantos generosos: 28px para tiles e cartões de resumo, 24px para tiles de pagamento e o invólucro do adesivo, 32px para os cards da home (40px em `lg`) e o topo da folha inferior, 16px para inputs, linhas de lista e miniaturas.

Contorno é linguagem: 2px sempre (tinta em campos ouro/verde, branco translúcido no resto); 3px só no aro dos adesivos circulares. Fotos de ingrediente são cortadas em círculo e ampliadas 1.4× para a tigela preencher o adesivo.

## Components

### Buttons
Cápsulas grossas, chapadas e contornadas, como etiqueta de preço.
- **Shape:** cápsula total; 56px de altura no rodapé, 44px no cabeçalho e na home.
- **Primary:** ouro com texto e contorno de tinta de 2px, rótulo em Bebas 26px, ícone de seta à direita.
- **Hover / Focus:** hover troca para creme (transição de cor 200ms ease-out); foco visível é contorno ouro de 2px com afastamento de 2px (4px nos cards da home).
- **Disabled:** branco 6% de fundo, borda branca 10%, texto branco 40%, cursor bloqueado.
- **WhatsApp:** mesma cápsula em verde WhatsApp; desabilitado a 50% de opacidade enquanto o pedido é salvo.
- **Round ghost:** círculo de 44px (56px no rodapé) com borda branca 20–25% e ícone branco; hover sobe a borda para 40–50%.
- **Toggle pill:** "Não preciso de troco" é cápsula de 48px; desligada é fantasma, ligada vira campo ouro com check.

### Cards / Containers
- **Corner Style:** 28px (tiles, resumo), 24px (pagamento), 32–40px (home).
- **Background:** painel; selecionado vira ouro com contorno de tinta e texto de tinta.
- **Shadow Strategy:** nenhuma (ver Elevation & Depth).
- **Border:** 2px branco 10% em repouso, 30% em hover.
- **Internal Padding:** 20px (tiles e resumo); 20px horizontal / 16px vertical na faixa do total.

### Inputs / Fields
- **Style:** 48px de altura, painel, borda 2px branco 10%, cantos de 16px (busca em cápsula com ícone de lupa a 16px da esquerda), texto 16px para evitar zoom no iOS, placeholder branco 35–40%, cursor ouro.
- **Focus:** borda passa a ouro; sem anel extra.
- **Error / Disabled:** erro é texto laranja 14px negrito abaixo do campo; desabilitado a 40% de opacidade.

### Navigation
- **Progresso em segmentos:** uma barra de 5px por etapa, trilho branco 15%, preenchida em ouro; a etapa atual enche com o "segFill"; etapas concluídas são clicáveis (hover creme).
- **Cabeçalho fixo:** fechar (círculo fantasma), logo 48px, e a cápsula do total à direita.
- **Rodapé fixo:** painel com linha de tinta no topo, voltar redondo de 56px + cápsula primária "Próximo: <etapa>".

### Adesivo de Ingrediente (assinatura)
Foto circular (136px na escolha única, 88–116px na múltipla) com aro creme de 3px. Selecionado: aro ouro, contorno externo de tinta de 2px, selo de check ouro de 32px no canto superior direito e o "pulo" (`stickerPop`). Nome em Raleway negrito abaixo, preço "+ R$" em Bebas ouro e porção em branco 60%.

### Cápsula do Total (assinatura)
Cápsula ouro de 44px no cabeçalho com um miolo de tinta (contador de itens em ouro com ícone de sacola) e o total em Bebas 24px; o total "pula" a cada mudança. Abre a folha "Seu açaí".

### Folha "Seu açaí"
Folha inferior até 85% da altura, cantos superiores de 32px, chão roxo, véu de tinta 75%; base em painel com total ouro em Bebas 36px e cápsula primária "Continuar montando". Remover item pede confirmação em laranja na própria linha.

## Do's and Don'ts

### Do:
- **Do** contornar todo campo ouro ou verde com 2px de tinta (#120714) e usar texto de tinta sobre ele.
- **Do** usar cápsula ou círculo para qualquer controle tocável, com alvo mínimo de 44×44px.
- **Do** mostrar preços e totais em Bebas Neue com algarismos tabulares.
- **Do** sinalizar seleção trocando o fundo para ouro (tiles) ou o aro para ouro (adesivos), com `aria-pressed`.
- **Do** limitar o movimento a 0,4s com função clara: `segFill` (cubic-bezier(0.34, 1.56, 0.64, 1)) e `stickerPop` (cubic-bezier(0.16, 1, 0.3, 1)); entradas de etapa e folha com fade/slide de 300ms ease-out; tudo desligado em `prefers-reduced-motion`.
- **Do** dar a cada etapa um título em display e uma dica em Raleway 15px a 75% de branco.

### Don't:
- **Don't** usar `box-shadow`, vidro, `backdrop-blur`, gradientes ou elevação/deslocamento no hover em superfícies.
- **Don't** usar o verde WhatsApp fora do botão final de envio.
- **Don't** usar laranja em campos grandes ou ações primárias.
- **Don't** usar o token `primary` do Tailwind (#E6D62E) nem inventar outro amarelo; o ouro deste mundo é #F0DF58.
- **Don't** trocar ou recolorir o logo e o mascote; eles são a referência 2D do sistema.
