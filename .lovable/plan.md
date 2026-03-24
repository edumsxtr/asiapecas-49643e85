

# Plano: IA Avançada para Categorização + Catálogo por Categoria de Peças

## Problema Atual

1. As peças são categorizadas apenas por 5 flags booleanas (mineração, linha amarela, etc.) que representam **tipo de máquina**, não **tipo de peça**
2. Não existe categorização por **função da peça** (filtros, rolamentos, vedações, motor, hidráulica, etc.)
3. No catálogo do cliente, não há navegação por tipo de peça — apenas por tipo de máquina
4. O modelo de IA atual (batch) usa `gemini-2.5-flash-lite` (o mais básico) para análise

## O que vou fazer

### 1. Nova coluna `part_category` na tabela `parts`

Migration para adicionar:
- `part_category TEXT` — categoria funcional da peça (ex: "Filtros", "Vedações", "Motor", "Hidráulica", "Elétrica", "Estrutural", "Transmissão", "Freios", "Refrigeração", "Acessórios")

### 2. Edge Function `categorize-parts` com modelo avançado

Nova edge function que usa `google/gemini-3-flash-preview` (modelo mais capaz e rápido) para:
- Analisar a descrição da peça e classificar em uma das categorias predefinidas
- Processar em lote (batch de até 50 peças por chamada)
- Salvar a categoria diretamente na tabela `parts`
- Usar tool calling para output estruturado garantido

Categorias predefinidas:
- Filtros (óleo, ar, combustível, hidráulico)
- Vedações e Retentores
- Motor e Componentes
- Sistema Hidráulico
- Sistema Elétrico
- Estrutural e Chassi
- Transmissão
- Freios
- Refrigeração
- Rolamentos e Buchas
- Acessórios e Outros

### 3. Atualizar `part-research` para usar modelo mais avançado

Trocar de `openai/gpt-5.2` para `google/gemini-2.5-pro` (melhor para análise técnica complexa). Também salvar a `part_category` ao analisar individualmente.

### 4. Atualizar `batch-ai-research` para usar modelo melhor

Trocar de `gemini-2.5-flash-lite` para `google/gemini-3-flash-preview` e incluir categorização no mesmo fluxo.

### 5. Navegação por categoria de peça no catálogo do cliente

No `QuoteCatalog.tsx`:
- Adicionar filtro por **categoria de peça** no sidebar (com ícones e contagem)
- Seção visual com cards de categoria no topo (tipo "departamentos" de e-commerce)
- Chips de categoria clicáveis acima do grid

No `QuoteHero.tsx`:
- Adicionar segunda fileira de categorias funcionais abaixo das categorias de máquina

### 6. Trigger automático de categorização

Ao importar estoque (via `import-catalog` ou `bulk-update-stock`), chamar a categorização automaticamente para peças novas sem `part_category`.

## Arquivos a criar/editar

| Arquivo | Ação |
|---------|------|
| Migration SQL | Adicionar coluna `part_category` à tabela `parts` |
| `supabase/functions/categorize-parts/index.ts` | Criar — batch categorização com IA avançada |
| `supabase/functions/part-research/index.ts` | Editar — modelo mais avançado + salvar categoria |
| `supabase/functions/batch-ai-research/index.ts` | Editar — modelo melhor + incluir categorização |
| `src/components/quote/QuoteCatalog.tsx` | Editar — filtro por categoria de peça, seção de categorias visual |
| `src/components/quote/QuoteHero.tsx` | Editar — chips de categoria funcional |
| `src/components/quote/translations.ts` | Editar — nomes das categorias em PT/EN/ES |
| `src/hooks/use-parts.ts` | Editar — suporte a filtro por `part_category` |

