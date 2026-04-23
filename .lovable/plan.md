

# Plano: Saúde dos Dados confiável, interativa e comercial

## Diagnóstico atual (validado contra o banco real)

| Métrica atual | Valor | Problema |
|---|---|---|
| Sem fabricante | 0 | ✅ Correto |
| Sem modelo | 0 | ✅ Correto |
| Sem categoria | 0 | ✅ Correto |
| Descrição < 10 chars | **15** | ⚠️ Limite muito baixo — perde 802 itens problemáticos |
| Grupos duplicados | **77** | ❌ **Falso positivo grave**: conta itens GENUINAMENTE diferentes (O-RING M8 vs O-RING M10) como duplicados, só por ter descrição idêntica |
| Preço zerado | 0 | ✅ Correto |
| Estoque zerado | 0 | ✅ Correto |

**Risco comercial**: o vendedor não pode confiar nesses números — pode tentar "consolidar" 6 O-rings que são tamanhos diferentes, ou ignorar 802 peças com descrição genérica ("TUBO", "PEDAL", "BOBINA") que vendem mal por falta de info.

## Solução em 3 frentes

### 1. Regras de detecção mais inteligentes (RPC `get_stock_analytics`)

**Duplicados — nova fórmula em 3 níveis de confiança:**
- 🔴 **Alta confiança** (provável duplicata real): mesma descrição + mesmo `manufacturer` + mesmo `machine_model` + materiais diferentes
- 🟡 **Média confiança**: mesma descrição normalizada (lowercase, sem espaços extras) + mesmo `manufacturer`, modelos diferentes
- 🟢 **Baixa** (apenas variantes): descrição igual mas modelos/fabricantes diferentes — **não conta como problema**

Retorna apenas alta + média no contador. Estimativa: ~10-25 grupos reais (vs 77 atuais).

**Descrição curta — 3 faixas:**
- Críticas: < 10 chars (ex.: "TUBO", "20A") — bloqueiam venda online
- Atenção: 10-19 chars sem código de norma (sem "GB/T", sem dimensão "M\d+")
- OK: ≥ 20 chars OU contém código técnico

**Novos critérios comerciais adicionados:**
- **Preço outlier por categoria** (z-score > 3 dentro da categoria) — pode indicar erro de digitação
- **Caracteres não-latinos** na descrição (chinês/japonês) — bloqueia portal público
- **Descrição idêntica ao código material** (ex.: "LW188BIELA" como descrição) — info insuficiente
- **Estoque negativo ou anômalo** (>10.000 un para peça > R$ 10k)
- **Sem `compatible_models`** preenchido (impede recomendação cruzada no /pedidos/novo)

Cada métrica retorna: `{ count, severity, sample_ids[] }` (até 50 IDs por categoria) para drill-down sem nova query.

### 2. UI interativa, drill-down e ação inline (`DataHealthTab.tsx`)

**Layout reescrito como dashboard comercial:**

```text
┌──────────────────────────────────────────────────────────┐
│  Score Global de Saúde: 87/100  🟢                       │
│  ▰▰▰▰▰▰▰▰▱▱  15.298 SKUs · 142 com problemas (0,9%)     │
└──────────────────────────────────────────────────────────┘

┌─ Críticos (bloqueiam venda) ─┬─ Atenção ─┬─ Informativos ─┐
│ Cards agrupados por severidade com filtros e ações        │
└───────────────────────────────────────────────────────────┘
```

- Cada card é **clicável** → abre `Sheet` lateral com:
  - Tabela das peças afetadas (top 50, ordenável)
  - Colunas: Material · Descrição · Fabricante · Modelo · Estoque · Valor
  - Botões inline por linha: **Editar** (abre `PartDetailDialog` reaproveitado) · **Mesclar** (para duplicados — abre wizard de merge) · **Categorizar com IA** (chama `subcategorize-parts` para o item)
  - Botão topo: **Exportar CSV** (reaproveita `export-csv.ts`) · **Resolver tudo com IA** (lote)

