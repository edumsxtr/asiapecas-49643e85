

# Plano: Inteligência de Catálogo — análise avançada + relatórios exportáveis

Nova área dentro do Catálogo (`/catalog`) que transforma os dados brutos de estoque em respostas de gestão: "quantos pneus tenho?", "quais faróis e em que máquinas servem?", "qual o valor total parado em filtros?". Tudo navegável, agrupável e exportável (CSV/XLSX/PDF) dentro da própria plataforma.

## 1. Onde fica

Nova aba **"Relatórios"** dentro do `CatalogPage` (ao lado das abas existentes). Estrutura interna em sub-abas:

1. **Visão por subcategoria** (pneus, faróis, filtros, mangueiras, rolamentos…)
2. **Cruzamento Subcategoria × Máquina** (matriz)
3. **Construtor de relatório** (filtros livres + agrupamento)
4. **Relatórios salvos** (templates do gestor)
5. **Exportações** (histórico de planilhas geradas)

## 2. Subcategorização inteligente — base de tudo

Hoje as peças têm `part_category` (5 categorias macro: Mineração, Linha Amarela, etc.) mas **não** uma subcategoria funcional ("pneu", "farol", "filtro"). Sem isso, não dá para responder "quantos pneus tenho".

**Solução em 2 camadas, ambas funcionando juntas**:

### a) Detecção por regras (instantânea, sem IA, cobre ~70%)
Dicionário PT/EN/ES de keywords → subcategoria, aplicado em `description` + `material`. Exemplos:
- `pneu|tire|tyre|llanta|neumatico` → **Pneu**
- `farol|headlight|faro|lamp` → **Farol/Iluminação**
- `filtro|filter|filtro de óleo|filtro ar` → **Filtro** (+ subtipo: óleo/ar/combustível/hidráulico)
- `mangueira|hose|manguera` → **Mangueira**
- `rolamento|bearing|cojinete` → **Rolamento**
- `cilindro hidráulico|hydraulic cylinder` → **Cilindro hidráulico**
- `bomba|pump|bomba hidráulica` → **Bomba**
- `correia|belt|correa` → **Correia**
- `vedação|seal|reten|o-ring|junta` → **Vedação**
- `parafuso|bolt|tornillo|porca|nut|arruela|washer` → **Fixadores**
- `lâmina|blade|cuchilla|dente|tooth|caçamba` → **Implemento de solo**
- `bateria|battery` → **Bateria**
- ~30 categorias funcionais cobrindo o catálogo XCMG

Cada regra também tenta extrair **atributos** quando aplicável (regex simples):
- Pneu → medida (ex.: `26.5R25`, `17.5-25`), padrão de banda (E3/E4/L5)
- Farol → tipo (LED/halógeno), posição (dianteiro/traseiro/trabalho)
- Filtro → fluido (óleo/ar/combustível/hidráulico)
- Mangueira → diâmetro, comprimento
- Rolamento → código padrão (ex.: `6205`, `30210`)

### b) Refinamento com IA (cobre os 30% restantes)
Botão **"Subcategorizar com IA"** (admin) chama uma edge function `subcategorize-parts` que:
- Pega peças sem subcategoria detectada (ou com confiança baixa)
- Manda em lote ao Lovable AI (Gemini Flash, barato e rápido) com a lista de subcategorias permitidas
- Retorna subcategoria + atributos JSON
- Salva em `parts.subcategory` + `parts.attributes` (jsonb)
- Mostra progresso ("234/500 processadas") e relatório ao final

### Migração de banco
- `parts.subcategory text` (índice GIN trgm para busca)
- `parts.attributes jsonb` (medidas, tipo, especificações extraídas)
- `parts.subcategory_source text` (`rule` | `ai` | `manual`)
- `parts.subcategory_confidence numeric` (0–1)
- Função SQL `apply_subcategory_rules()` — roda o dicionário em massa, idempotente
- Função `get_catalog_intelligence()` — agrega tudo para os relatórios (evita chamar 10 queries do front)

## 3. Visão por subcategoria (painel principal)

Tela com cards expansíveis, um por subcategoria detectada:

```text
┌─ PNEUS ───────────────────────────── [Exportar XLSX] ──┐
│ 47 SKUs · 312 unidades · R$ 1.847.500 em estoque       │
│ ▸ Por medida: 26.5R25 (12 SKUs · R$ 680k) · 17.5-25 …  │
│ ▸ Compatível com: XE700 (8) · ZL50GN (6) · GR2153 (4)  │
│ ▸ 18 unidades paradas há +2 anos (R$ 412k)             │
│ [Ver lista completa] [Cruzar com máquinas]             │
└────────────────────────────────────────────────────────┘
```

Cada card responde de cara: **quantos**, **valor**, **subdivisão por atributo principal**, **em que máquinas servem**, **alerta de capital parado**. Ordenável por valor, por SKUs ou por % parado.

## 4. Matriz Subcategoria × Máquina

Tabela pivot (heatmap visual) cruzando subcategoria nas linhas × `machine_model` (+ `compatible_models`) nas colunas. Cada célula mostra:
- Quantidade de SKUs
- Valor total
- Cor: vermelho = só estoque parado, verde = saudável

