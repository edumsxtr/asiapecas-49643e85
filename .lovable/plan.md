

# Plano: corrigir enriquecimento web (Firecrawl v2 retorna objeto, não array)

## Causa raiz

Logs mostram em loop: `TypeError: arr.filter is not a function` em `firecrawlSearch`. Toda chamada de busca falha → `firecrawl_hits = 0` → cliente recebe "Nenhum resultado público encontrado".

Motivo: na **API v2 do Firecrawl**, o campo `data.web` da resposta de `/v2/search` é um **objeto** (com sub-arrays como `results`, ou estrutura `{ web: { ... } }`), não um array direto. O código atual faz:

```ts
const arr = (data.web || data.data || []) as Array<…>;
return arr.filter(…);   // ❌ data.web é objeto truthy → .filter quebra
```

O mesmo erro está em **3 edge functions** (não só `enrich-customer`):
- `enrich-customer/index.ts` (linha 135)
- `prospect-search/index.ts` (linha 28)
- `prospect-from-customer/index.ts` (linha 47)

## Correção

Criar um **normalizador único e tolerante** ao formato de resposta v2, que aceita todas as variações que o Firecrawl pode retornar:

```ts
function extractFirecrawlSearchResults(data: any): Array<{ url: string; title?: string; description?: string }> {
  // v2 atual: { success, data: { web: [ {url,title,description} ] } }
  // v2 alt:   { success, web: [ … ] }
  // v2 alt:   { success, data: [ … ] }            (legacy)
  // v2 alt:   { web: { results: [ … ] } }         (envelope object)
  const candidates = [
    data?.data?.web,
    data?.web,
    data?.data,
    data?.web?.results,
    data?.data?.web?.results,
    data?.results,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c.filter((r: any) => r && typeof r.url === "string");
  }
  return [];
}
```

Aplicar em todas as 3 edge functions, substituindo o trecho `(data.web || data.data || []).filter(...)`. Adicionar log do shape real quando vier vazio (`console.warn("firecrawl unknown shape", Object.keys(data ?? {}))`) — facilita diagnosticar futuras mudanças da API.

## Robustez extra (mesma passagem)

1. **Logar quando search retorna 0** mesmo após normalizar — distingue "Firecrawl OK mas sem resultados" de "shape errado".
2. **Telemetria mais clara no `enrich-customer`**: quando `urls_returned = 0` E `searched_queries > 0`, gravar no `_note` mensagem específica "Firecrawl não retornou resultados — verifique conexão/créditos" em vez do genérico "Nenhum resultado público encontrado".
3. **Verificar créditos Firecrawl**: se qualquer `firecrawlSearch` retornar HTTP 402, propagar para o usuário com mensagem clara ("Créditos do Firecrawl esgotados — recarregue na conexão").
4. **Reverificar que a chave `FIRECRAWL_API_KEY` está injetada** (já está no projeto conforme `<secrets>`, mas adicionar log na primeira chamada para confirmar).

## Validação após o fix

Rodar `enrich-customer` em 1 cliente real. Esperado nos logs:
- `firecrawl_hits = N (N>0)`
- `telemetry.urls_returned > 0`
- `urls_scraped_ok > 0`
- Painel do cliente mostra fontes verificadas + dados extraídos pela IA.

Se ainda voltar 0 após o fix, o log do novo `console.warn("firecrawl unknown shape", …)` revela exatamente qual chave a API está usando hoje.

## Arquivos editados

- `supabase/functions/enrich-customer/index.ts` — usar `extractFirecrawlSearchResults`, propagar 402, melhorar `_note`
- `supabase/functions/enrich-customer-from-url/index.ts` — adicionar verificação de 402 no scrape (não usa search, mas mesma classe de erro)
- `supabase/functions/prospect-search/index.ts` — mesmo helper
- `supabase/functions/prospect-from-customer/index.ts` — mesmo helper

Sem mudança de schema, sem mudança de UI — só correção do parse de resposta e mensagens.

## Resultado

- Enriquecimento volta a funcionar para clientes reais (Anglo American, Alya Construtora, etc. que apareceram nos logs com 0 hits).
- Quando falhar de verdade (sem créditos, empresa muito obscura), o usuário recebe mensagem específica em vez do genérico atual.
- Logs futuros permitem detectar mudança de API do Firecrawl em segundos.

