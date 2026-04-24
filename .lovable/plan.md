

# Plano: corrigir a busca de IA dos clientes que volta vazia

## Diagnóstico real (do banco de dados, não chute)

Olhei os 14 últimos enriquecimentos. O padrão é nítido:

| Cliente | URLs retornadas | Resultado |
|---|---:|---|
| AMARILLO GOLD | 25 | ✅ 3 fontes verificadas |
| ANGLO AMERICAN MINERIO DE FERRO BRASIL S/A. | **0** | ❌ vazio |
| ANDRADE GUTIERREZ CONSTRUCOES E SERVICOS S.A | **0** | ❌ vazio |
| ALYA CONSTRUTORA S/A | **0** | ❌ vazio |
| ÀGILIS MINERAÇÃO BRIT. E RECICLAGEM (BRITEC) | **0** | ❌ vazio |
| ADS ASSESSORIA E MANUTENCAO | **0** | ❌ vazio |

Quando o nome **funciona em busca manual no Google** mas o Firecrawl volta zero, a causa é o jeito que o nome está sendo enviado para o Firecrawl, não o Firecrawl em si.

### As três causas reais

1. **Aspas no nome inteiro com pontuação suja**. Hoje a função monta queries assim:
   ```
   "ANGLO AMERICAN MINERIO DE FERRO BRASIL S/A." Conceição do Mato Dentro MG
   "ANDRADE GUTIERREZ CONSTRUCOES E SERVICOS S.A" telefone endereço
   "ÀGILIS MINERAÇÃO BRIT. E RECICLAGEM (BRITEC)" CNPJ
   ```
   O `S/A.`, `S.A`, parênteses, abreviações `BRIT.` e o `À` com crase forçam o Google/Bing a procurar pela string literal exata, que **nunca aparece nesse formato** em sites públicos. Aí volta zero. Tirando as aspas, a Anglo American é o terceiro maior site de mineração do Brasil — claro que tem milhares de páginas.

2. **Nome legal vs nome comercial**. "ANDRADE GUTIERREZ CONSTRUCOES E SERVICOS S.A" → o site real usa "Andrade Gutierrez Engenharia". "ALYA CONSTRUTORA S/A" → aparece como "Alya Construtora". Buscar a razão social inteira entre aspas afasta o resultado em vez de aproximar.

3. **CNPJ vazio nas queries**. Para clientes sem CNPJ cadastrado, perdemos a query mais forte (a única que tem 100% de match único). E não há fallback que use só o nome curto + cidade sem aspas.

Ou seja: **a função está pedindo coisas que o motor de busca não consegue achar literalmente, então ela recebe zero, então a IA recebe nada para ler, então o cliente vê "nenhum resultado encontrado"**. O Firecrawl está vivo (AMARILLO GOLD provou) e os créditos estão OK.

## O que vou mudar

### 1. Reescrever a montagem de queries (`enrich-customer/index.ts`)

Criar função `buildSmartQueries(companyName, cnpj, city, state)` que produz três tipos de query, na ordem:

**a. Queries fortes (uma só) — só quando existe CNPJ**
```
"<cnpj formatado>"
```

**b. Queries médias — nome curto sem pontuação, sem aspas no nome inteiro**
A partir de "ANGLO AMERICAN MINERIO DE FERRO BRASIL S/A." gerar:
- `core` = "ANGLO AMERICAN MINERIO DE FERRO BRASIL" (sem `S/A.`, `LTDA`, `EIRELI`, `EPP`, `ME`, `CIA`, `S.A`, `S/A`, parênteses e o que estiver dentro deles, abreviações como `BRIT.` viram `BRIT`).
- `short` = primeiras 3 palavras do core: "ANGLO AMERICAN MINERIO".
- Queries:
  ```
  Anglo American Minerio Conceicao do Mato Dentro
  Anglo American Minerio site oficial
  Anglo American Minerio linkedin
  Anglo American Minerio cnpj
  ```
  Tudo **sem aspas** (deixa o motor fazer matching aproximado). Acentos removidos para tolerar variação ortográfica.

