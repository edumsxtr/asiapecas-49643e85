

# Plano Revisado: Auditoria + Pesquisa de Mercado IA + Catálogo por Categoria + Visão Tabela

## Diagnóstico do que já existe (auditoria)

Antes de adicionar coisas novas, identifiquei **redundâncias** e **conexões faltantes** que precisam ser resolvidas para o sistema ficar fluido:

### Redundâncias encontradas
- **Catálogo principal** (`/catalogo`) e **Estoque** (`/estoque`) mostram peças com filtros parecidos — manter como visões diferentes mas unificar o componente de tabela/cards
- **Pesquisa de Mercado** existe em 2 lugares: página dedicada `/pesquisa-mercado` e aba dentro do `PartDetailDialog` — manter ambas mas garantir que **compartilham o mesmo hook e o mesmo botão de IA**
- **Margem global** aparece em 2 lugares (`pricing_settings` na NewOrderPage + `proposal_settings` em Vendas) — unificar: a aba Configurações de Vendas passa a ser **a única fonte de verdade**, NewOrderPage apenas lê

### Conexões faltantes (fluxo de informação)
- Pesquisa de mercado **não influencia** o preço sugerido na hora de vender — vamos puxar o menor preço de concorrente como referência no carrinho
- Categoria da peça **não aparece** no carrinho nem na proposta PDF — vamos exibir
- Peça pesquisada por IA **não marca visualmente** no catálogo que já tem dados de mercado — adicionar badge "Pesquisado"
- Cotação recebida (`quote_requests`) → conversão em venda **já existe** mas não preserva os dados de pesquisa — garantir continuidade

## O que será construído

### 1. Pesquisa de Mercado por IA (item por item)

- Edge function `auto-market-research` usando **Lovable AI (`google/gemini-2.5-pro`) com Google Search** retornando JSON estruturado: `{ distribuidor, preço, prazo_dias, disponibilidade, url_fonte, observação }`
- Botão **"Pesquisar com IA"** no `MarketResearchTab` (dentro do `PartDetailDialog`) e na linha de cada peça na página `/pesquisa-mercado`
- Resultados salvos em `market_research` com `researched_by = "IA"` e `source_url` preenchida
- Tratamento de **429/402** com toasts amigáveis
- Se IA não encontrar referências, salva 1 linha com `notes = "IA não encontrou referências confiáveis"` em vez de inventar dados
- Badge "Pesquisado" no `PartCard` e `PartTable` quando a peça já tem ≥1 entrada em `market_research`

### 2. Catálogo por Categoria (nova página `/catalogo/categorias`)

- **Sidebar lateral** com as 11 categorias de `part_category` + contador de peças e ícones (reutilizar `part-categories.ts`)
- **Header de KPIs** da categoria selecionada: nº peças, unidades, valor total, preço médio, peça destaque
- **Toggle Cards/Tabela** persistido em `localStorage` (`catalog-view-mode`)
- Filtros locais: busca por código/descrição, fabricante, modelo, faixa de estoque
- Paginação (50/página)
- Botão "Pesquisar preços com IA" em lote opcional dentro da categoria (futuro — sinalizado como próximo passo, mas não implementado nesta fase)

### 3. Visão Tabela reutilizável

- Estender o `PartTable.tsx` existente com colunas: código, descrição, **categoria** (badge), modelo, fabricante, estoque, preço custo, **preço sugerido** (markup aplicado), **menor preço de mercado** (se houver), badge "Pesquisado", ações (ver detalhe, adicionar ao pedido)
- Toggle Cards/Tabela também no `CatalogContent.tsx` principal (mesmo componente, mesmo localStorage)

### 4. Conexão Pesquisa de Mercado → Vendas

- No `NewOrderPage` (carrinho), ao adicionar uma peça que já tem `market_research`, mostrar **"Menor concorrente: R$ X (distribuidor Y)"** abaixo do preço sugerido — ajuda a calibrar o preço de venda
- Indicador visual quando o preço de venda está **abaixo do menor concorrente** (oportunidade) ou **muito acima** (risco de perder venda)

