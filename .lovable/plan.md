

# Plano: Enriquecimento e Prospecção CRM com fontes reais e verificadas

## Problema confirmado

| Função | O que faz hoje | Por que falha |
|---|---|---|
| `enrich-customer` | Pede à IA `sources: string[]` sem busca real | IA inventa URLs plausíveis (404, redirect, empresa errada). CNPJ/CNAE também são chutados. |
| `prospect-from-customer` | IA escreve `summary` sem dados externos | Texto genérico, sem evidência |
| `prospect-search` | Pede à IA para "gerar empresas reais" com telefone/CNPJ | Praticamente 100% inventado — risco grave de contato com dados falsos |

**Causa única**: o modelo nunca consulta a web — apenas redige o que parece verossímil.

## Solução: pipeline "buscar → verificar → registrar evidência"

Mesma arquitetura que blindou a pesquisa de mercado de peças.

### 1. Adicionar conector **Firecrawl** (busca web real + scraping)

- Pedir ao usuário para conectar Firecrawl (botão Connectors). Sem ele, o sistema mostra aviso e **não** chama a IA — evita gerar lixo.
- Firecrawl entrega 2 capacidades essenciais:
  - **`/v2/search`**: lista resultados reais do Google com `url`, `title`, `description`
  - **`/v2/scrape`**: baixa o conteúdo da página (markdown) para a IA ler **fatos reais**, não inventar

### 2. `enrich-customer` reescrita (pipeline em 3 passos)

```text
[Cliente: nome + empresa + cidade]
        │
        ▼
1. Firecrawl SEARCH → 6 candidatos:
   "{empresa} {cidade}", "{empresa} CNPJ", "{empresa} site oficial",
   "{empresa} linkedin", "{empresa} contato"
        │
        ▼
2. Filtrar/validar URLs (mesma lógica de verify-market-url):
   - Bloqueia listagens genéricas (/busca, /categorias, homepages sem prova)
   - SCRAPE top 4 candidatos (markdown, 200KB)
   - Confere se nome/empresa/cidade aparecem no conteúdo
   - Mantém só fontes que CONTÊM o nome da empresa (literal ou normalizado)
        │
        ▼
3. IA recebe SOMENTE o markdown verificado e extrai:
   { official_name, cnpj, cnae, porte, site, linkedin, instagram, telefone,
     endereco, decision_maker_role, commercial_notes,
     evidence_per_field: { campo: "trecho exato + url" } }
   → tool_call com schema rígido; null obrigatório quando não houver evidência
        │
        ▼
4. Persistir em customers.enrichment_data:
   - cada campo acompanhado de { value, source_url, source_excerpt }
   - sources[] = só URLs efetivamente scrapeadas e verificadas
   - confidence = high (≥3 fontes confirmam) / medium (1-2) / low (heurístico)
```

**Ganhos**: zero links inventados, cada campo rastreável até trecho da página, CNPJ só aparece se foi lido de uma fonte real.

### 3. `prospect-from-customer` reescrita (mesma lógica, escopo menor)

- Firecrawl SEARCH para `{empresa} frota máquinas`, `{empresa} licitação`, `{empresa} obra` → scrape top 3
- IA lê markdown e produz `summary` + `score` **citando trechos das páginas** em `evidence`
- Sem fonte com sinal → score "indefinido" + nota "sem evidência pública recente", em vez de chute

### 4. `prospect-search` reescrita (a mais perigosa hoje)

Hoje "inventa" empresas. Novo fluxo:

- Input: país, estado, segmento
- Firecrawl SEARCH com queries por segmento+UF: `mineradoras {UF}`, `construtoras pesadas {UF} site:.com.br`, `frota XCMG {UF}`
- Para cada resultado real (até 12), SCRAPE rapidamente para extrair: nome empresa, telefone, email, cidade
- IA apenas **classifica e ordena** os achados (score, segmento, peças do catálogo que combinam)
- **Nunca** retorna empresa sem `source_url` válido scrapeado
- Ao salvar em `prospects.notes`, anexar `[Fontes: url1 | url2]` para auditoria

### 5. UI: mostrar evidências, sem "links quebrados como demonstração"

