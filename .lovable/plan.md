

# Plano: catálogo com cara de e-commerce + relatórios unificados + classificação completa

Três frentes ligadas, todas resolvendo o mesmo objetivo: a loja precisa parecer uma loja e a classificação precisa cobrir 100% do catálogo para que filtros, agrupamentos e relatórios façam sentido.

## 1. Classificar os 7.763 SKUs faltantes (R$ 100 M sem subcategoria)

Hoje 50 % do catálogo está sem subcategoria — por isso "vários pneus não estão agrupados" e o e-commerce não consegue mostrar coleções coerentes.

**Ações** (migração SQL + função reescrita):

- **Reforçar `apply_subcategory_rules()`**: ampliar dicionário PT/EN/ES com termos que faltaram (ex.: `cabo`, `solenoide`, `injetor`, `turbocompressor`, `volante`, `radiador`, `silencioso`, `coletor`, `polia`, `pino`, `bucha`, `mancal`, `acoplamento`, `flange`, `niple`, `conexão`, `terminal`, `chave`, `relé`, `fusível`, `lâmpada`, `motor de partida`, `alternador`, `bobina`, `vela`, `ventoinha`, `tanque`, `reservatório`, `bocal`, `tampa`, `placa`, `suporte`, `braço`, `barra`, `pedal`, `alavanca`, etc.). Cada subcategoria vira "âncora" de listagem.
- **Atributos extraídos com regex mais rígida**: hoje "744-199" virou "medida de pneu" porque a regex aceita qualquer `\d-\d`. Trocar por padrões reais: `\d{2,3}\.?\d?R\d{2}` (radial), `\d{2,3}\.?\d?-\d{2}` (diagonal), `\d{2,3}/\d{2,3}R\d{2}` (carro). Aplicar mesma rigidez para rolamentos (`6\d{3}|3\d{4}`), filtros (tipo: óleo/ar/combustível/hidráulico/cabine), faróis (LED/halógeno/xenon, dianteiro/traseiro/trabalho).
- **`subcategory_confidence`** preenchido pela regra: 1.0 quando keyword forte (pneu, filtro), 0.7 quando ambígua. UI passa a usar esse campo.
- **Re-rodar a função** sobre todo o estoque numa migração idempotente. Resultado esperado: cobertura sobe para >90 %.
- **Botão "Refinar com IA" expande para 500 itens por execução** (hoje é 100), com progresso real ("324/500"). IA cobre o resíduo.
- **Edição manual**: na tela admin do catálogo, dropdown de subcategoria editável por linha (já temos `subcategory_source = 'manual'`).

## 2. Catálogo público com cara de e-commerce de verdade

Inspiração: o banner XCMG enviado (categorias visuais, paleta amarelo/preto, bloco "peças que você encontra aqui", logos de compatibilidade, faixa de garantias).

### a) Hero alinhado ao banner

`QuoteHero` ganha **bloco "Peças que você encontra aqui"** (ícone + nome + contagem real) baseado nas subcategorias top do estoque — exatamente o padrão do banner ("Caixa de transmissão", "Motor hidráulico", "Filtros", "Pneus 14.00R25", "Rolamentos"). Cada tile leva direto para a listagem filtrada por aquela subcategoria.

Selo **"Peças originais XCMG"** + **strip de logos** dos fabricantes compatíveis (Carraro, Fleetguard, ZF, Cummins) puxados de `parts.manufacturer`.

### b) Catálogo agrupado por subcategoria (modo padrão)

Hoje o catálogo é uma grade sem agrupamento. Novo modo **"Por categoria"** (default) que renderiza:

```text
┌──── PNEUS · 47 SKUs · 312 unidades ──────  [Ver todos →] ──┐
│   [chips de medida: 26.5R25 (12) · 17.5-25 (8) · 14.00R25 (5)]│
│   ┌────┐ ┌────┐ ┌────┐ ┌────┐                                 │
│   │card│ │card│ │card│ │card│  ← top 4 da subcategoria       │
│   └────┘ └────┘ └────┘ └────┘                                 │
└────────────────────────────────────────────────────────────┘

┌──── FILTROS · 646 SKUs · 57k unidades ── [Ver todos →] ──┐
│   [chips: óleo (310) · ar (180) · combustível (95) · hidráulico (61)] │
│   ┌────┐ ┌────┐ ┌────┐ ┌────┐                                 │
│   ...
```

- O usuário continua tendo botão "Lista" e "Grade" como hoje.
- Quando aplica filtro/busca, vai automaticamente para grade plana (modo atual).
- Click em chip de atributo (medida/tipo) → aplica filtro adicional `attributes->>'medida' = '26.5R25'`.