### 5. Card "Estoque por Categoria de Peça" no Dashboard

- Novo gráfico de pizza usando `part_category` (complementa o atual que é por tipo de máquina)
- Reutiliza `chart.tsx` (recharts) já presente

### 6. Limpeza de redundâncias

- Remover duplicação de leitura de `pricing_settings` — `useProposalSettings` passa a ser a fonte única que o NewOrderPage também consome
- Garantir que `MarketResearchTab` e `MarketResearchPage` usam **o mesmo hook** `useAutoMarketResearch` e o mesmo componente de listagem de resultados

## Arquivos afetados

| Arquivo | Ação |
|---|---|
| `supabase/functions/auto-market-research/index.ts` | **Novo** — Lovable AI + Google Search, JSON estruturado, trata 429/402 |
| `src/hooks/use-auto-market-research.ts` | **Novo** — invoca função, salva em `market_research`, invalida queries |
| `src/components/catalog/MarketResearchTab.tsx` | Adicionar botão "Pesquisar com IA" + loading state |
| `src/pages/MarketResearchPage.tsx` | Adicionar botão "Pesquisar com IA" por linha + filtro "Apenas pesquisadas por IA" |
| `src/pages/CategoriesPage.tsx` | **Nova** — sidebar + KPIs + toggle Cards/Tabela |
| `src/components/catalog/CategoryDetailView.tsx` | **Novo** — conteúdo da categoria selecionada |
| `src/components/catalog/PartTable.tsx` | Estender colunas: categoria, preço sugerido, menor concorrente, badge pesquisado |
| `src/components/catalog/PartCard.tsx` | Adicionar badge "Pesquisado" quando houver `market_research` |
| `src/components/catalog/CatalogContent.tsx` | Adicionar toggle Cards/Tabela |
| `src/components/AppSidebar.tsx` | Adicionar item "Categorias" |
| `src/App.tsx` | Adicionar rota `/catalogo/categorias` |
| `src/components/dashboard/CategoryPartsChart.tsx` | **Novo** — pizza por `part_category` |
| `src/components/dashboard/DashboardPage.tsx` | Renderizar novo card |
| `src/pages/NewOrderPage.tsx` | Mostrar menor concorrente + indicadores visuais de competitividade |
| `src/hooks/use-parts.ts` | Adicionar query auxiliar `useMarketResearchByPart` para enriquecer cards/tabela |
| `src/hooks/use-pricing.ts` | Confirmar fonte única de markup (sem duplicação com `useProposalSettings`) |

## Detalhes técnicos

- **Edge function** com `LOVABLE_API_KEY` (já existe), modelo `google/gemini-2.5-pro`, tool calling para garantir JSON estruturado, prompt focado em distribuidores brasileiros XCMG/equipamentos pesados (Tracbel, Solar, Mercado Livre, distribuidores oficiais)
- **Validação Zod** dos inputs da edge function
- **`useMarketResearchByPart`** retorna o menor preço/distribuidor para enriquecer cards e carrinho — uma única query agregada para evitar N+1
- **Acessibilidade**: tabela com `<caption>`, headers semânticos, toggle Cards/Tabela com `aria-pressed`
- **Responsividade**: tabela vira lista compacta abaixo de 768px; sidebar de categorias vira drawer no mobile
- **Performance**: paginação 50/página, `useMemo` nos filtros locais, `react-query` com `staleTime: 60s` para market_research

## Resultado esperado

- Sistema fluido onde **pesquisa de mercado alimenta a venda**, **categoria organiza tudo**, e **margem é configurada num único lugar**
- Gestor consegue ver no carrinho se está cobrando barato/caro vs concorrência
- Catálogo navegável por categoria com tabela densa para gestão rápida
- Zero duplicação de regras de preço entre páginas

