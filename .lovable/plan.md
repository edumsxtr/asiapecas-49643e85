

# Plano: classificação 100% determinística por código + busca inteligente sem IA

Mudança de filosofia: **a IA sai do caminho crítico**. Tudo que pode ser resolvido por código, regex, índices e dicionário fica em SQL/JS puro — instantâneo, determinístico, sem rate limit, sem custo, sem colapsar em lote. IA vira ferramenta opcional só para os ~2% de resíduo.

## Parte 1 — Pipeline determinístico em 5 estágios (zero IA)

Roda 100% em SQL, processa 13k SKUs em segundos, idempotente.

```text
parts não classificadas
   │
   ▼
[1] Dicionário canônico (regex versionado por subcategoria)
   │   resolve ~70% — termos óbvios em PT/EN/ES
   ▼
[2] Trigram fuzzy (pg_trgm) contra sinônimos
   │   resolve ~15% — erros de digitação, abreviações
   ▼
[3] Herança por part_category + machine_model + manufacturer
   │   resolve ~10% — peças genéricas com contexto forte
   ▼
[4] Cluster por código de material (prefixo SAP/OEM)
   │   resolve ~3% — códigos da mesma família compartilham subcategoria
   ▼
[5] Resíduo marcado needs_review (fila manual ou IA opcional)
       ~2% restante
```

### 1.1 Taxonomia editável em tabela (não mais hardcoded)

Nova tabela `subcategory_taxonomy`:
- `subcategory` (Pneus, Filtros, Rolamentos…)
- `category_group` (Rodante, Hidráulico, Motor, Elétrico…)
- `synonyms_pt[]`, `synonyms_en[]`, `synonyms_es[]`
- `negative_terms[]` (palavras que excluem o match — ex.: para "Pneus", excluir "câmara", "protetor")
- `attribute_extractors jsonb` — regex nomeados por atributo:
  ```json
  { "medida_radial":  "\\m(\\d{2}\\.?\\d?)\\s?[rR]\\s?(\\d{2})\\M",
    "medida_diagonal":"\\m(\\d{1,2}\\.\\d{1,2})\\s?-\\s?(\\d{2})\\M",
    "tipo":           "(?i)(radial|diagonal|otr)" }
  ```
- `priority` (ordem de tentativa, mais específico primeiro)
- `min_score` (limiar para fuzzy match)

Edição via UI no AdminVitrine → aba **Taxonomia**. Sem SQL.

### 1.2 Função `classify_parts_v4(_only_missing bool)`

Substitui `apply_subcategory_rules`. Lê da taxonomia, monta SQL dinâmico. Para cada estágio popula `subcategory`, `subcategory_source` (`dict`/`fuzzy`/`inherit`/`code_cluster`/`review`), `subcategory_confidence`, e atributos extraídos em `attributes` JSONB.

Cálculo de atributos por subcategoria (genérico, dirigido pela taxonomia):
| Subcategoria | Atributos |
|---|---|
| Pneus | medida (canônica `26.5R25`), aro, tipo |
| Filtros | fluido, código_oem |
| Rolamentos | código_série, tipo |
| Mangueiras | diâmetro, comprimento, pressão |
| Cilindros Hidráulicos | diâmetro_haste, curso, posição |
| Bombas | tipo, vazão |
| Vedações | tipo, medida |
| Correias | código, comprimento |
| Iluminação | tipo, posição, tensão |
| Baterias | tensão, Ah |
| Material Rodante | tipo, passo |
| Engrenagens | dentes |
| Sensores | grandeza, faixa |
| Válvulas | tipo, pressão |
| (demais 12) | conforme schema |

### 1.3 Cluster por código (estágio 4) — sem IA

Muitos SKUs herdam classificação do prefixo do código (`material`):
```sql
-- exemplo: peças com mesmo prefixo de 6 caracteres tendem à mesma subcategoria
WITH clusters AS (
  SELECT substring(material, 1, 6) prefix,
         mode() WITHIN GROUP (ORDER BY subcategory) dom_sub,
         count(*) FILTER (WHERE subcategory IS NOT NULL) classified,
         count(*) total
  FROM parts WHERE length(material) >= 6
  GROUP BY 1
  HAVING count(*) FILTER (WHERE subcategory IS NOT NULL) >= 3
     AND count(*) FILTER (WHERE subcategory IS NOT NULL)::float / count(*) >= 0.7
)
UPDATE parts p
SET subcategory = c.dom_sub, subcategory_source = 'code_cluster',
    subcategory_confidence = 0.75
FROM clusters c
WHERE substring(p.material,1,6) = c.prefix AND p.subcategory IS NULL;
```