Permite responder visualmente "quais peças de XE215 eu tenho em quais categorias" e "qual modelo concentra meu estoque parado". Click em célula → drill-down para a lista de peças.

## 5. Construtor de relatório (drag & drop simples)

Formulário onde o gestor monta a query sem SQL:

| Campo | Opções |
|---|---|
| **Agrupar por** | subcategoria, fabricante, modelo, categoria macro, `last_entry_time`, atributo (medida, tipo de filtro…) |
| **Filtrar** | subcategoria contém, fabricante = , modelo = , estoque > , preço entre, parado há +N anos, tem promoção, vendido nos últimos 12m |
| **Métricas** | SKUs, unidades, valor total, ticket médio, % do total, valor parado, dias de estoque |
| **Visualização** | Tabela · Barras · Pizza · Linha temporal |

Ao gerar, mostra a tabela + gráfico com botões **Exportar XLSX**, **Exportar CSV**, **Gerar PDF**, **Salvar template**.

Exemplos prontos (1 clique):
- "Pneus por medida e modelo de máquina"
- "Faróis por tipo e fabricante"
- "Filtros parados há +2 anos por tipo"
- "Top 20 peças que mais consomem capital"
- "Cobertura por modelo XCMG (quantas peças críticas tenho de cada)"

## 6. Exportações reais (XLSX/CSV/PDF)

Já existe `xlsx` no projeto (usado em `ExportCatalogButton`) e `jspdf` (proposals). Reaproveita:

- **XLSX rico**: várias abas — "Resumo", "Detalhe por SKU", "Por subcategoria", "Por modelo", "Parados +2 anos". Formatação de moeda BR, autosize, freeze panes, totais com fórmulas reais (não valores hardcoded).
- **CSV** via utilitário `src/lib/export-csv.ts` já existente (separador `;`, BOM UTF-8, Excel BR-friendly).
- **PDF executivo** (1 clique, "Relatório para diretoria"): capa com logo Ásia, KPIs principais, top 10 subcategorias, top 10 máquinas com mais estoque, alertas de capital parado, gráficos renderizados via canvas → embed no jsPDF.

Cada exportação grava 1 linha em `catalog_reports_log` (quem, quando, qual filtro, link do arquivo se PDF salvo no Storage) — auditoria.

## 7. Templates salvos

Tabela `catalog_report_templates`:
- `name`, `description`, `config jsonb` (filtros + grouping + métricas + visualização), `created_by`, `created_at`, `is_shared bool`

Gestor salva "Relatório semanal de pneus" e roda com 1 clique toda segunda. Templates compartilhados aparecem para todos os autenticados.

## 8. Performance

Catálogo tem milhares de SKUs. Estratégia:
- **Tudo agregado no Postgres** via função `get_catalog_intelligence(filters jsonb)` que retorna JSON pronto. Front só renderiza.
- React Query com `staleTime` de 60s.
- Detalhe (lista de SKUs por célula da matriz) carrega sob demanda, paginado.
- Subcategorização por regras roda **uma vez** via SQL function (segundos), depois fica persistida — não recalcula a cada acesso.

## 9. Arquivos afetados

**Novos**
- Migração SQL: colunas `subcategory`/`attributes`/`subcategory_source`/`subcategory_confidence` em `parts`; função `apply_subcategory_rules()`; função `get_catalog_intelligence(filters jsonb)`; tabelas `catalog_report_templates` e `catalog_reports_log` com RLS authenticated
- `supabase/functions/subcategorize-parts/index.ts` — IA em lote para o que regra não pegou
- `src/lib/subcategory-rules.ts` — dicionário PT/EN/ES + regex de atributos (também usado pelo front para destacar termos)
- `src/lib/export-xlsx.ts` — helper de XLSX multi-aba com formatação
- `src/lib/export-pdf-report.ts` — relatório executivo em PDF
- `src/hooks/use-catalog-intelligence.ts` — chama a função SQL, gerencia filtros
- `src/components/catalog/reports/ReportsTab.tsx` — container das sub-abas
- `src/components/catalog/reports/SubcategoryOverview.tsx` — cards expansíveis
- `src/components/catalog/reports/SubcategoryMachineMatrix.tsx` — heatmap pivot
- `src/components/catalog/reports/ReportBuilder.tsx` — construtor com filtros + grouping + viz
- `src/components/catalog/reports/SavedTemplates.tsx`
- `src/components/catalog/reports/ExportsHistory.tsx`
- `src/components/catalog/reports/SubcategorizeAIButton.tsx`

**Editados**
- `src/pages/CatalogPage.tsx` — nova aba "Relatórios"
- `src/components/catalog/CatalogContent.tsx` — pequeno ajuste para expor filtros à nova aba
- `src/integrations/supabase/types.ts` — auto-gerado após migração

## Resultado

- "Quantos pneus eu tenho?" → resposta em 1 clique, com valor, medidas e máquinas compatíveis
- Diretoria recebe PDF executivo profissional gerado dentro da plataforma
- Gestor monta qualquer relatório (subcategoria × modelo × tempo de parada × fabricante) sem pedir nada para o time técnico
- Subcategorização persistida no banco — performa rápido mesmo com 10k+ SKUs
- IA só roda no que regras não cobriram (custo baixo, ~$0,01 por 100 peças)
- Toda exportação fica auditada e templates podem ser reaproveitados