### c) Card de produto refinado (já existe — pequenos ajustes)

- Adicionar **chip de atributo principal** (ex.: medida do pneu, tipo de filtro) abaixo da descrição quando existir em `attributes`.
- Logo do fabricante quando for marca conhecida (Fleetguard/ZF/Carraro/Cummins).

### d) Faixa "Por que comprar" (rodapé do hero)

Réplica da faixa do banner: **Nota fiscal emitida · Entrega nacional · Cotação rápida via WhatsApp · Garantia 3 meses** com ícones.

## 3. Relatórios unificados (matar redundância)

Hoje a aba Relatórios tem 3 sub-abas independentes (Visão por subcategoria · Matriz × Máquina · Construtor) cada uma com sua exportação. Vira **um único painel** onde tudo acontece em sequência:

```text
┌─── Filtros (sempre no topo, sticky) ─────────────────────────┐
│ Subcategoria: [todas ▾]  Modelo: [todos ▾]  Fabricante:[…] │
│ Capital parado: ☐ apenas    Buscar: [______]                │
│ Agrupar por: ⊙ Subcategoria  ○ Modelo  ○ Fabricante  ○ Atributo│
└──────────────────────────────────────────────────────────────┘

┌─── KPIs (refletem filtros aplicados) ────────────────────────┐
│ SKUs · Unidades · Valor · % parado · Ticket médio            │
└──────────────────────────────────────────────────────────────┘

┌─── Visualização (tabs internas leves) ───────────────────────┐
│ [Cards] [Tabela] [Gráfico] [Matriz × Máquina]                │
│ ...conteúdo correspondente, mesmos dados filtrados...        │
└──────────────────────────────────────────────────────────────┘

[Exportar XLSX]  [PDF Executivo]  [Salvar visualização]
```

- **Um único conjunto de filtros** governa todas as visualizações.
- **Uma única ação de exportação** (XLSX/PDF) — exporta o que está visível.
- Cards, tabela, gráfico e matriz são **vistas alternativas dos mesmos dados**, não relatórios separados.
- Drill-down universal: click em qualquer linha/célula/barra → drawer com a lista de SKUs daquele recorte.
- "Salvar visualização" grava em `catalog_report_templates` (tabela já existe). Templates aparecem em barra horizontal acima dos filtros.

## 4. Arquivos afetados

**Migração**
- `supabase/migrations/<timestamp>_subcategorize_v2.sql` — dicionário ampliado, regex restritas, re-roda em todo o estoque

**Editados**
- `supabase/functions/subcategorize-parts/index.ts` — limite 500, retorno com progresso
- `src/lib/subcategory-rules.ts` — sincronizar ícones/labels com novas subcategorias
- `src/components/quote/QuoteHero.tsx` — bloco "Peças que você encontra aqui" + faixa de garantias + logos de compatibilidade
- `src/components/quote/QuoteCatalog.tsx` — modo "Por categoria" como default, chips de atributo, busca limpa filtro
- `src/components/quote/QuotePartCard.tsx` — chip de atributo principal + logo do fabricante
- `src/components/catalog/reports/ReportsTab.tsx` — virar painel único com filtros sticky
- `src/components/catalog/reports/ReportBuilder.tsx` — absorvido pelo painel unificado, vira componente de visualização
- `src/components/catalog/reports/SubcategoryMachineMatrix.tsx` — vira tab interna do painel

**Removidos** (redundância)
- A separação atual em 3 sub-abas. Vira tabs leves de visualização dentro de um painel só.

**Novo**
- `src/components/catalog/reports/UnifiedFilters.tsx` — barra de filtros + agrupamento que alimenta tudo
- `src/components/catalog/reports/SavedViews.tsx` — barra horizontal de templates salvos
- `src/components/quote/CategoryShowcase.tsx` — bloco hero "peças que você encontra"

## Resultado

- Catálogo passa a parecer o banner XCMG: vitrine por categoria, contagens reais, logos de compatíveis, faixa de garantias.
- Pneus, filtros, rolamentos etc. ficam **agrupados** com chips por medida/tipo — busca e drill-down imediatos.
- Cobertura de subcategoria sai de 50 % → >90 % via regras + IA, sem precisar revisão manual peça a peça.
- Relatórios deixam de ser 3 telas redundantes — viram **um painel** com filtros únicos que controlam KPIs, cards, tabela, gráfico e matriz, com uma única exportação.
- Diretoria pergunta "quantos pneus 26.5R25 eu tenho?" → 2 cliques (subcategoria Pneus → chip 26.5R25) → resposta com valor, máquinas e idade.