Resultado: peças sem descrição usável herdam de "irmãs" do mesmo prefixo.

### 1.4 Limpeza dos atributos atuais corrompidos

Migração de saneamento roda **antes** do v4:
- Drop de `attributes->>'medida'` em todos os pneus (a regex antiga gerou `00R25`, `9744-19` etc.).
- Drop de atributos de subcategorias incorretas (cross-pollination).
- Re-extração com regex novos.

## Parte 2 — Busca inteligente sem IA (instantânea)

Hoje a busca é `ILIKE %x%` em description+material. Lenta acima de 5k SKUs e tola: digitar "rolam 6205" não acha.

### 2.1 Índices full-text + trigram

Migração:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

ALTER TABLE parts ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', unaccent(coalesce(material,''))), 'A') ||
    setweight(to_tsvector('portuguese', unaccent(coalesce(description,''))), 'B') ||
    setweight(to_tsvector('portuguese', unaccent(coalesce(manufacturer,''))), 'C') ||
    setweight(to_tsvector('portuguese', unaccent(coalesce(machine_model,''))), 'C') ||
    setweight(to_tsvector('portuguese', unaccent(coalesce(subcategory,''))), 'B')
  ) STORED;

CREATE INDEX idx_parts_search ON parts USING GIN (search_vector);
CREATE INDEX idx_parts_trgm_desc ON parts USING GIN (description gin_trgm_ops);
CREATE INDEX idx_parts_trgm_material ON parts USING GIN (material gin_trgm_ops);
CREATE INDEX idx_parts_attributes ON parts USING GIN (attributes);
CREATE INDEX idx_parts_subcategory ON parts (subcategory);
```

### 2.2 RPC `search_parts(q text, filters jsonb, limit, offset)`

Combina 3 sinais:
1. **Match exato no `material`** (peso 100, top da lista).
2. **`websearch_to_tsquery`** sobre `search_vector` (peso por rank).
3. **Trigram similarity** ≥ 0.3 (fallback para typos).

Boost adicional por chips ativos (subcategoria, modelo, fabricante, atributo). Devolve resultados ordenados em <50ms para 13k SKUs.

### 2.3 Barra de busca inteligente (frontend)

Componente novo `SmartSearchBar`:
- **Tokenização visual**: ao digitar `"6205 rolamento sk"` aparecem 3 chips clicáveis (`código:6205`, `texto:rolamento`, `fabricante:SKF*` sugerido).
- **Sugestões instantâneas** (debounced 150ms) via `search_parts` com `limit 8`: subcategoria, modelo, fabricante e top peças.
- **Operadores**: `medida:26.5R25`, `cat:Pneus`, `mod:CAT`, `fab:Bridgestone`, `parado:>2a`.
- **Histórico local** (últimas 10 buscas) + **buscas salvas** (`catalog_report_templates` já existe).
- **Atalho `/`** foca a barra de qualquer tela.

## Parte 3 — Centralização: 4 telas → 1 hub "Inteligência"

### 3.1 Sidebar nova
```text
ANTES                       DEPOIS
─────────────────           ─────────────────
Catálogo                    Catálogo (operacional)
Categorias        ←┐        Inteligência ← novo
Estoque           ←┤        Clientes
Relatório         ←┤        ...
                  ←┘
