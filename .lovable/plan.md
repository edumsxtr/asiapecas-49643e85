

# Plano: Reforçar pesquisa de mercado para peças ORIGINAIS XCMG

## Contexto

Hoje a pesquisa de mercado por IA busca preços de forma genérica em distribuidores brasileiros. O foco precisa ser ajustado: estamos vendendo **peças originais XCMG** e a comparação de mercado deve refletir isso — não adianta comparar com peças paralelas/genéricas baratas, distorce o preço.

## O que será ajustado

### 1. Edge function `auto-market-research` — prompt focado em ORIGINAL XCMG

- **Reescrever o system prompt** deixando explícito:
  - Foco em peças **GENUÍNAS / ORIGINAIS XCMG** (não paralelas, não recondicionadas, não genéricas)
  - Distribuidores prioritários: **XCMG Brasil oficial, Tracbel (dealer XCMG), Sotreq, Solar Equipamentos, distribuidores autorizados XCMG, Mercado Livre apenas anúncios marcados como "Original XCMG"**
  - Ignorar resultados de peças paralelas, "similar", "compatível", "recondicionada" — se só houver paralelas, retornar `results: []` e explicar no `search_summary`
  - Adicionar campo `is_genuine: boolean` em cada resultado para sinalizar quando a IA tem confiança que é original
- **Reforçar a query de busca**: incluir termos `"original XCMG"`, `"genuína"`, `"OEM"` na consulta enviada ao Google Search
- **Validação extra**: se `distributor_name` contém palavras-chave de paralelo (paralela, similar, compatível, alternativa, genérico), descartar o resultado server-side

### 2. UI — sinalização visual de "Original"

- **`MarketResearchTab`**: badge verde **"Original XCMG"** ao lado do distribuidor quando `is_genuine = true`; badge cinza **"Não confirmado"** quando dúvida
- **`MarketResearchPage`**: nova coluna **"Tipo"** (Original / Não confirmado) + filtro "Apenas originais"
- **CSV export**: incluir coluna `Tipo` (Original/Não confirmado)

### 3. Configuração persistida

- Pequeno ajuste no `auto-market-research`: aceitar parâmetro opcional `genuine_only: boolean` (default `true`) — permite no futuro o usuário relaxar o filtro pela UI se quiser ver paralelas também
- Toggle **"Incluir paralelas na busca"** (off por padrão) na aba `MarketResearchTab` ao lado do botão "Pesquisar com IA"

### 4. Schema — campo opcional `is_genuine`

- Adicionar coluna `is_genuine boolean` em `market_research` (nullable, default `null` para preservar registros antigos)
- Hook `useAutoMarketResearch` passa a salvar esse campo
- Hook `useMarketResearchOverview` passa a expor o campo

## Arquivos afetados

| Arquivo | Ação |
|---|---|
| `supabase/functions/auto-market-research/index.ts` | Prompt focado em XCMG original, query reforçada com "original XCMG/OEM", filtro server-side de paralelas, novo campo `is_genuine`, parâmetro `genuine_only` |
| Migração SQL | Adicionar coluna `is_genuine boolean` em `market_research` |
| `src/hooks/use-auto-market-research.ts` | Aceitar/passar `genuineOnly`, salvar `is_genuine` nos inserts |
| `src/hooks/use-market-research.ts` | Expor `is_genuine` no overview |
| `src/components/catalog/MarketResearchTab.tsx` | Badge "Original XCMG", toggle "Incluir paralelas" |
| `src/pages/MarketResearchPage.tsx` | Coluna Tipo + filtro "Apenas originais" + coluna Tipo no CSV |
| `src/lib/export-csv.ts` | Sem mudanças (já genérico) |

## Detalhes técnicos

- **Lista de palavras-chave de paralelo** (regex case-insensitive): `paralela|similar|compatível|alternativa|genérico|recondicionad|remanufaturad|aftermarket`
- Quando todos os resultados forem descartados como paralelos, salvar 1 linha com `notes = "IA encontrou apenas peças paralelas — sem referência de original"` para o usuário entender o vazio
- Migração é aditiva (coluna nullable) — não quebra registros antigos nem leitura existente
- Filtro UI "Apenas originais" filtra `is_genuine = true` client-side a partir do overview já carregado

## Resultado esperado

- Pesquisa de mercado comparando **maçã com maçã**: peça original XCMG vs peça original XCMG no mercado
- Gestor enxerga claramente quando o preço de referência é confiável (Original) ou não (Não confirmado)
- Possibilidade futura de incluir paralelas pontualmente sem perder o foco padrão

