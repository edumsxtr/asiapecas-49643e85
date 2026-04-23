

# Plano: Análise de Estoque Aprofundada — Catálogo Inteligente Interativo

## O que descobri analisando os dados reais

| Métrica | Valor |
|---|---|
| SKUs únicos | **15.298** (consolidados de 20.436 linhas) |
| Unidades em estoque | **460.583** |
| Valor total | **R$ 193,7 M** |
| Categorias mapeadas | **11** (zero não classificadas ✅) |
| SKUs nunca vendidos | **15.291 (99,95%)** ⚠️ |
| SKUs com vendas | apenas 7 |
| Estoque parado >2 anos | concentrado em "Acessórios" (R$ 16,2M) e "Transmissão" (R$ 3M) |
| Categoria mais valiosa | **Acessórios e Outros — R$ 85,7M (44%)** |
| Categoria com melhor preço médio | **Motor e Componentes — R$ 12k/peça** |
| Categoria com mais unidades | **Filtros — 71.873 un.** |

**Insight crítico**: 44% do valor está numa categoria genérica "Acessórios e Outros" — precisa ser **subdividida com IA** para análise útil.

## Solução: Página `/analise-estoque` aprofundada e interativa

Substitui a `StockPage` atual (que é rasa) por uma análise multi-dimensional com 6 abas e **insights acionáveis automáticos**.

### Aba 1 — Visão Executiva (resposta direta: "o que temos?")

**Header com 4 KPIs grandes contando a história**:
- Capital total imobilizado + % saudável vs parado
- SKUs ativos vs nunca vendidos (alerta vermelho: 99,95%)
- Categoria líder em valor com % do total
- "Itens que valem a pena" vs "itens que não valem" (score automático)

**Card "Diagnóstico Automático"** — texto gerado a partir das métricas:
> "Seu estoque tem R$ 193M em 15.298 SKUs. **R$ 85,7M (44%) está em 'Acessórios e Outros'** — recomendamos reclassificar com IA. Apenas 7 SKUs tiveram venda, indicando que o pipeline comercial está subutilizado vs o tamanho do catálogo. **R$ 28M parados há +2 anos** = candidatos prioritários para promoção/leilão."

**Treemap interativo** (recharts `Treemap`): cada retângulo = categoria, tamanho = valor, cor = % parado. Click → drill-down para a aba 2 já filtrada.

### Aba 2 — Análise por Categoria (drill-down interativo)

Tabela rica com 11 categorias + métricas por categoria:
- SKUs / Unidades / Valor / Preço médio / % do total
- **Health score** (0-100): combina giro, % parado, idade média, concentração
- **Veredito IA**: "🟢 Vale a pena" / "🟡 Otimizar" / "🔴 Liquidar"
  - Critérios: valor parado >40% = vermelho; preço médio alto + zero vendas = amarelo; baixo valor parado = verde
- Click numa categoria abre painel lateral com:
  - Gráfico de pizza dos modelos de máquina dentro dela
  - Top 10 peças por valor de estoque
  - Distribuição de tempo (6m / 1-2a / +2a) — mini stacked bar
  - Sugestão de ação: "Promover N peças paradas há +2 anos = recupera R$ X"

### Aba 3 — Matriz BCG do Estoque (o que vale a pena?)

Quadrante interativo 2x2 (`recharts ScatterChart`):
- Eixo X: **giro** (vendas / estoque)
- Eixo Y: **valor unitário**
- Cada bolha = SKU, tamanho = unidades em estoque

Quadrantes:
- **🌟 Estrelas** (alto valor + alto giro) → manter, repor
- **🐄 Vacas leiteiras** (baixo valor + alto giro) → fluxo de caixa
- **❓ Pontos de interrogação** (alto valor + baixo giro) → revisar
- **🐕 Abacaxis** (baixo valor + baixo giro) → liquidar

Filtros: por categoria, fabricante, modelo. Click numa bolha → detalhe da peça.

### Aba 4 — Subcategorização IA dos "Acessórios e Outros"

Botão **"Reclassificar com IA"** dispara edge function `subcategorize-parts` que:
- Pega lote de 100 SKUs em `Acessórios e Outros`
- Chama Lovable AI Gateway (`google/gemini-2.5-flash`) com tool calling
- Retorna nova subcategoria + confiança
- Atualiza `parts.part_category` (com confirmação visual)

