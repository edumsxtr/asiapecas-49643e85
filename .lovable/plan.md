

# Plano: Catálogo e-commerce + enriquecimento que realmente funciona

Resolver os 4 problemas em uma única passada: enrichment falhando, botão B2B redundante, catálogo sem cara de loja e badges internos vazando para o cliente.

## 1. Enrichment "Sem fontes públicas confirmadas" — corrigir de verdade

**Causa**: o filtro `contentMatchesCompany` exige 2 tokens distintos do nome literal na página. Para nomes curtos, comuns ou empresas pequenas isso quase nunca passa, e tudo cai como "sem fonte".

**Correções em `enrich-customer`**:
- **Mais queries direcionadas e dependentes do dado já disponível**:
  - `"<CNPJ>"` (se o cliente já tem CNPJ → vai direto a Receita/CNPJ.biz/Cnpjá)
  - `"<empresa>" "<cidade>"` 
  - `"<empresa>" telefone` / `"<empresa>" endereço`
  - `<empresa> site:linkedin.com/company`
  - `<empresa> site:gov.br` (licitações, sócios)
- **Verificação em camadas** (não tudo-ou-nada):
  - `strong`: nome literal completo aparece
  - `medium`: ≥2 tokens OU CNPJ literal aparece OU domínio do site bate com slug do nome
  - `weak`: 1 token + título da página menciona empresa → **aceito como fonte fraca** (marcado na evidência)
- **Aceitar a busca como fonte mesmo sem scrape bem-sucedido**: se a SERP do Firecrawl tem `title`/`description` que mencionam a empresa, esses metadados viram fonte de baixa confiança em vez de descartar tudo.
- **Sites confiáveis priorizados**: cnpj.biz, receita.fazenda, casadosdados.com.br, linkedin.com/company, jusbrasil → vão na frente da fila de scrape.
- **Fallback de país**: hoje fixa `country: "br"`. Usar `customer.country` para Venezuela/Guiana (mercados reais da Ásia).
- **URL manual como semente**: novo input "tenho um site/perfil dessa empresa, use como fonte" → manda direto para scrape + extração, pula a busca.
- **Mensagem clara quando falha**: distinguir "buscamos em X consultas e nada veio" vs "achamos páginas mas nenhuma menciona o nome" — UI diferente para cada caso, com sugestão de ação.

**UI em `EnrichmentPanel`**:
- Quando `confidence: low` mas existem fontes fracas → mostrar dados como "indícios não confirmados" (cinza, badge "indício") em vez de bloquear tudo.
- Botão **"Adicionar fonte manual"** (cola URL) → chama nova rota `enrich-customer-from-url`.
- Telemetria mínima na resposta: `searched_queries`, `urls_returned`, `urls_scraped_ok`, `urls_matched` — exibido em "Diagnóstico" expansível para o gestor entender por que falhou.

## 2. Catálogo com cara de e-commerce de verdade

**Hero (`QuoteHero` / `HeroCarousel`)**:
- Layout split: copy à esquerda + imagem real de máquina XCMG à direita (não bg gradient genérico)
- Busca grande com placeholder dinâmico ("Filtro de óleo XE215", "Bomba hidráulica…")
- 3 selos abaixo da busca: "✓ Estoque real" · "✓ Garantia 3 meses" · "✓ Envio nacional"
- Sem badges piscando

**Categorias como tiles visuais (não chips)**: bloco com 5 cards grandes (mineração, linha amarela, perfuratriz, guindaste, caminhão) cada um com imagem/ícone, contagem de peças em estoque, link `/cotacao/c/:slug`.

**`QuotePartCard` redesenhado como card de produto**:
```
┌─────────────────────┐
│   [imagem real ou   │
│    fallback XCMG]   │  ← aspect-square, lazy
│   [badge promoção]  │
├─────────────────────┤
│ XCMG · XE215         │  ← chip discreto modelo
│ Filtro de óleo hi…   │  ← descrição 2 linhas
│ #803164325           │  ← código pequeno
│                      │
│ R$ 1.240,00          │  ← preço grande
│ ⚡ Pronta entrega    │  ← UM badge contextual
│                      │
│ [+ Adicionar]  [👁]  │
└─────────────────────┘
```
- **Remover o badge "Verificado com IA"** e "Pesquisar com IA" do card público. Esses controles são internos — clientes não devem ver isso. A descrição enriquecida pela IA continua aparecendo na descrição do produto e na página `/cotacao/p/:material`, sem badge gritante.
- **Preço sempre visível** (já vem em `estimated_price`). Se houver `part_promotions` ativo, mostrar preço riscado + promo + % desconto + tag "OFERTA".
- **Imagem**: usar `part.image_url`; fallback elegante com logo XCMG estilizado (não o ícone Lucide aleatório atual).
- **Hover**: leve elevação + botão "Ver detalhes" sobreposto na imagem.
- **Click no card inteiro** → abre `/cotacao/p/:material` (página dedicada SEO). O botão "+" continua adicionando ao carrinho sem navegar.

