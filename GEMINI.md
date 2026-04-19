# Memória do Projeto: Cardápio Açaí no Kilo

Este arquivo contém o contexto acumulado, regras de negócio e diretrizes técnicas para garantir a continuidade e estabilidade do projeto em todas as sessões.

## 📌 Contexto Geral
Um cardápio interativo mobile-first para montagem de açaí personalizado, com envio de pedido via WhatsApp. O foco é uma experiência "Premium" e intuitiva.

## 🛠️ Stack Tecnológica
- **Framework:** Next.js 16.2 (App Router)
- **Estilização:** Tailwind CSS + Efeito Glassmorphism
- **Animações:** GSAP + Framer Motion (tailwindcss-animate)
- **Scroll:** Lenis (Smooth Scroll)
- **Ícones:** Lucide React + Custom PNG Assets

## 🎨 Identidade Visual
- **Cor Primária:** `#F6E632` (Amarelo vibrante - botões e destaques)
- **Cor Secundária:** `#b32aa6` (Ametista Vibrante - contraste moderno)
- **Fundo Deep:** `#3d1b34` (Deep Violet - Roxo profundo premium)
- **Fontes:** `Bebas Neue` (Títulos) e `Raleway` (Textos)

## 🚀 Funcionalidades Cruciais (Testar Sempre)
1.  **Multi-step:** Navegação entre os 10 passos (Tamanho -> Sabor -> ... -> Entrega -> Pagamento -> Resumo).
2.  **Cálculo de Preço:** O total deve somar o valor base + opcionais + R$ 7,00 (se for entrega).
3.  **Seleção Única vs Múltipla:** 
    - Tamanho, Sabor, Entrega e Pagamento: Seleção única.
    - Outros: Seleção múltipla.
4.  **Carrinho Lateral:** Clicar no ícone do topo deve abrir o drawer com resumo. O scroll de fundo deve travar.
5.  **Hold to Delete:** Excluir itens do carrinho requer segurar o botão de lixeira por 1s (barra de progresso preenche o fundo do item).
6.  **WhatsApp Link:** Mensagem direta e limpa, com endereço e forma de pagamento inclusos.

## 📝 Regras de Implementação (Engineering Standards)
- **Mobile-First:** Priorizar sempre a visualização em celulares antes de expandir para desktop.
- **Contraste:** Garantir que textos sobre o fundo roxo sejam sempre brancos (`text-white/90`) e sobre o amarelo sejam escuros (`text-secondary`).
- **Performance:** Manter as transições suaves e garantir que o `setInterval` de deleção seja limpo para evitar memory leaks.
- **Surgical Edits:** Modificar apenas as linhas necessárias, mantendo o código idiomático.

## 🧪 Plano de Testes Manuais
Antes de entregar qualquer mudança, validar:
- [ ] O total soma R$ 7,00 ao escolher "Receber em Casa"?
- [ ] O campo de endereço aparece apenas no delivery e bloqueia o "Próximo" se vazio?
- [ ] A opção de "Dinheiro" abre o campo de troco e o botão "Não preciso de troco"?
- [ ] O scroll trava no carrinho mas funciona dentro dos menus (`data-lenis-prevent`)?
- [ ] A barra de 'Hold to Delete' preenche todo o fundo do item no carrinho?
- [ ] A mensagem do WhatsApp está formatada corretamente com o método de pagamento?

---
*Atualizado em: 19 de Abril de 2026*
