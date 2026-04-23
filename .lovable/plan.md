

# Plano: Pesquisa de Mercado IA — Zero margem de erro no link do anúncio

## Problema confirmado

Hoje a edge function `auto-market-research`:
1. Pede à IA um `source_url` do anúncio
2. Valida apenas se a URL **responde HTTP 200** (`checkUrl` faz HEAD)
3. Marca como `url_verified: true` e tipo `"page"` se passou

**Falha grave**: HTTP 200 só prova que a página existe — **não prova que ela contém o código `${material}` da peça pesquisada**. Resultado: clico no link e abro a homepage do distribuidor, ou um anúncio de outra peça, ou uma listagem genérica. O vendedor perde confiança.

Casos reais de falso positivo:
- IA retorna `tracbel.com.br/produtos` (200 OK, mas é catálogo geral)
- IA retorna `mercadolivre.com.br/MLB-12345-OUTRA-PECA` (200 OK, peça diferente)
- IA "alucina" um slug plausível que existe mas não é o anúncio

## Solução: validação de conteúdo, não só de status

### 1. `checkUrl` vira `verifyUrlContainsPartNumber`

Substituir a verificação atual por uma que **baixa o HTML da página** (até 200 KB) e procura o `material` literalmente — em forma exata, normalizada (sem hífen/espaço/ponto) e em meta-tags.

```ts
async function verifyUrlContainsPartNumber(url, material): Promise<{ ok, evidence }>
```

Regras:
- HEAD primeiro para descartar 404/timeout
- GET com `Range: bytes=0-204800` (cap 200KB; a maioria dos anúncios cabe no `<head>` + título)
- Decodifica HTML, remove tags via regex leve, normaliza com `normalizePartNumber()`
- Procura `material` em 3 formas: literal, normalizada, e em `<title>`/`<meta name="description">`/`<h1>` (extraídos por regex)
- Retorna `evidence`: trecho de até 120 chars onde o código foi encontrado (vai virar tooltip "comprovação")
- Bloqueia URLs claramente genéricas: domínios sem path (`tracbel.com.br/`), `/produtos`, `/categorias`, `/busca`, `/search`, `/?q=` — mesmo se contiverem o código no HTML

### 2. Resultado da validação determina a UI

| Situação | `source_url_type` | `url_verified` | UI |
|---|---|---|---|
| Página contém o código no HTML/title | `"page"` | `true` | Badge verde "Página verificada ✓" + tooltip mostra `evidence` |
| Página existe mas NÃO contém o código | descartada | — | Substituída por `buildSearchUrl()` ("Busca") |
| Página 404/timeout | descartada | — | Substituída por busca |
| URL genérica (homepage/listagem) | descartada | — | Substituída por busca |

Resultado nunca mais leva o usuário a "Página verificada" que não é o anúncio certo.

### 3. Reforço no prompt + descarte de resultados sem URL útil

No `systemPrompt`:
- Exigir que `source_url` seja **a URL da página do anúncio individual** (não listagem/categoria/home). Se a IA não tem essa URL exata, **omitir o campo** — melhor sem URL do que URL errada.
- Adicionar exemplos de URLs ACEITÁVEIS (`mercadolivre.com.br/MLB-12345-pistao-xcmg-860126593-_JM`) e RECUSÁVEIS (`tracbel.com.br/`, `mercadolivre.com.br/ofertas`).

No pós-processamento da edge function:
- Resultado com `match_confidence === "exact"` mas URL não-verificável → mantém o resultado, mas força `source_url_type = "search"` e adiciona nota: "Anúncio confirmado pela IA, link direto não disponível — use a busca para abrir".
- Resultado SEM `matched_part_number` literal verificado **na URL nem no HTML** → descartado (`droppedMismatch++`).

### 4. Re-verificação sob demanda na UI (`MarketResearchTab.tsx`)

Adicionar botão **"Reverificar link"** ao lado do botão "Reportar quebrado" em cada linha:
- Chama nova edge function `verify-market-url` (input: `{ research_id, material, url }`) que reaplica `verifyUrlContainsPartNumber`
- Atualiza `market_research.notes` com o resultado e `source_url` (mantém ou troca por busca)
- Toast: "Link confirma o código X" / "Link não contém o código — substituído por busca"

Isso permite ao vendedor **provar na hora** que o link é confiável antes de mostrar para o cliente.

### 5. Coluna nova `match_evidence` (opcional, sem migração obrigatória)

Em vez de criar coluna nova, gravar a `evidence` dentro de `notes` no formato:
```
[verificado: "...título do anúncio com código 860126593..."]
```
Renderizar como tooltip do badge "Página verificada". Zero migração, retrocompatível.

### 6. Cache de verificação (1 hora)

Para evitar re-baixar a mesma URL em chamadas seguidas (ex.: várias peças no mesmo distribuidor), `Map<url, {ok, evidence, ts}>` em memória do worker, TTL 1h. Reduz custo e latência.

## Arquivos afetados

| Arquivo | Ação |
|---|---|
| `supabase/functions/auto-market-research/index.ts` | Substituir `checkUrl` por `verifyUrlContainsPartNumber`; bloquear URLs genéricas; reforçar prompt; descartar/rebaixar resultados sem prova; gravar `evidence` em `notes` |
| `supabase/functions/verify-market-url/index.ts` | **Novo** — reverificação on-demand de uma única URL |
| `src/hooks/use-market-research.ts` | Novo `useVerifyMarketUrl()` mutation |
| `src/components/catalog/MarketResearchTab.tsx` | Botão "Reverificar link" por linha; tooltip do badge mostra `evidence` extraída de `notes`; badge muda para "Verificado ✓" só quando `url_verified === true` |

## Detalhes técnicos

- **Performance**: GET parcial (200KB) com timeout 5s; verificação em paralelo (`Promise.allSettled`) já existe — mantida. Cache 1h evita reprocessar.
- **Robustez do match no HTML**: HTML pode ter o código com entidades (`&shy;`, `&#45;`) ou dentro de JSON-LD. Estratégia: depois de strip-tags, decodificar entidades comuns + normalizar antes de comparar. Fallback procura também o `matched_part_number` retornado pela IA, não só `body.material`.
- **URLs bloqueadas (lista)**: pathnames `/`, `/produtos`, `/categoria(s)`, `/busca`, `/search`, `/ofertas`, `/loja`, `/marca/xcmg`, `?q=`, `?search=`. Configurável no topo do arquivo.
- **Mercado Livre**: anúncios têm padrão `/MLB-NNNNN-` ou `/p/MLB...`. Se a URL é ML mas não contém esse padrão, marca como busca.
- **Segurança**: Zod valida input em `verify-market-url` (`research_id: uuid, url: string.url, material: string.min(1)`); JWT obrigatório.
- **Sem regressão de UX**: usuário continua vendo resultados — só muda que "Página" agora **garante** conter o código; quando não, fica "Busca" (com aviso).
- **Telemetria leve**: log no Edge `console.info("verify ok|reject reason ...")` para debug futuro sem expor PII.

## Resultado esperado

- **Zero falsos positivos** em "Página verificada" — clicar SEMPRE leva a anúncio que contém o código pesquisado, com evidência textual visível em tooltip.
- Vendedor pode **reverificar manualmente** qualquer link antigo em 1 clique.
- URLs genéricas (homepage, busca, categoria) deixam de ser apresentadas como "página direta".
- Resultados confirmados pela IA mas sem URL precisa continuam aparecendo — apenas com link de busca, com nota explícita.
- Cache reduz custo de verificação repetida; performance praticamente igual à atual.