`EnrichmentPanel.tsx` e linha de prospect:

- Cada campo enriquecido ganha tooltip mostrando o trecho que o originou
- Botão "Ver fonte" abre URL **já verificada** em nova aba
- Botão "Reverificar" por cliente — re-roda o pipeline com cache de 24h em memória do worker
- Quando `confidence = low` ou sem fontes → painel exibe banner amarelo "Sem fontes públicas confirmadas — preencha manualmente"
- Remove a seção "Fontes consultadas" antiga (que mostrava qualquer URL que a IA escreveu) — substituída por "Fontes verificadas: N"

### 6. Nova edge function `verify-customer-source`

Reusa a estratégia de `verify-market-url`: input `{ url, customer_name }`, baixa HTML/markdown, confirma se o nome do cliente aparece, retorna `{ ok, evidence }`. Disponível para o botão "Reverificar fonte" em cada link individual.

## Arquivos afetados

| Arquivo | Ação |
|---|---|
| `supabase/functions/enrich-customer/index.ts` | Reescrever: pipeline search → scrape → verify → IA extrai com evidência |
| `supabase/functions/prospect-from-customer/index.ts` | Igual: scrape antes da IA, summary só com evidência |
| `supabase/functions/prospect-search/index.ts` | Reescrever: IA classifica empresas reais scrapeadas, nunca inventa |
| `supabase/functions/verify-customer-source/index.ts` | **Novo** — reverificação on-demand de URL + nome |
| `src/components/customers/EnrichmentPanel.tsx` | Tooltips de evidência, botão "Reverificar fonte", banner low-confidence, lista só fontes verificadas |
| `src/components/customers/CustomerProspectionTab.tsx` · `src/pages/ProspectionPage.tsx` | Mostrar `source_url` verificado por prospect; aviso quando sem fonte |
| `src/hooks/use-customers.ts` | Novo `useVerifyCustomerSource()` |
| Aviso em UI quando Firecrawl não conectado | Bloqueia o botão de enriquecimento e instrui a conectar |

## Detalhes técnicos

- **Firecrawl key**: lida server-side via `Deno.env.get("FIRECRAWL_API_KEY")`. Função retorna 412 com mensagem clara se ausente — UI exibe CTA "Conectar Firecrawl".
- **Verificação de conteúdo** (reaproveita `verifyUrlContainsPartNumber`): após scrape, normaliza nome da empresa (remove "LTDA", "S/A", acentos, caixa) e procura no markdown. Sem match → URL descartada.
- **CNPJ**: só aceito se a regex `\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}` aparecer no markdown de uma fonte verificada. Caso contrário, `null`.
- **Performance**: scrape em paralelo (`Promise.allSettled`), timeout 8s por URL, cap 3-4 páginas por cliente. Cache em memória do worker (TTL 1h) por `(empresa, cidade)`.
- **Custo**: cada enriquecimento = ~5 chamadas Firecrawl + 1 IA. Aceitável; é o vendedor decidindo enriquecer um cliente por vez.
- **Bulk enrich** (já existe): processa sequencial, com `await` entre clientes, para respeitar rate limits.
- **Telemetria**: `console.info` registra `firecrawl_hits`, `verified_sources`, `dropped_sources` por execução — debug futuro sem expor PII.
- **Sem mudança em RLS / banco** — `enrichment_data` é `jsonb`, comporta o novo schema com `evidence`.
- **Validação Zod** nos inputs das 4 funções (já obrigatório) — `customer_id`, `url`, `customer_name` validados antes de qualquer chamada externa.

## Resultado esperado

- **Zero links quebrados** apresentados como "fonte" — toda URL exibida foi baixada e contém o nome do cliente.
- **CNPJ, telefone, endereço, redes** só aparecem quando lidos de página real verificada — fim dos dados inventados.
- Vendedor vê **trecho da página de origem** como tooltip ao passar o mouse no campo enriquecido.
- Botão "Reverificar" permite auditar qualquer fonte na hora.
- Prospects gerados pela IA passam a ser **empresas reais com URL verificada** em vez de empresas fictícias.
- Quando não há evidência pública, sistema **avisa explicitamente** em vez de fabricar resposta.