**c. Queries de longo alcance — só nome curto + país**
```
Anglo American mineração Brasil
```

**d. Tentativa direta no LinkedIn como query simples**
```
site:linkedin.com/company Anglo American Minerio
```

Se o nome curto tem ≤2 tokens muito comuns ("4B Mining", "Mw Projetos"), a busca acrescenta **`empresa` ou `mineração` ou `construção`** como pista de domínio (puxando do `customer.segment` quando houver).

### 2. Adicionar um segundo round automático quando o primeiro vier zero

Hoje, se `urls_returned = 0`, a função desiste e grava "nenhum resultado". Mudar para:

- Se primeiro round (queries com aspas e nome longo) retornou zero → roda automaticamente o segundo round (nome curto, sem aspas, com cidade).
- Só desiste depois do segundo round.

Telemetria nova: `rounds_executed: 1|2`, `final_round_yielded: N`.

### 3. Sanitização visível na UI quando houver acentos/caracteres atípicos

No `EnrichmentPanel.tsx`, quando o cliente tem `À`, `Ç` no início, `(...)`, ou pontuação no meio, mostrar abaixo do botão "Reverificar":
> "Buscando como **Anglo American Minerio** + cidade. [✏️ Buscar com outro nome]"

Botão "Buscar com outro nome" abre input rápido onde o usuário digita o termo de busca que ele sabe que funciona ("Anglo American", "Andrade Gutierrez"). Esse termo é usado como `companyName` só para essa requisição.

### 4. Backend aceita override de termo

A função `enrich-customer` passa a aceitar `body.search_override?: string`. Se vier, **substitui** o nome cadastrado para a montagem de queries (mas o matching do conteúdo continua usando o nome real do cliente, então a verificação de fonte segue rigorosa). Isso resolve casos como "ALYA CONSTRUTORA S/A" → usuário força "Alya Construtora".

### 5. Mensagem de erro no painel passa a ser acionável

Hoje vira "Nenhum resultado público encontrado" (ou seja: a culpa é do mundo). Trocar por:
> "Nossa busca por **`<query usada>`** não retornou resultados no Firecrawl. Tente: 1) usar o botão **Buscar com outro nome** acima; 2) colar uma URL conhecida abaixo."

Mostra a query exata que falhou — diretoria entende imediatamente.

### 6. Diagnóstico estendido

Telemetria já existe; adicionar no painel diagnóstico (Collapsible "Diagnóstico da pesquisa"):
- "Queries enviadas:" com a lista das 4-7 strings que foram para o Firecrawl
- "Round 1 → 0 / Round 2 → 12" 

Assim qualquer falha futura é debugável sem precisar ler logs do servidor.

## Arquivos editados

- `supabase/functions/enrich-customer/index.ts`
  - Nova `buildSmartQueries()` (sanitização + nome curto + sem aspas no nome longo)
  - Aceita `search_override` no body
  - Loop com 2 rounds antes de desistir
  - Telemetria registra as queries que rodaram e em qual round vieram resultados
- `src/components/customers/EnrichmentPanel.tsx`
  - Aviso "Buscando como X" quando o nome tem caracteres de risco
  - Botão + input "Buscar com outro nome"
  - Lista de queries no diagnóstico
  - Mensagem de erro mostra a query que falhou
- `src/hooks/use-customers.ts`
  - `useEnrichCustomer` aceita `{ id, search_override? }` em vez de só `id`

Sem mudança de schema, sem chave nova.

## Validação após o fix

Reenrico Anglo American, Andrade Gutierrez e Alya — esperado:
- Round 1 com nome longo: 0
- Round 2 com nome curto: ≥10 URLs
- Pelo menos 2 fontes verificadas (sites oficiais + LinkedIn)
- Painel mostra os dados extraídos com badges de evidência

Se ainda voltar zero em algum, a tela mostra exatamente qual string foi tentada — o usuário consegue digitar o nome certo e reverificar em 1 clique.

