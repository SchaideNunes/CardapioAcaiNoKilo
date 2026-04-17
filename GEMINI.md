# Memória do Projeto: Cardápio Açaí no Kilo

Este arquivo contém o contexto acumulado, regras de negócio e diretrizes técnicas para garantir a continuidade e estabilidade do projeto em todas as sessões.

## 📌 Contexto Geral
Um cardápio interativo mobile-first para montagem de açaí personalizado, com envio de pedido via WhatsApp. O foco é uma experiência "Premium" e intuitiva.

## 🛠️ Stack Tecnológica
- **Framework:** Next.js 16.2 (App Router)
- **Estilização:** Tailwind CSS + Efeito Glassmorphism
- **Animações:** GSAP + Framer Motion (tailwindcss-animate)
- **Scroll:** Lenis (Smooth Scroll)
- **Ícones:** Lucide React

## 🎨 Identidade Visual
- **Cor Primária:** `#F6E632` (Amarelo vibrante - botões e destaques)
- **Cor Secundária:** `#931B88` (Roxo clássico)
- **Fundo Deep:** `#2a1224` (Roxo escuro para contraste premium)
- **Fontes:** `Bebas Neue` (Títulos) e `Raleway` (Textos)

## 🚀 Funcionalidades Cruciais (Testar Sempre)
1.  **Multi-step:** Navegação entre os 8 passos (Tamanho -> Sabor -> ... -> Resumo).
2.  **Cálculo de Preço:** O total deve somar o valor base (Passo 1) com todos os opcionais.
3.  **Seleção Única vs Múltipla:** 
    - Tamanho e Sabor: Seleção única (radio).
    - Outros: Seleção múltipla (checkbox).
4.  **Carrinho Lateral:** Clicar no ícone do topo deve abrir o drawer com resumo.
5.  **Hold to Delete:** Excluir itens do carrinho requer segurar o botão de lixeira por 2 segundos (barra de progresso vermelha).
6.  **WhatsApp Link:** O link final deve conter a mensagem formatada com todos os itens e o total correto.

## 📝 Regras de Implementação (Engineering Standards)
- **Mobile-First:** Priorizar sempre a visualização em celulares antes de expandir para desktop.
- **Contraste:** Garantir que textos sobre o fundo roxo sejam sempre brancos (`text-white/90`) e sobre o amarelo sejam escuros (`text-secondary`).
- **Performance:** Manter as transições suaves e garantir que o `setInterval` de deleção seja limpo para evitar memory leaks.
- **Surgical Edits:** Modificar apenas as linhas necessárias, mantendo o código idiomático.

## 🧪 Plano de Testes Manuais
Antes de entregar qualquer mudança, validar:
- [ ] O total do pedido bate com a soma dos itens?
- [ ] A barra de progresso do 'Hold to Delete' preenche corretamente?
- [ ] O scroll trava quando o modal do carrinho está aberto?
- [ ] Os itens somem do carrinho após a exclusão?
- [ ] O botão "Próximo" bloqueia se a base (Tamanho/Sabor) não for escolhida?

---
*Atualizado em: 17 de Abril de 2026*
