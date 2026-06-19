## Objetivo

Criar uma página única `/admin/fontes` que centraliza o gerenciamento de TODAS as fontes que alimentam o sistema: importações de estoque, importações de clientes, catálogo de peças (em massa por filtro) e caches de pesquisa de mercado/IA. Tudo com CRUD simples, sem ter que mexer em SQL.

## Tela `/admin/fontes`

Layout com 4 abas no topo, cada uma listando suas fontes em tabela + ações:

```text
┌─────────────────────────────────────────────────────────────┐
│ Fontes de Dados                                             │
│ [Estoque] [Clientes] [Catálogo] [Pesquisas IA/Mercado]      │
├─────────────────────────────────────────────────────────────┤
│ Arquivo          Filial    Data    Linhas  Valor  Status  ⋮ │
│ XCMG 28-05.xlsx  XCMG      28/05   20.958  R$273M  ✓     ⋮ │
│   └─ Editar | Reprocessar | Excluir só registro |          │
│      Excluir + reverter peças                              │
└─────────────────────────────────────────────────────────────┘
```

### Aba 1 — Importações de Estoque (`stock_imports`)
Colunas: arquivo, filial/fonte, data, linhas, unidades, valor, status.
Ações por linha:
- **Editar metadados** — dialog com `file_name`, `source_label`, `imported_at`.
- **Reprocessar** — re-roda a agregação por material a partir de `stock_import_items` e re-aplica upsert em `parts` (mesmo fluxo da edge function `import-catalog`, etapa 3).
- **Excluir só registro** — `DELETE` em `stock_imports` (cascata limpa `stock_import_items`); peças no catálogo permanecem.
- **Excluir + reverter peças** — nova edge function `revert-stock-import`: para cada material da importação, se aquela importação era a única fonte de stock, zera o `stock`; se também era a única referência da peça, exclui a linha de `parts`. Depois apaga a importação.

### Aba 2 — Importações de Clientes (`customer_imports`)
Colunas: arquivo, data, linhas, inseridos, atualizados, ignorados, status.
Ações: editar nome do arquivo, excluir registro, ver relatório (`report` jsonb em dialog).
Reverter clientes não está no escopo (não há vínculo cliente↔import hoje); deixar isso explícito na UI.

### Aba 3 — Catálogo de Peças (`parts`)
Painel de "limpeza em massa" por filtro combinável:
- Fabricante, modelo, categoria, faixa de preço, "sem estoque", "sem fabricante", "sem descrição".
- Mostra preview com contagem antes de aplicar.
- Botões: **Excluir selecionadas**, **Zerar estoque**, **Marcar como inativas** (campo novo opcional — ver técnica).

### Aba 4 — Pesquisas IA/Mercado
Duas seções:
- **Market Research** (`market_research`): lista por peça, com botão para limpar tudo de uma peça ou tudo anterior a uma data.
- **AI Compatibility** (`ai_compatibility_results`): mesma coisa — limpar por peça, por modelo de IA usado, ou tudo.

## Acesso

Rota protegida por `ProtectedRoute` + checagem `has_role(auth.uid(), 'admin')` (já existe o sistema). Adicionar link "Fontes de Dados" no `AppSidebar` apenas para admin.

## Detalhes técnicos

- **Frontend novo:** `src/pages/AdminSourcesPage.tsx` + componentes em `src/components/admin/sources/` (`StockImportsTab.tsx`, `CustomerImportsTab.tsx`, `PartsBulkTab.tsx`, `ResearchCacheTab.tsx`). Rota em `src/App.tsx`.
- **Hooks novos:** estender `use-stock-imports.ts` com `useUpdateStockImport`, `useReprocessStockImport`, `useRevertStockImport`. Novo `use-customer-imports.ts`, `use-parts-bulk.ts`, `use-research-cache.ts`.
- **Edge functions novas:**
  - `revert-stock-import` — recebe `import_id`, reverte/exclui peças órfãs, apaga a importação.
  - `reprocess-stock-import` — re-roda a etapa de agregação+upsert para uma importação existente.
  - `bulk-delete-parts` — recebe filtros validados (Zod), apaga em batches.
- **Migration:** apenas se adotarmos "marcar inativa" — adicionar `parts.is_active boolean default true`. Caso contrário, nenhuma mudança de schema.
- **RLS:** todas as tabelas envolvidas já têm policies `authenticated` para CRUD; nada a alterar.

## Fora de escopo
- Não toca em `parts.consumer_price`, taxonomia, vendas ou usuários.
- Não cria sistema de "undo" geral — reverter só funciona para importações de estoque, conforme acordado.

## Pergunta antes de implementar
Quer o campo `is_active` em `parts` (para "desativar sem apagar"), ou só exclusão definitiva basta?