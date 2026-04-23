

# Plano: Links Confiáveis + Categorização + Exportação na Pesquisa de Mercado

## Problemas atuais

1. **Links quebrados/inventados**: a IA gera `source_url` que muitas vezes não existe (alucinação). Hoje salvamos sem validar, e o usuário clica num link 404.
2. **Sem categorização** na aba `/pesquisa-mercado`: não dá para filtrar por categoria de peça (Filtros, Hidráulico, Elétrica…) nem por fonte (IA vs manual).
3. **Sem exportação**: gestor não consegue baixar a pesquisa em planilha para análise externa ou envio.

## Solução

### 1. Links confiáveis (correção do problema central)

**Edge function `auto-market-research`:**
- Reforçar o prompt: "URL deve ser exatamente a página visitada na busca; se não tiver certeza absoluta, OMITA o campo".
- **Validação server-side** de cada `source_url` antes de retornar:
  - Validar formato (URL válida, http/https)
  - Fazer `fetch HEAD` (timeout 4s) — se retornar 404/410/erro de rede, **descarta a URL** e mantém o restante do registro
  - URLs validadas ganham flag `url_verified: true`
- **Fallback inteligente**: quando a URL específica falha ou não existe, gerar uma URL de busca confiável (ex: `https://www.google.com/search?q=<material>+<distribuidor>` ou `https://lista.mercadolivre.com.br/<material>`) marcada como `source_url_type: "search"` em vez de inventar uma URL de produto.

**Frontend (`MarketResearchTab` e `MarketResearchPage`):**
- Renderizar o link com ícone diferente quando for "busca" vs "página direta" (badge "🔎 Busca" vs "🔗 Página")
- Tooltip avisando "Link de busca — verificar resultado" quando for fallback
- Botão "Reportar link quebrado" — marca o registro com `notes` adicional e remove a URL

### 2. Categorização da aba Pesquisa de Mercado

Na página `/pesquisa-mercado`:
- **Carregar `part_category`** no `useMarketResearchOverview` (incluir no select da query)
- Adicionar **filtro "Categoria"** ao lado dos filtros existentes (Distribuidor, Disponibilidade)
- **Card de KPI extra**: distribuição por categoria (mini barras horizontais)
- **Coluna "Categoria"** na tabela com badge colorido (reutiliza ícones de `part-categories.ts`)
- Adicionar **filtro "Fonte"**: Todas / IA / Manual (`researched_by`)
- Adicionar **agrupamento opcional** "Agrupar por categoria" — toggle que separa a tabela em seções

### 3. Exportação

Botão **"Exportar CSV"** no header da página `/pesquisa-mercado`:
- Exporta os registros **filtrados** atualmente visíveis
- Colunas: Código da Peça, Descrição, Categoria, Distribuidor, Preço, Nosso Preço, Diferença %, Prazo, Disponibilidade, Fonte, URL, Data, Observações
- Nome do arquivo: `pesquisa-mercado-YYYY-MM-DD.csv` com BOM UTF-8 (abre certinho no Excel BR)
- Sem dependência nova: gera CSV puro em JS

### 4. Pequenas melhorias de robustez

- Adicionar **Zod** na validação do body da edge function
- Nas linhas onde a IA retornou "sem resultados" (`price_found = 0`), exibir badge "Sem referências" em vez de R$ 0,00 confuso
- Ordenar resultados por menor preço dentro de cada peça

## Arquivos afetados

| Arquivo | Ação |
|---|---|
| `supabase/functions/auto-market-research/index.ts` | Validação de URL (HEAD fetch), fallback para URL de busca, flag `url_verified`, prompt reforçado, Zod no body |
| `src/hooks/use-market-research.ts` | Incluir `part_category` no select de `useMarketResearchOverview` |
| `src/pages/MarketResearchPage.tsx` | Filtro Categoria + Fonte, coluna Categoria, agrupamento opcional, botão Exportar CSV, badge "Sem referências" |
| `src/components/catalog/MarketResearchTab.tsx` | Renderização melhorada do link (tooltip + tipo), botão "Reportar link quebrado", ordenar por menor preço |
| `src/lib/export-csv.ts` | **Novo** — utilitário genérico para exportar arrays como CSV com BOM UTF-8 |

## Detalhes técnicos

- **Validação de URL na edge function**: `Promise.allSettled` com timeout via `AbortController` (4s) para não travar em sites lentos; se >50% falhar, ainda assim retorna os dados (sem URL)
- **Fallback de URL de busca**: distribuidor reconhecido (Mercado Livre, Tracbel, Solar) → URL de busca específica do site; senão → Google search
- **CSV**: separador `;` (padrão BR Excel), aspas duplas escapadas, `\r\n` como quebra de linha, prefixo `\uFEFF` (BOM)
- **Performance**: filtros e agrupamento client-side com `useMemo`; categoria já vem no payload (1 query a mais nada)
- **Acessibilidade**: link com `aria-label` descritivo do tipo (página/busca)

## Resultado esperado

- Zero links 404 — ou validados, ou substituídos por URL de busca útil
- Pesquisa de Mercado navegável por categoria e fonte (IA/manual)
- Export CSV pronto para análise no Excel ou envio por email
- Sistema mais confiável e gerenciável