- **Filtros globais** no topo da aba: por fabricante, categoria, faixa de valor — recalcula contadores client-side a partir dos `sample_ids` + `parts`
- **Toggle "Mostrar apenas com estoque > 0"** — foco no que importa comercialmente
- **Toggle "Mostrar apenas valor > R$ 1.000"** — esconde ruído de baixo impacto
- **Indicador de confiabilidade** ao lado de cada métrica: tooltip explicando a regra exata (ex.: "Conta apenas duplicados com mesmo fabricante + modelo")

### 3. Mesclagem de duplicados real (nova feature inline)

Hoje só existe a função SQL `find_duplicate_parts` — sem UI de ação.

**Nova edge function `merge-duplicate-parts`:**
- Input: `{ keep_id, merge_ids[] }`
- Soma `stock` no `keep_id`, transfere `sale_items.part_id` para `keep_id`, deleta os duplicados
- Auditoria: registra em `customer_imports.report` (reutiliza tabela existente como log)

**UI:** dialog com radio "qual peça manter" + preview do resultado (estoque consolidado, preço médio ponderado) + confirmação dupla.

## Arquivos afetados

| Arquivo | Ação |
|---|---|
| Migration SQL | Reescrever `get_stock_analytics()` com novas regras de `dataHealth` (3 níveis de duplicados, 3 faixas de descrição, outliers, caracteres não-latinos, sem compatible_models) + retornar `sample_ids` por métrica |
| `src/hooks/use-stock-analytics.ts` | Atualizar TS interface `dataHealth` (estrutura `{ count, severity, samples }`) + novo helper `computeHealthScore()` |
| `src/components/stock/DataHealthTab.tsx` | **Reescrever** — score global, cards agrupados por severidade, filtros, drill-down via `Sheet`, ações inline |
| `src/components/stock/DataHealthDrillDown.tsx` | **Novo** — Sheet com tabela das peças afetadas + ações inline |
| `src/components/stock/MergeDuplicatesDialog.tsx` | **Novo** — wizard de mesclagem com preview |
| `supabase/functions/merge-duplicate-parts/index.ts` | **Novo** — consolida estoque, transfere `sale_items`, deleta duplicatas |
| `src/components/catalog/PartDetailDialog.tsx` | Reaproveitar para edição inline (já existe) |

## Detalhes técnicos

- **Performance**: `sample_ids` são limitados a 50 por métrica → JSON cresce ~3kB. Cache 60s mantido.
- **Confiabilidade**: cada regra documentada via tooltip + descrita no card. Tooltip aparece em hover/tap (mobile-friendly).
- **Responsividade comercial**: layout `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`, cards com altura mínima fixa, números tabulares grandes (text-2xl), ícone de severidade colorido. Mobile (≤640px): cards empilhados, drill-down em `Sheet` full-screen.
- **Idempotência da merge**: transação no edge function; se `sale_items` falhar, rollback completo.
- **Segurança**: edge function valida JWT + Zod schema (`keep_id: uuid`, `merge_ids: uuid[].min(1).max(20)`).
- **Score global**: `100 - (criticos × 0.5 + atencao × 0.2 + informativos × 0.05) / total × 100`, clamp 0-100.
- **Acessibilidade**: cores com contraste AA, ícones acompanham texto, foco navegável via teclado.

## Resultado esperado

- **Zero falsos positivos** em duplicados (de 77 ruidosos para ~10-25 reais e acionáveis)
- Vendedor vê **Score 0-100** instantâneo da saúde + lista priorizada do que resolver
- **1 clique** abre a lista exata de peças afetadas; **2 cliques** edita/mescla/categoriza com IA
- Tooltips explicam **exatamente** o que cada regra mede — nada de "número mágico"
- Filtros comerciais (estoque > 0, valor > R$ 1k) eliminam ruído e focam no que gera receita
- Mesclagem de duplicados consolida estoque com auditoria — fim do retrabalho manual
- Layout responsivo de mobile a desktop, pronto para uso em campo

