# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Clientes de uma açaiteria de bairro ("Açaí no Kilo") que pedem **de casa, pelo celular**, com calma, para entrega ou retirada. O trabalho deles é montar um açaí do seu jeito (ou escolher um pronto) e mandar o pedido para a loja pelo WhatsApp.

Usuário secundário: o dono/funcionário da loja, que gerencia cardápio, preços, estoque e pedidos no painel `/admin`.

## Product Purpose
Cardápio digital mobile-first que substitui a troca de mensagens para montar um pedido: o cliente escolhe tamanho, sabor e complementos, vê o total, informa entrega/pagamento e envia uma mensagem pronta para o WhatsApp da loja. O pedido também é salvo para o painel admin (pedidos do dia, relatórios). Sucesso = pedido completo, correto e enviado sem fricção.

## Positioning
A loja se diferencia pela **variedade de complementos**: dezenas de coberturas, adicionais, cremes, frutas e recheios. Montar "do seu jeito" é o centro da experiência, não um detalhe.

## Operating Context
- Fluxo `/montar` em 10 etapas: Tamanho → Sabor → Coberturas → Adicionais → Cremes → Frutas → Recheios → Entrega ou Retirada → Forma de Pagamento → Resumo. Tamanho e sabor são escolha única; complementos são múltiplos e opcionais. Retirada pula a etapa de pagamento (paga no balcão).
- `/prontos`: açaís prontos com carrinho. `/`: home com as duas opções.
- O pedido termina no WhatsApp da loja; o valor final é confirmado ali.
- Funciona offline em modo demonstração com dados locais (usado para apresentar ao cliente na Vercel); produção terá hospedagem própria.

## Capabilities and Constraints
- React 19 + Vite + TypeScript + Tailwind; GSAP/Lenis disponíveis. Backend Express + MongoDB.
- Cardápio editável pelo admin (itens podem ser desativados, criados ou ter o preço alterado), então a interface precisa aguentar listas de tamanho variável (até ~26 itens por etapa) e nomes longos.
- Taxa de entrega fixa de R$ 7; troco obrigatório para dinheiro; entrega exige rua, número e bairro.
- Textos em português do Brasil.

## Brand Commitments
- Nome "Açaí no Kilo" e o **logo atual** (`public/assets/Logo açai.webp`) — obrigatório manter.
- O **mascote** (`public/assets/Mascote.webp`, `Mascote_comendo.webp`) — obrigatório manter onde fizer sentido.
- Fotos dos ingredientes, paleta e tipografia atuais **não** foram declaradas obrigatórias.
- **Linguagem 2D** (recomendação de designer acatada pelo dono, 14/10/2026): o mascote e o logo são ilustrações chapadas, então as telas devem conversar com elas em 2D — evitar o "card 3D" (sombras de profundidade, vidro/desfoque, elevação no hover).
- Não fugir da identidade da home: fundo roxo-escuro e dourado continuam reconhecíveis.

## Evidence on Hand
- Fotos quadradas (400×400 `.webp`) de cada ingrediente em `public/assets/items/`, todas no mesmo estilo: tigela de vidro vista de cima sobre fundo roxo. Seis arquivos de tamanho (`pot_*`, `cup_*`) estão vazios; os tamanhos usam `Açai_350ml/500ml/750ml.webp` e `POTE_LITRO.webp`.
- Fotos de açaís prontos em `public/assets/` (`500ml_*`, `1l_*`, `2l_*`).
- Não há depoimentos, avaliações, endereço ou horário da loja no projeto — não inventar.

## Product Principles
1. Montar é o prazer: a variedade de complementos deve parecer abundância, não formulário.
2. O total e o que já foi escolhido ficam sempre à vista; nenhuma surpresa no WhatsApp.
3. Uma mão, um polegar: tudo alcançável e legível no celular, de 320px em diante.
4. Nada impede o pedido de chegar: falhas de rede nunca travam o envio.
