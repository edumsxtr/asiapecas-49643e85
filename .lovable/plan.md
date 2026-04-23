

# Plano: Garantir match exato do código da peça (mesmo item, não similar)

## Problema

Hoje a IA pode retornar preços de peças "parecidas" ou de famílias próximas, mesmo sendo Original XCMG. Precisamos garantir que o resultado seja **exatamente o mesmo código de material** (part number) que estamos pesquisando — não um item similar, não um substituto, não uma versão diferente.

## O que será ajustado

### 1. Edge function `auto-market-research` — match exato obrigatório

- **Prompt reforçado**:
  - "Você está procurando o **código de peça EXATO**: `{material}`. Não aceite códigos parecidos, nem famílias relacionadas, nem versões alternativas."
  - "Se o anúncio/site não mostrar literalmente o código `{material}` (ou variação trivial como hífen/espaço), DESCARTE."
  - Exemplo no prompt: "Procurando `860126593`? Aceite `860126593`, `860-126-593`, `860 126 593`. NÃO aceite `860126594` nem `860126593-A`."
- **Novo campo por resultado**: `matched_part_number: string` — o código exato encontrado no anúncio (texto literal)
- **Novo campo**: `match_confidence: "exact" | "normalized" | "uncertain"`
  - `exact`: código bate caractere por caractere
  - `normalized`: bate ignorando espaços/hífens/case
  - `uncertain`: IA acha que é o mesmo mas não viu o código literal → **descartar server-side**

### 2. Validação server-side de match

- Função `normalizePartNumber(s)`: lowercase, remove espaços/hífens/pontos
- Para cada resultado, comparar `normalize(matched_part_number)` com `normalize(material)`:
  - Igual → aceita, marca `match_confidence` final
  - Diferente ou ausente → descarta (logado em `dropped_mismatch_count`)
- Reforça a query Google Search incluindo o código entre aspas: `"860126593" original XCMG`

### 3. Schema — novos campos

- Migração aditiva em `market_research`:
  - `matched_part_number text` (nullable)
  - `match_confidence text` (nullable, valores: `exact`/`normalized`)

### 4. UI — sinalização de match

- **`MarketResearchTab`**: ao lado do distribuidor, badge extra:
  - 🟢 "Código exato" (`exact`)
  - 🟡 "Código equivalente" (`normalized`) com tooltip explicando (ex: hífens removidos)
- **`MarketResearchPage`**: nova coluna **"Match"** com mesmo badge + filtro "Apenas código exato"
- **CSV export**: nova coluna `Match` (Exato / Equivalente)

### 5. Mensagens ao usuário

- Quando todos os resultados forem descartados por mismatch: salvar 1 linha com `notes = "IA não localizou anúncios com o código exato {material}"` e toast amigável
- Diferenciar no toast: paralelas vs código diferente vs sem nenhum resultado

## Arquivos afetados

| Arquivo | Ação |
|---|---|
| `supabase/functions/auto-market-research/index.ts` | Prompt com match exato, query com aspas, validação server-side de `matched_part_number`, novos campos no JSON, contagem `dropped_mismatch_count` |
| Migração SQL | Adicionar `matched_part_number text` e `match_confidence text` em `market_research` |
| `src/hooks/use-auto-market-research.ts` | Salvar novos campos, toast diferenciado por motivo de descarte |
| `src/hooks/use-market-research.ts` | Expor `matched_part_number` e `match_confidence` no overview |
| `src/components/catalog/MarketResearchTab.tsx` | Badges "Código exato"/"Equivalente" + tooltip |
| `src/pages/MarketResearchPage.tsx` | Coluna Match + filtro "Apenas código exato" + coluna Match no CSV |

## Detalhes técnicos

- **Normalização**: `s.toLowerCase().replace(/[\s\-\._]/g, "")`
- Migração 100% aditiva (campos nullable) — registros antigos seguem funcionando
- Filtro UI "Apenas código exato" é client-side a partir do overview já carregado
- Combina com filtros existentes (Original XCMG, Categoria, Fonte) sem conflito
- Edge function retorna no payload: `{ results, dropped_parallel_count, dropped_mismatch_count, search_summary }` para o hook escolher a mensagem certa

## Resultado esperado

- Pesquisa de mercado retorna **somente o mesmo código de peça** que estamos vendendo
- Gestor vê com clareza se o preço de referência é do **item idêntico** (verde) ou de uma variação equivalente (amarelo)
- Comparação 100% confiável: peça original XCMG **e** mesmo part number