Mostra preview lado-a-lado: descrição → categoria atual → categoria sugerida → confiança. Aprovação em massa ou item-a-item.

### Aba 5 — Inteligência de Tempo & Risco

- **Gráfico empilhado** valor por categoria × período (6m/1-2a/+2a)
- **Heatmap** fabricante × categoria mostrando valor parado
- **Top 50 peças "âncoras de capital"**: alto valor × +2 anos, com cálculo de "custo de oportunidade" (8% ao ano)
- Botão **"Exportar lista para promoção"** → CSV pronto para campanha

### Aba 6 — Saúde de Dados (qualidade do catálogo)

Dashboard de problemas detectados:
- **Duplicados** (descrição igual, código diferente) — usa `find_duplicate_parts` existente
- **SKUs sem fabricante / modelo / categoria**
- **SKUs com preço suspeito** (outliers via desvio-padrão por categoria)
- **SKUs com descrição muito curta** (<10 chars) ou contendo caracteres não-latinos
- Cada item com botão de ação inline (mesclar / editar / categorizar)

## Arquivos afetados

| Arquivo | Ação |
|---|---|
| `src/pages/StockPage.tsx` | **Reescrever** como hub com 6 abas |
| `src/components/stock/ExecutiveOverview.tsx` | **Novo** — KPIs + diagnóstico automático + treemap |
| `src/components/stock/CategoryDeepDive.tsx` | **Novo** — tabela com health score + drill-down lateral |
| `src/components/stock/StockBCGMatrix.tsx` | **Novo** — scatter quadrantes |
| `src/components/stock/SubcategorizeAITab.tsx` | **Novo** — preview e aprovação de reclassificação IA |
| `src/components/stock/TimeRiskAnalysis.tsx` | **Novo** — heatmap + capital parado por idade |
| `src/components/stock/DataHealthTab.tsx` | **Novo** — qualidade do catálogo |
| `src/hooks/use-stock-analytics.ts` | **Novo** — queries agregadas (health score, BCG data, subcategoria stats) |
| `supabase/migrations/...` | Função SQL `get_stock_analytics()` retornando JSON completo (categoria × tempo × fabricante × giro), evita N queries no client |
| `supabase/functions/subcategorize-parts/index.ts` | **Novo** — IA reclassifica em lote com tool calling |
| `src/components/AppSidebar.tsx` | Renomear "Análise de Estoque" → mantém rota `/estoque` |

## Detalhes técnicos

- **Performance**: 1 RPC `get_stock_analytics()` retorna tudo agregado (≈15kB JSON) em <500ms vs 6 queries separadas. Cache `staleTime: 60s` no react-query.
- **Health Score**: fórmula `100 - (stale_value_pct * 0.5) - (no_sales_pct * 0.3) - (concentration_penalty * 0.2)`, normalizado 0-100.
- **BCG**: cálculo de giro precisa de janela 12m via `sale_items JOIN sales WHERE sale_date > now() - interval '12 months'`. Como há só 7 SKUs vendidos, mostra mensagem educativa "Estoque com baixíssimo giro histórico — matriz indicativa".
- **IA reclassificação**: tool calling com schema fixo `{ subcategory: enum, confidence: 0-1, reasoning: string }`; processa 100/lote; rate-limit 429/402 com retry exponencial.
- **Drill-down lateral**: usa `Sheet` do shadcn já no projeto, evita modal pesado.
- **Treemap & Scatter**: recharts já está instalado; nada novo.
- **Exportação**: reaproveita `src/lib/export-csv.ts`.

## Resultado esperado

- Resposta **imediata e visual** a "o que temos?": treemap + diagnóstico automático
- Decisão clara **"vale a pena ou não"** por categoria via Health Score + Matriz BCG
- **R$ 85,7M em "Acessórios"** finalmente subdividido com IA e analisável
- Identificação de **R$ 28M+ em capital parado** com plano de ação por peça
- Saúde de dados visível e corrigível em 1 tela
- Exportações prontas para campanhas comerciais e leilões