**Lista (view "list")**: virar tabela tipo marketplace (imagem 60px + descrição + preço + estoque + ações), sem o badge "IA ✓".

**Strip de destaques**: já existe, ajustar visual para combinar com o novo card (mesma proporção de imagem).

## 3. Botão "Sou empresa" redundante — repensar

**Hoje**: FAB flutuante em `bottom-44 right-6`, conflita visualmente com WhatsApp FAB e ConsentBanner.

**Solução**:
- **Remover o FAB flutuante**.
- Adicionar um link sutil **"Sou empresa / Comprar para frota"** no header (próximo ao WhatsApp), abre o mesmo dialog.
- Adicionar uma **faixa B2B** dedicada no meio do catálogo (entre Featured e Catalog), discreta, contextual: "Compra recorrente ou frota? Receba tabela exclusiva." com 1 botão "Falar com consultor" → mesmo dialog.
- Em **páginas de modelo** (`/cotacao/m/:slug`), manter CTA B2B em destaque (frota = ticket alto), mas como banner inline, não FAB.

## 4. Limpeza de elementos internos no público

- **Remover badge "IA Verificado"** e botão "Pesquisar com IA" do `QuotePartCard` e da view list. Esses são controles operacionais; mover para a tela interna `/catalog`.
- **Remover badge "Pesquisado"** equivalente que aparece em alguns lugares públicos.
- A descrição técnica gerada pela IA continua aparecendo, só sem o selo que confunde o cliente.
- Em `PartDetailPublicPage` (já existente): manter o bloco "Descrição técnica" sem dizer "IA"; chamar de **"Especificações técnicas"**.

## 5. Arquivos afetados

**Editados**
- `supabase/functions/enrich-customer/index.ts` — verificação em camadas, queries por CNPJ, sites confiáveis, fallback de país, telemetria
- `supabase/functions/prospect-search/index.ts` — mesma flexibilização de matching e país do cliente
- `src/components/customers/EnrichmentPanel.tsx` — exibir indícios fracos, input de URL manual, painel diagnóstico
- `src/hooks/use-customers.ts` — novo hook `useEnrichFromUrl`
- `src/components/quote/QuotePartCard.tsx` — redesign e-commerce, remover badges IA, preço prominente, imagem real
- `src/components/quote/QuoteCatalog.tsx` — view list sem badge IA, aplicar novo card
- `src/components/quote/QuoteHero.tsx` — layout split + selos + tiles de categoria
- `src/components/quote/FeaturedStrip.tsx` — alinhar visual aos cards novos, mostrar preço
- `src/components/quote/B2BLeadDialog.tsx` — remover FAB, virar componente exposto via prop `triggerSlot`
- `src/pages/QuotePage.tsx` — link B2B no header, faixa B2B inline, remover FAB B2B
- `src/pages/PartDetailPublicPage.tsx` — renomear "Descrição técnica" → "Especificações técnicas", remover menção IA
- `src/pages/CategoryPublicPage.tsx` / `ModelPublicPage.tsx` — usar novo card

**Novo**
- `supabase/functions/enrich-customer-from-url/index.ts` — recebe `customer_id` + `url`, scrapa direto, extrai e mescla na enrichment_data existente.

## Resultado

- Enrichment passa a retornar dados úteis na maioria dos casos (CNPJ, LinkedIn, site, telefone) ou explica claramente o que tentou e como o gestor pode ajudar (URL manual).
- Catálogo público parece uma loja: imagem, preço grande, 1 badge contextual, ação clara.
- Sem badges internos vazando ("IA Verificado", "Pesquisar IA") na frente do cliente.
- Botão B2B integrado ao header e ao fluxo do catálogo, sem FAB redundante competindo com WhatsApp.

