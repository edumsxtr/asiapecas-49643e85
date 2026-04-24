

# Plano: Páginas indexáveis de Categoria e Modelo + ativação de conversões

Criar páginas SEO-otimizadas por categoria de peça e por modelo de máquina, com JSON-LD, breadcrumbs e CTAs alinhados ao objetivo comercial (gerar cotação B2B/B2C de itens em estoque).

## 1. Novas rotas públicas

| Rota | Conteúdo | Exemplo |
|---|---|---|
| `/cotacao/c/:slug` | Todas as peças da categoria com `stock > 0`, ordenadas por valor de estoque | `/cotacao/c/filtros` |
| `/cotacao/m/:slug` | Todas as peças compatíveis com o modelo (busca em `machine_model` + `compatible_models`) | `/cotacao/m/xe215` |
| `/cotacao/categorias` | Hub listando todas as categorias com contagem de peças em estoque | índice indexável |
| `/cotacao/modelos` | Hub listando modelos XCMG mais relevantes com contagem de peças | índice indexável |

Slugs derivados de `PART_CATEGORIES` (já em `src/components/quote/part-categories.ts`) e dos modelos distintos presentes em `parts.machine_model`/`compatible_models`.

## 2. Estrutura de cada página

```text
[Breadcrumb visual] Início > Cotação > Categoria > Filtros
[H1] Filtros para máquinas XCMG | Ásia Peças
[Subcopy comercial] 120 itens em estoque · Pronta entrega · Atendimento BR/EN/ES
[Selos confiança] Estoque real · Garantia 3 meses · WhatsApp direto
[CTA primário]   "Solicitar cotação da categoria" → abre carrinho com filtro pré-aplicado
[CTA secundário B2B] "Sou empresa / quero tabela" → B2BLeadDialog
[Grid de peças] reutiliza QuotePartCard (stock, preço, badge promo, link p/ /cotacao/p/:material)
[Bloco "Modelos compatíveis"] (em página de categoria) chips clicáveis → /cotacao/m/:slug
[Bloco "Categorias relacionadas"] (em página de modelo) chips → /cotacao/c/:slug
[FAQ curto] 3 perguntas geradas por categoria/modelo (texto crawlable)
[Rodapé padrão QuoteFooter]
```

## 3. SEO técnico por página

- **Helmet via `src/lib/seo.tsx`** já existente:
  - `title`: "Filtros XCMG · Pronta entrega · Ásia Peças & Máquinas" (≤60 chars)
  - `description`: "120 filtros originais e equivalentes para escavadeiras, pás carregadeiras e guindastes XCMG. Estoque real em Macapá-AP. Cotação rápida via WhatsApp." (≤160)
  - `canonical`: `/cotacao/c/filtros`
  - `hreflang` pt/en/es já gerado pelo helper
  - `og:image`: imagem da primeira peça em destaque OU banner padrão
- **JSON-LD compostos**:
  - `BreadcrumbList` (Início → Cotação → Categoria → slug)
  - `ItemList` com até 30 produtos da página (cada item com `@type: Product`, `sku`, `offers.availability`, `price` quando houver) — usa `productLd` já existente
  - `Organization` herdada do root
- **`noindex` automático** quando a categoria/modelo tem **0 itens em estoque** (evita criar páginas vazias indexáveis)
- Conteúdo textual (H1, subcopy, FAQ, contagem) renderizado server-friendly para crawlers via Helmet + DOM estático no primeiro paint.

## 4. Atualizações no `sitemap.xml`

Estender `supabase/functions/generate-sitemap/index.ts`:
- Adicionar entradas para cada `/cotacao/c/:slug` e `/cotacao/m/:slug` que tenha pelo menos 1 peça em estoque
- `<lastmod>` = `max(parts.updated_at)` do conjunto
- `<priority>` 0.8 para categorias, 0.7 para modelos, 0.9 para `/cotacao`, 1.0 para home
- Incluir hubs `/cotacao/categorias` e `/cotacao/modelos`

## 5. Ativação de conversões (Google Ads + GA4)

Reaproveita `src/lib/analytics.ts` e `track-conversion` já existentes. Adições:

| Ponto da jornada | Evento GA4 | Conversão Ads | Onde |
|---|---|---|---|
| Abrir página de categoria/modelo | `view_item_list` (`item_list_id` = slug) | — | nova página, no mount |
| Clicar em peça | `select_item` | — | card |
| Adicionar ao carrinho | `add_to_cart` | — | já existente |
| Enviar cotação | `begin_checkout` + `purchase` (sem valor monetário) | **Conversão "Lead — Cotação"** | `QuoteCart` ao salvar `quote_requests` |
| Enviar form B2B | `generate_lead` | **Conversão "Lead B2B"** (peso maior) | `B2BLeadDialog` |
| Click "WhatsApp" / "Solicitar tabela" | `contact` | **Conversão "Contato WhatsApp"** | botão CTA |
| Scroll 75% da página de categoria | `scroll_75_category` | — | listener |

