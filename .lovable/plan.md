
## Objetivo

Substituir os contatos antigos pelos oficiais em todo o site:

- **E-mail:** `vendas@asiapecas.com` (substitui `contato@asiapecas.com.br`)
- **Telefones / WhatsApp:** `(31) 99229-3767` e `(31) 98733-4504` (substitui `+55 (95) 9 7400-9289`)

O WhatsApp principal usado nos botões/links passa a ser `+55 31 99229-3767` (formato wa.me: `5531992293767`). O segundo número aparece como alternativo nas seções de contato/rodapé.

## Mudanças

1. **Rodapé do portal** (`src/components/quote/QuoteFooter.tsx`): trocar e-mail e adicionar os dois telefones.
2. **Header / topbar** (`src/pages/QuotePage.tsx`): atualizar e-mail e telefone exibidos, e o link WhatsApp do botão (desktop + mobile + botão flutuante).
3. **Página de Contato** (`src/pages/legal/ContactPage.tsx`): atualizar e-mail, telefones, JSON-LD (`telephone`, `contactPoint`) e o link `wa.me`.
4. **CategoryPublicPage** e quaisquer outros `wa.me/5595974009289` no portal (`CategoryPublicPage.tsx`, `QuoteFAQ.tsx` etc.): trocar para `5531992293767`.
5. **Edge function `send-quote-notification`**: o destinatário `vendas@asiapecas.com` já está correto; nenhuma alteração necessária.
6. Manter o segundo telefone visível nas seções de contato (rodapé e página `/contato`) como linha adicional.

## Fora do escopo

- Não alterar conteúdo das páginas legais além dos contatos.
- Não mexer em layout/cores.
