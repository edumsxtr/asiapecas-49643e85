## Objetivo
Resolver 4 problemas: (1) admin de Banners/Vitrine não salva; (2) portal mostra agrupamento por categoria com "A partir de" no lugar de páginas; (3) formulário de cotação coleta poucos dados; (4) cliente não tem conta para acompanhar cotações.

---

## 1. Banners & Vitrine — funcionar de verdade

**Diagnóstico:** A página existe em `/configuracoes/banners` (`AdminVitrinePage.tsx`), mas:
- Requer role `admin` em `user_roles` — se você não tem, a tela mostra "Acesso restrito" (mensagem atual é genérica).
- O bucket de Storage `vitrine` pode não existir, fazendo o upload falhar silenciosamente.
- Faltam `GRANT` em `vitrine_banners` / `vitrine_featured_parts` / `part_promotions` / `vitrine_settings` (RLS está, mas Data API exige GRANT).

**Ações:**
- Migração: criar bucket `vitrine` (público) se não existir; adicionar `GRANT SELECT, INSERT, UPDATE, DELETE ON public.vitrine_* TO authenticated; GRANT SELECT ON ... TO anon; GRANT ALL ... TO service_role`.
- Melhorar mensagens de erro do `BannerCard.save` e do upload (mostrar erro real do Supabase no toast).
- Adicionar botão "Promover meu usuário a admin" só visível ao primeiro admin / quando não há nenhum — usuário já logado pode se auto-promover via RPC `bootstrap_admin()` que só funciona se `user_roles` estiver vazia.

## 2. Portal `/cotacao` — paginação obrigatória, sem preço sugerido

**Mudanças em `QuoteCatalog.tsx`:**
- Remover o modo `isUnfilteredDefault` → `CategoryGroupedView`. Sempre renderizar a grade paginada (12 por página, com numeração já existente).
- Manter `CategoryShowcase` no topo como navegação por categoria (clique aplica filtro).

**Mudanças em `QuotePartCard.tsx` e na view "lista" de `QuoteCatalog.tsx`:**
- Remover totalmente exibição de preço, "A partir de / From / Desde", riscado e percentual de desconto para qualquer visitante (logado ou não).
- Em vez disso, mostrar apenas: status de disponibilidade ("Pronta entrega", "Últimas N unidades", "Sob consulta") e selo "Em promoção" quando aplicável (sem valor).
- Remover opções de ordenação por preço.
- `FeaturedStrip` e `PromoBanner`: tirar qualquer referência a "a partir de" ou números monetários.

## 3. Cadastro completo no checkout da cotação

**`QuoteCart.tsx` — formulário expandido (espelha cadastro de cliente):**

Campos obrigatórios:
- Nome completo do contato, E-mail, Telefone/WhatsApp, CNPJ ou CPF.

Campos da empresa (obrigatórios para PJ):
- Razão social (`legal_name`), Nome fantasia (`trade_name`), Inscrição estadual.

Endereço estruturado:
- CEP (com auto-preenchimento via ViaCEP), Rua, Número, Complemento, Bairro, Cidade, UF, País.

Operacionais:
- Segmento (mineração, construção, locação, revenda, outro), Modelos de interesse (multi-select dos modelos do catálogo), Observações.

Conta (opcional):
- Checkbox "Criar conta para acompanhar minhas cotações" → campos senha + confirmar senha. Se marcado, faz signup com `supabase.auth.signUp` e vincula a cotação ao usuário.

Validação com `zod` (mensagens em PT/EN/ES). Persistir todos os campos extras em `quote_requests.customer_payload` (jsonb) **e** criar/atualizar registro em `customers` na hora.

## 4. Conta do cliente + acompanhamento de cotações

**Migração:**
- Adicionar `quote_requests.auth_user_id uuid references auth.users(id)`, `customer_id uuid references customers(id)`, `customer_payload jsonb`, `status_history jsonb default '[]'`, `final_proposal_sale_id uuid references sales(id)`.
- Política RLS extra: cliente autenticado pode `SELECT` suas próprias `quote_requests` (`auth_user_id = auth.uid()`).
- Trigger: quando `sales.status` muda para `enviado` / `aprovado` / `recusado` em um sale vinculado, atualiza `quote_requests.status` e empurra evento no `status_history`.

**Frontend:**
- Página pública `/minhas-cotacoes` (rota nova): lista cotações do usuário logado, com status (pendente, em análise, proposta enviada, aprovada, recusada), data, itens e link para PDF da proposta final (`sales.proposal_number`).
- Cabeçalho do portal: quando não logado mostra "Entrar / Criar conta"; quando logado mostra menu com "Minhas cotações" e "Sair".
- Página `/portal/login` e `/portal/cadastro` (separadas da área interna/admin) usando o mesmo `AuthContext`.
- No formulário do carrinho, se já estiver logado, pré-preenche os campos a partir do `customers` vinculado.

**Vendedor/Admin:**
- Em `QuoteRequestsTab` (interno), adicionar ação "Enviar proposta final" — gera proposta (já existe fluxo de sales) e marca `final_proposal_sale_id` + status `proposta_enviada`. Cliente vê automaticamente em `/minhas-cotacoes`.

---

## Arquivos afetados

**Novos:**
- `supabase/migrations/<ts>_vitrine_grants_and_quote_accounts.sql`
- `src/pages/portal/MyQuotesPage.tsx`
- `src/pages/portal/PortalLoginPage.tsx`
- `src/pages/portal/PortalSignupPage.tsx`
- `src/hooks/use-my-quotes.ts`
- `src/lib/viacep.ts`

**Editados:**
- `src/pages/AdminVitrinePage.tsx` (mensagens de erro, bootstrap admin)
- `src/components/quote/QuoteCatalog.tsx` (remover grouped default, remover sort por preço)
- `src/components/quote/QuotePartCard.tsx` (remover preço/A partir de)
- `src/components/quote/FeaturedStrip.tsx`, `PromoBanner.tsx` (remover valores)
- `src/components/quote/QuoteCart.tsx` (form completo + signup opcional)
- `src/pages/QuotePage.tsx` (menu cliente logado / Minhas cotações)
- `src/App.tsx` (novas rotas públicas)
- `src/hooks/use-quote-requests.ts` (incluir novos campos)
- `src/components/quote/QuoteRequestsTab.tsx` (ação "Enviar proposta final")

**Fora de escopo:** redesign visual adicional, blog, páginas legais.