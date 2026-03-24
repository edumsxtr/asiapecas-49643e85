

# Plano: Análise Avançada de Estoque + Detecção de Duplicados + Integração Total entre Módulos

## Resumo

Transformar o sistema num ERP integrado com: análise profunda de estoque (novas métricas, duplicados, estudo de mercado), botões de atualização/revisão/especificações em cada peça, e navegação cruzada entre todos os módulos (Clientes ↔ Vendas ↔ Pedidos ↔ Estoque ↔ Relatórios).

---

## 1. Análise Avançada de Estoque (StockPage)

### Novas métricas e KPIs
- **Giro de estoque**: valor vendido / valor em estoque (usando dados de `sales` + `sale_items`)
- **Cobertura de estoque**: dias estimados até esgotar (baseado em vendas recentes)
- **Concentração ABC**: classificar peças em A (80% do valor), B (15%), C (5%)
- **Top 10 peças mais vendidas** vs **Top 10 peças paradas** (cruzar `sale_items` com `parts`)
- **Valor por m2** (se aplicável), **preço médio por categoria**, **preço médio por fabricante**
- **Peças sem venda**: quantas peças nunca foram vendidas (cross com `sale_items`)

### Detecção de peças duplicadas
- Novo card "Peças Potencialmente Duplicadas" na página de estoque
- Query que agrupa por `description` similar (usando `similarity()` ou ILIKE com normalização)
- Também detectar materiais com mesma descrição mas códigos diferentes
- Mostrar tabela com: Material A, Material B, Descrição, Estoque A, Estoque B, Ação (Mesclar/Ignorar)

### Estudo de mercado integrado
- Card na página de estoque: "Competitividade" com dados de `market_research`
- Mostrar quantas peças estão acima/abaixo do preço de mercado
- Link direto para pesquisa de mercado de cada peça

## 2. Botões de Ação no Catálogo e Estoque

### Em cada peça (PartCard + PartDetailDialog)
- **Atualizar**: editar estoque, preço, modelo diretamente (dialog inline)
- **Revisar**: marcar peça como "revisada" + data da revisão (novo campo `reviewed_at`)
- **Especificações IA**: botão que chama a pesquisa IA e salva em `ai_compatibility_results`
- **Semelhanças**: botão que busca peças com descrição similar no catálogo (query ILIKE)
- **Ver Vendas**: link direto para vendas que incluem esta peça
- **Pesquisa de Mercado**: link direto para pesquisas desta peça

### Nova coluna na tabela `parts`
- `reviewed_at` (timestamp, nullable) — data da última revisão manual

## 3. Integração Total entre Módulos

### Dashboard (Index)
- Card "Vendas Recentes" com link para `/vendas`
- Card "Tickets Abertos" com link para `/pos-venda`
- Card "Prospects Quentes" com link para `/prospeccao`
- Gráfico de vendas por mês (novo)

### Clientes → Vendas
- Na tabela de clientes, coluna "Vendas" com contagem e link
- Ao clicar no cliente, mostrar histórico de compras

### Vendas → Estoque
- Na venda confirmada, link para cada peça no catálogo
- Badge de estoque atual ao lado de cada item vendido

### Estoque → Vendas
- Na peça, mostrar "Vendas desta peça" com lista de vendas que incluem o material

### Pós-Venda → Cliente + Venda
- Link do ticket para o cliente e para a venda relacionada

### Prospecção → Clientes
- Já existe "Converter para Cliente", adicionar link para ver o cliente convertido

### Pesquisa de Mercado → Catálogo
- Link em cada pesquisa para abrir a peça no catálogo

## 4. Relatórios Interativos

### Nova aba "Relatórios" no Dashboard
- **Relatório de Vendas**: por período, por cliente, por peça, por status
- **Relatório de Estoque**: ABC, giro, cobertura, duplicados
- **Relatório de Competitividade**: preços vs mercado por categoria
- Todos com gráficos interativos (recharts) e exportação

## Banco de Dados

- Migration: `ALTER TABLE parts ADD COLUMN reviewed_at timestamptz DEFAULT NULL`
- Migration: criar função SQL `find_duplicate_parts()` que retorna pares de peças com descrição similar
- Atualizar `get_dashboard_stats()` para incluir dados de vendas cruzados

## Arquivos a criar/editar

- `src/pages/StockPage.tsx` — novas métricas, duplicados, estudo de mercado integrado
- `src/components/dashboard/DashboardPage.tsx` — cards integrados, aba relatórios, gráfico de vendas
- `src/components/catalog/PartDetailDialog.tsx` — botões Atualizar/Revisar/Semelhanças/Ver Vendas
- `src/components/catalog/PartCard.tsx` — botões rápidos de ação
- `src/components/catalog/CatalogContent.tsx` — coluna de ações na tabela
- `src/hooks/use-parts.ts` — queries para duplicados, peças similares, revisão
- `src/pages/CustomersPage.tsx` — coluna vendas, link para histórico
- `src/pages/SalesPage.tsx` — links para peças e clientes
- `src/pages/AfterSalesPage.tsx` — links para cliente/venda
- Migration SQL — `reviewed_at` + função de duplicados + stats atualizados