```

### 3.2 Layout `/inteligencia`

```text
┌─ Header: SmartSearchBar + KPIs (sticky) ────────────────────────┐
│ [/ buscar]   SKUs · R$ · % Parado · % Classif · 🟢🟡🔴 Saúde   │
└─────────────────────────────────────────────────────────────────┘
┌─ Filtros únicos (chips) ────────────────────────────────────────┐
│ Subcat ▾ Modelo ▾ Fabricante ▾ Atributo ▾ [parado +2a] [zerados]│
└─────────────────────────────────────────────────────────────────┘
┌─ Tabs (mesmo dataset filtrado) ─────────────────────────────────┐
│ [Galeria] [Tabela] [Modelo×Sub] [BCG] [Saúde] [Apresentação]    │
│ [↓ XLSX] [↓ PDF]                                                │
└─────────────────────────────────────────────────────────────────┘
```

- **Galeria**: cards de subcategoria com chips clicáveis dos atributos (medida, fluido, tipo…) com contagem real.
- **Drilldown único** (drawer): SKUs + máquinas compatíveis (agregado de `compatible_models` + JOIN `customer_equipment`).
- **Apresentação executiva**: aba (não mais rota separada) que renderiza os slides do `export-pdf-report.ts` a partir do dataset filtrado atual. Fim das discrepâncias entre telas.
- **Saúde**: 🟢 classificado · 🟡 atributos · 🔴 críticos. Click abre drawer com ações (refinar fila determinística, mesclar duplicatas, editar em massa).

### 3.3 RPC unificada `get_intelligence_view(filters jsonb)`

Uma chamada → KPIs + galeria + tabela + matriz + BCG + saúde. Substitui `get_stock_analytics` + `get_catalog_intelligence` + parte de `get_dashboard_stats`.

## Parte 4 — IA reposicionada (opcional, fora do caminho crítico)

- Função `subcategorize-parts` continua existindo, mas só roda sob demanda na fila `needs_review` (estágio 5), batches pequenos de 50, com retomada.
- Aprovação humana alimenta `taxonomy_feedback` → sinônimos novos vão para `subcategory_taxonomy` automaticamente. Próximo run determinístico já cobre.
- Sem IA = sem rate limit, sem colapso, sem custo recorrente. IA = só ferramenta de melhoria contínua.

## Parte 5 — Arquivos afetados

**Migrações**
- `<ts>_taxonomy_master.sql` — tabela `subcategory_taxonomy` + seed das 25+ subcategorias com sinônimos PT/EN/ES e regex de atributos
- `<ts>_search_indexes.sql` — `pg_trgm`, `unaccent`, `search_vector` gerada, índices GIN
- `<ts>_classify_v4.sql` — pipeline 5 estágios determinístico
- `<ts>_search_parts_rpc.sql` — RPC com FTS + trigram + boost por chips
- `<ts>_get_intelligence_view.sql` — RPC unificada
- `<ts>_taxonomy_feedback.sql` — tabela para sinônimos aprovados
- `<ts>_cleanup_bad_attributes.sql` — limpa atributos corrompidos antes do v4

**Backend**
- `subcategorize-parts/index.ts` — só fila `needs_review`, batches 50, opcional

**Frontend novos**
- `src/pages/IntelligencePage.tsx` — hub
- `src/components/intelligence/SmartSearchBar.tsx` — barra com tokens, operadores, sugestões, atalho `/`
- `src/components/intelligence/HealthSemaphore.tsx`
- `src/components/intelligence/SubcategoryGallery.tsx`
- `src/components/intelligence/AttributeChips.tsx`
- `src/components/intelligence/UnifiedFilters.tsx`
- `src/components/intelligence/DrilldownDrawer.tsx`
- `src/components/intelligence/ExecutivePresentation.tsx`
- `src/components/intelligence/ReviewQueue.tsx`
- `src/components/admin/TaxonomyEditor.tsx`
- `src/hooks/use-intelligence.ts`, `src/hooks/use-smart-search.ts`

**Frontend editados**
- `src/App.tsx` — rota `/inteligencia`; redirects de `/categorias`, `/estoque`, `/relatorio`
- `src/components/AppSidebar.tsx` — colapsa 4 itens
- `src/pages/CatalogPage.tsx` — usa `SmartSearchBar`, remove aba Relatórios
- `src/pages/AdminVitrinePage.tsx` — aba Taxonomia

**Removidos / consolidados**
- `src/pages/StockPage.tsx`, `src/pages/CategoriesPage.tsx`, `src/pages/ReportPage.tsx`
- `src/components/catalog/reports/ReportsTab.tsx`

## Critérios de aceitação

1. **Cobertura ≥ 95%** classificada via pipeline determinístico (sem chamada de IA).
2. **Pneus** somente formatos canônicos (`26.5R25`, `17.5-25`, `14.00R24`); zero `00R25` ou `9744-19`.
3. **Busca por "6205 rolam"** retorna rolamentos 6205 em <50ms.
4. **Busca por "pneu 26.5"** retorna apenas pneus dessa medida, ranqueados por estoque.
5. **3 cliques** para "quantos `<atributo>` de `<subcategoria>` tenho, em quais máquinas, qual valor".
6. **PDF executivo** gerado do mesmo dataset do hub (mesmos números).
7. **Operador `cat:Pneus medida:26.5R25 parado:>2a`** funciona como query única.

