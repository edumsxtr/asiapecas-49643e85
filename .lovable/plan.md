# Reorganizar Configurações como hub central

## 1. Menu lateral (`AppSidebar.tsx`)
- Remover item "Fontes de Dados".
- "Configurações" passa a ser a porta única para administração.

## 2. Nova página `/configuracoes` (substitui o ComingSoon)
Hub com layout consistente (cabeçalho + container `max-w-7xl mx-auto p-6` para respeitar margens), organizado em seções/tabs:

- **Geral** — dados da empresa, branding, contatos padrão.
- **Comercial** — Pricing (markup global), Salespeople (CRUD), Proposal Settings.
- **Templates** — Pagamento (CRUD) e Garantia (CRUD), já existentes em `ProposalConfigTab`.
- **Usuários & Permissões** — listar `user_roles`, atribuir/remover papéis.
- **Vitrine & Portal** — atalho para banners/coleções/SEO da Vitrine.
- **Fontes de Dados** — sub-rotas em `/configuracoes/fontes/...`.

Cada seção usa sub-rotas para que cada tela tenha sua própria página (URL e título), em vez de tudo em tabs aninhadas.

## 3. Fontes de Dados em páginas separadas
Sair de tabs único e virar páginas reais sob `/configuracoes/fontes`:

- `/configuracoes/fontes` — índice com cards para cada fonte (Estoque, Clientes, Catálogo, Pesquisas IA).
- `/configuracoes/fontes/estoque` — `StockImportsTab` com paginação (10/25/50 por página) e CRUD completo (criar registro manual, editar, reprocessar, reverter, excluir).
- `/configuracoes/fontes/clientes` — `CustomerImportsTab` com paginação + CRUD.
- `/configuracoes/fontes/catalogo` — `PartsBulkTab` com paginação + CRUD.
- `/configuracoes/fontes/pesquisas` — `ResearchCacheTab` com paginação + CRUD (limpar cache por item, em lote).

Todas as listagens recebem:
- Componente reusável `<DataPagination />` (já existe `CustomerPagination` como referência).
- Container com `max-w-7xl mx-auto p-6` e respeito às margens do `AppLayout`.
- Botões "Novo", "Editar", "Excluir" padronizados nas tabelas (CRUD uniforme).

## 4. Rotas (`App.tsx`)
- Remover `/admin/fontes`.
- Adicionar: `/configuracoes`, `/configuracoes/fontes`, `/configuracoes/fontes/:tipo`, todas dentro de `ProtectedRoute`.
- Redirect `/admin/fontes` → `/configuracoes/fontes` para não quebrar links antigos.

## Detalhes técnicos
- Novos arquivos: `src/pages/SettingsPage.tsx`, `src/pages/settings/SourcesIndexPage.tsx`, `src/pages/settings/SourceDetailPage.tsx`, `src/components/settings/SettingsNav.tsx`, `src/components/common/DataPagination.tsx`.
- Reaproveitar hooks existentes (`use-stock-imports`, `use-admin-sources`, `use-customer-imports` etc.) — apenas adicionar paginação client-side via `useMemo` + slice.
- Sem mudanças no schema (tabelas e RLS continuam iguais).

## Fora de escopo
- Reescrita das edge functions de importação.
- Sistema novo de permissões granulares (apenas reutilizar `user_roles` existente).
