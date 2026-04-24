

# Plano: esconder preços do catálogo público + reforçar banners/promoções

Cliente final só vê **estoque, ficha técnica e CTA "Solicitar cotação"**. Preço (e desconto em %) só aparece para usuário autenticado interno. Banners e promoções ganham um fluxo de criação mais visível e um aviso quando estão ativos.

## 1. Remover preço do catálogo público (visitantes não autenticados)

Hoje 4 lugares mostram `estimated_price` direto para o público:

| Arquivo | O que sai | O que entra |
|---|---|---|
| `QuotePartCard.tsx` | bloco "A partir de R$ X" + valor riscado promo | "Cotação sob consulta" + selo "Em promoção" (sem valor) quando há promo ativa |
| `QuoteCatalog.tsx` (modo Lista) | coluna "Preço" | coluna "Disponibilidade" (Pronta entrega / Últimas N / Sob consulta). Remover opções de ordenação `priceAsc`/`priceDesc` para o público |
| `QuoteCatalog.tsx` (Select de ordenação) | itens "Preço ↑/↓" | escondidos para visitantes |
| `QuotePartDetail.tsx` (dialog) | já não mostra preço — manter |
| `PartDetailPublicPage.tsx` | já não mostra preço — manter como está |
| `FeaturedStrip.tsx` | hoje carrega `estimated_price` no select mas não renderiza. Tirar do select. |

**Quem decide**: usar `useAuth()`. Se `user` está logado E é interno (qualquer authenticated), exibe preço normalmente (útil para vendedor demonstrando o catálogo). Se não logado → preço escondido + texto "Cotação sob consulta" + botão "Solicitar cotação".

Selo de promoção continua aparecendo (`-X% OFERTA` vira apenas **"EM PROMOÇÃO"** sem percentual para o público, com percentual quando logado). O preço promocional só renderiza para logados.

Texto multi-idioma novo em `translations.ts`:
- pt: "Cotação sob consulta" / "Em promoção"
- en: "Price on request" / "On promotion"
- es: "Precio bajo consulta" / "En promoción"

## 2. Banners — fluxo mais explícito + aviso visível

Tudo já existe em `vitrine_banners` + `AdminVitrinePage` aba "Banners", mas ninguém percebe. Mudanças:

### a) No admin (`AdminVitrinePage` → `BannersPanel`)

- Cabeçalho da aba com **passo a passo curto** ("1. Suba imagem 1920×600 · 2. Defina título e CTA · 3. Ative · 4. Aparece no topo de `/cotacao`").
- Cada `BannerCard` mostra **preview real** no tamanho do hero + selo "ATIVO" / "INATIVO" / "AGENDADO" (calculado de `starts_at`/`ends_at`).
- Botão **"Ver no site"** (abre `/cotacao` em nova aba) ao lado do "Salvar".
- Validação: bloqueia salvar se `image_url` vazio.

### b) No catálogo público

- `HeroCarousel` (já existe) renderiza no topo. Adicionar **dot navigation** quando há mais de 1 banner e **fallback gracioso** para o `QuoteHero` padrão quando não há banner ativo (já é o comportamento, só confirmar no código).
- Quando `vitrine_settings.hero_mode = 'banner'` força carrossel; quando `'hero'` força hero estático. Hoje só temos `'carousel'`. Adicionar opção no admin.

## 3. Promoções — criar do zero no admin + aviso ativo

Tabela `part_promotions` já existe e é lida em `QuotePartCard`, mas **não há UI para criar**. Hoje só dá pra inserir via SQL. Resolver:

### a) Nova aba **"Promoções"** em `AdminVitrinePage`

`PromotionsPanel`:
- Busca peça por código/descrição (igual ao `FeaturedPanel`).
- Form rápido: preço promocional, data início, data fim, ativo (switch).
- Lista de promoções ativas com: peça, preço original (interno), promo, % desconto, período, ações (pausar/excluir).
- Aviso visual quando promoção expirou (badge "Expirada").

### b) Aviso "Campanha ativa" no site público

- Quando existe **qualquer** `part_promotions.active = true` dentro do período → faixa amarela acima do hero: **"⚡ Promoções ativas — fale com nosso time para condições especiais"** com botão WhatsApp.
- Hook `useHasActivePromotions()` (TanStack Query, staleTime 5min, count head) consultado uma vez por sessão.
- Cards com promoção ativa ganham badge "EM PROMOÇÃO" (vermelho) — sem mostrar valor para o público.

### c) Preview do preço promocional

Para usuário **autenticado** (vendedor olhando o site), promo continua exibindo preço riscado + novo (comportamento atual). Para visitante, só o selo.

## 4. Pequenos polimentos

- `QuoteCatalog.tsx`: ao remover ordenação por preço para público, default vira "Mais estoque" (já é).
- `PartDetailPublicPage`: adicionar selo "EM PROMOÇÃO" se a peça tem promo ativa (consulta `part_promotions`).
- `QuotePartCard` botão principal vira **"Solicitar cotação"** (já é `tr("part.quote", lang)` — confirmar string em PT está como "Solicitar cotação", se estiver "Adicionar à cotação" trocar).

## 5. Arquivos afetados

**Editados**
- `src/components/quote/QuotePartCard.tsx` — preço gateado por auth, badge promo sem valor para público
- `src/components/quote/QuoteCatalog.tsx` — coluna Preço só para autenticados, ordenação preço escondida
- `src/components/quote/translations.ts` — novas strings PT/EN/ES
- `src/components/quote/FeaturedStrip.tsx` — remover `estimated_price` do select
- `src/pages/PartDetailPublicPage.tsx` — selo de promoção
- `src/pages/AdminVitrinePage.tsx` — passos no header, preview real, selo status, validação, nova aba Promoções
- `src/components/quote/QuoteHero.tsx` ou `QuotePage.tsx` — faixa "Campanha ativa" condicional

**Novos**
- `src/components/quote/PromoBanner.tsx` — faixa de aviso de campanha ativa
- `src/hooks/use-active-promotions.ts` — count head de promoções ativas

**Sem mudança de schema** — `part_promotions`, `vitrine_banners` e `vitrine_settings` já cobrem tudo. RLS público de `part_promotions` (SELECT) já permite a leitura.

## Resultado

- Visitante anônimo nunca vê preço — vê estoque, ficha, "Solicitar cotação" e selo de promoção (sem valor). Vendedor logado continua vendo tudo.
- Banner editável em 4 cliques no admin, com preview e status visível, apareceu/não apareceu fica óbvio.
- Promoção criável no admin pela primeira vez, com faixa de aviso no site público quando há campanha ativa.