- Nova ação em `track-conversion`: aceitar `event` ∈ `{ quote_lead, b2b_lead, whatsapp_click }` e mapear para `ads_conversion_label` distinto por evento (3 colunas extras em `vitrine_settings`: `ads_label_quote`, `ads_label_b2b`, `ads_label_whatsapp`).
- Hash SHA-256 server-side de email/telefone (Enhanced Conversions) antes de enviar ao Google Ads.
- UTM persistido (já existe `src/lib/utm.ts`) é anexado a `quote_requests.utm` e `b2b_leads.utm` — base de atribuição.

## 6. Alinhamento com objetivos da empresa + estoque

- Páginas só listam peças com `stock > 0` (foco em conversão imediata).
- Ordenação padrão: `(stock_value desc, stock desc)` — empurra primeiro itens caros e parados (ajuda a girar estoque).
- Bloco "Mais procurados em estoque" no topo (top 4 por valor) — destaque visual.
- Categoria com >50% das peças em promoção ativa ganha selo "Campanha ativa" no H1.
- Hub `/cotacao/categorias` ordena categorias por **valor total em estoque** (gestor vê o que precisa girar; cliente vê o que tem mais opções).
- CTA B2B sempre visível em página de modelo (frota = ticket alto, foco comercial).

## 7. UI admin (extensão leve em `/admin/vitrine`)

Nova aba **"SEO de categorias/modelos"**:
- Editar override de `title`/`description`/`og_image` por slug (tabela `vitrine_seo_overrides`)
- Visualizar contagem de peças em estoque por categoria/modelo
- Botão "Regerar sitemap" (chama `generate-sitemap` on-demand)
- Aba "Conversões": editar `ads_label_quote`, `ads_label_b2b`, `ads_label_whatsapp` e ver últimos eventos disparados (log simples em `conversion_events`)

## 8. Banco

| Tabela / Mudança | O quê |
|---|---|
| `vitrine_seo_overrides` (nova) | `slug text PK`, `kind text` (`category`\|`model`), `title`, `description`, `og_image`, `noindex bool`, `updated_at` |
| `vitrine_settings` | + colunas `ads_label_quote`, `ads_label_b2b`, `ads_label_whatsapp` |
| `conversion_events` (nova) | `id`, `event`, `payload jsonb`, `utm jsonb`, `sent_to_ads bool`, `created_at` — log auditável |

RLS: SELECT público para overrides; INSERT/UPDATE/DELETE só admin. `conversion_events` INSERT via edge function (service role); SELECT só admin.

## 9. Arquivos afetados

**Novos**
- `src/pages/CategoryPublicPage.tsx` (`/cotacao/c/:slug`)
- `src/pages/ModelPublicPage.tsx` (`/cotacao/m/:slug`)
- `src/pages/CategoriesIndexPage.tsx` (`/cotacao/categorias`)
- `src/pages/ModelsIndexPage.tsx` (`/cotacao/modelos`)
- `src/components/quote/CategoryHero.tsx`, `ModelHero.tsx`, `RelatedChips.tsx`, `CategoryFAQ.tsx`
- `src/lib/slugs.ts` (slugify + map categoria/modelo ↔ slug)
- `src/hooks/use-category-parts.ts`, `use-model-parts.ts`
- Migração: `vitrine_seo_overrides`, `conversion_events`, novas colunas em `vitrine_settings`

**Editados**
- `src/App.tsx`: 4 novas rotas públicas
- `src/lib/seo.tsx`: helper `itemListLd(parts)` para o JSON-LD da listagem
- `src/lib/analytics.ts`: novos eventos `view_item_list`, `contact`, `scroll_75_category`
- `supabase/functions/generate-sitemap/index.ts`: incluir categorias e modelos
- `supabase/functions/track-conversion/index.ts`: 3 labels, hash SHA-256, log em `conversion_events`
- `src/pages/AdminVitrinePage.tsx`: abas "SEO" e "Conversões"
- `src/components/quote/B2BLeadDialog.tsx` e `QuoteCart`: chamar `track-conversion` com evento correto
- `public/robots.txt`: garantir liberação de `/cotacao/c/*`, `/cotacao/m/*`, `/cotacao/categorias`, `/cotacao/modelos`

## Resultado

- ~30+ páginas novas indexáveis (uma por categoria + uma por modelo XCMG ativo) — multiplicador direto de tráfego orgânico de cauda longa ("filtro xe215", "rolamento xcmg", "peças escavadeira xcmg").
- Cada página é otimizada para **converter visita em cotação** (foco em estoque real, CTA dual B2B/B2C, JSON-LD Product para rich snippets).
- Google Ads passa a receber **3 conversões distintas** com pesos diferentes (cotação, lead B2B, WhatsApp) — permite otimizar campanhas por valor real.
- Gestor controla SEO por categoria sem código e audita conversões disparadas.
- Sitemap reflete estoque real — sem páginas vazias indexadas.

