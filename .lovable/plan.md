

# Plano: Catálogo interativo + SEO/Ads ready (B2B & B2C)

Transformar `/cotacao` em uma loja de fato pronta para receber tráfego pago e orgânico, com áreas administráveis (banners, destaques, ofertas), SEO técnico avançado e tracking pronto para Google Ads.

## 1. Áreas administráveis no portal (sem editar código)

Nova tela interna **`/admin/vitrine`** (protegida) onde o gestor controla o que aparece no `/cotacao`:

- **Banners do hero** (carrossel): imagem, título, subtítulo, CTA, link (categoria/peça/URL externa), prioridade, datas de início/fim, idioma
- **Peças em destaque** (até 12, ordenáveis): seleciona itens do catálogo com badge customizável ("Promoção", "Novo", "Pronta entrega")
- **Coleções/seções temáticas** (ex.: "Kit revisão XCMG XE215", "Filtros mais vendidos"): nome, descrição, lista de peças, ícone, ordem
- **Ofertas/preço promocional** opcional por peça (preço de origem + preço promocional + validade) — exibido com tag "OFERTA"
- **Mensagens-âncora B2B** ativáveis: "Compra para frota?", "Solicitar tabela", "Atendimento corporativo" → abre formulário ou WhatsApp dedicado

Ferramentas: tabela com drag-and-drop para reordenar, upload direto de imagem (Storage), preview ao vivo do hero, toggle "publicar/despublicar".

## 2. Catálogo `/cotacao` mais interativo

- **Hero com carrossel de banners** dinâmicos (substitui o hero estático). Mantém busca + categorias.
- **Seção "Destaques"** logo abaixo do hero, scroll horizontal com as peças destacadas
- **Seções temáticas** (coleções) em blocos visuais distintos antes do catálogo principal
- **Preço visível** quando disponível, com tag de promoção e desconto %
- **URL compartilhável** para cada peça (`/cotacao/p/:material`) com Open Graph dinâmico → permite anunciar peças específicas no Google Ads
- **URLs amigáveis para categorias** (`/cotacao/c/filtros`, `/cotacao/m/xe215`) para SEO e remarketing por interesse
- **CTA secundário B2B**: botão fixo "Sou empresa / quero tabela" → formulário curto (CNPJ, segmento, volume estimado)
- **Selo de confiança** (estoque real, anos no mercado, atendimento brasileiro/inglês/espanhol)

## 3. SEO técnico avançado

- **Renderização SEO-friendly via Vite SSG** para `/cotacao`, páginas de peça e categoria — gera HTML estático no build com meta tags, JSON-LD e conteúdo crawlable. (Alternativa leve: pré-render somente as rotas públicas listadas via `vite-plugin-prerender` ou `vite-ssg`. Sem impacto nas rotas internas autenticadas.)
- **Meta tags dinâmicas** por rota (title, description, canonical, hreflang pt/en/es) via `react-helmet-async`
- **JSON-LD `Product`** por peça (nome, código, marca, disponibilidade, preço, breadcrumb) + `BreadcrumbList` + `Organization` + `LocalBusiness` no root
- **`sitemap.xml` dinâmico** (edge function `generate-sitemap`) listando todas as peças com estoque + categorias + páginas estáticas, com `<lastmod>` real. Atualizado sob demanda + cron diário.
- **`robots.txt`** atualizado: liberar tudo público, bloquear `/clientes`, `/vendas`, `/admin/*`, `/login`, apontar sitemap
- **Open Graph dinâmico**: imagem da peça (ou banner padrão), título e descrição reais
- **Performance Core Web Vitals**: lazy-load imagens (`loading="lazy"`, `decoding="async"`), `preconnect` ao Supabase, fontes com `font-display: swap`, code-splitting já existe via React Router
- **i18n SEO**: rotas com sufixo `?lang=en` indexáveis via `<link rel="alternate" hreflang="...">`
- **Breadcrumbs visuais** (Início > Categoria > Peça)

## 4. Tracking & Google Ads ready

- **Google Tag Manager** (GTM) injetado no `index.html` com ID configurável via `vitrine_settings.gtm_id` (tabela admin)
- **Eventos GA4 padronizados** (Enhanced Ecommerce):
  - `view_item_list` (catálogo), `view_item` (detalhe), `select_item`, `add_to_cart`, `begin_checkout` (envio de cotação), `generate_lead` (form B2B)
- **Conversão Google Ads** disparada no envio de cotação e no formulário B2B (server-side via edge function `track-conversion` com Conversion API para precisão pós-iOS)
- **Pixel Meta** opcional (mesmo schema)
- **UTM persistence**: captura `utm_*` no primeiro acesso, anexa em todo lead/cotação salvo (coluna `utm` jsonb em `quote_requests`) — atribuição confiável
- **`consent banner` LGPD** simples (necessário para Ads/Analytics na UE/BR), com toggle para analytics

## 5. Banco e edge functions

| Tabela / Função | O quê |
|---|---|
| `vitrine_banners` | id, image_url, title, subtitle, cta_label, cta_link, lang, sort_order, active, starts_at, ends_at |
| `vitrine_featured_parts` | id, part_id, badge_label, badge_color, sort_order, active |
| `vitrine_collections` | id, name, slug, description, icon, sort_order, active |
| `vitrine_collection_parts` | collection_id, part_id, sort_order |
| `part_promotions` | part_id, promo_price, starts_at, ends_at |
| `vitrine_settings` | gtm_id, ga4_id, ads_conversion_id, meta_pixel_id, b2b_whatsapp, hero_mode |
| `b2b_leads` | nome, empresa, cnpj, segmento, volume, telefone, email, utm jsonb, created_at |
| `quote_requests` | + coluna `utm jsonb` |
| Edge `generate-sitemap` | gera XML dinâmico (público) |
| Edge `track-conversion` | recebe evento, chama Google Ads API server-side com hashing de email/telefone |
| Bucket Storage `vitrine` | imagens de banner (público read) |

RLS:
- `vitrine_*` e `part_promotions`: SELECT público; INSERT/UPDATE/DELETE só `authenticated` com role admin (usar tabela `user_roles` existente)
- `b2b_leads`: INSERT público anônimo; SELECT só admin

## 6. Storage de imagens de peça (oportunidade rápida)

Catálogo hoje sem foto = baixa conversão. Adicionar:
- Coluna `parts.image_url` (já pode existir? checar migrações), upload via tela admin
- Placeholder consistente com identidade Ásia quando ausente
- Imagens otimizadas automaticamente (Storage transform)

## 7. Arquivos afetados (resumo)

**Novos**
- `src/pages/AdminVitrinePage.tsx` + componentes `vitrine/*` (banners, destaques, coleções, ofertas, settings)
- `src/pages/PartDetailPublicPage.tsx` (rota `/cotacao/p/:material`)
- `src/pages/CategoryPublicPage.tsx` (`/cotacao/c/:slug`)
- `src/components/quote/HeroCarousel.tsx`, `FeaturedStrip.tsx`, `CollectionBlock.tsx`, `B2BLeadDialog.tsx`, `ConsentBanner.tsx`
- `src/lib/seo.tsx` (helper Helmet + JSON-LD), `src/lib/analytics.ts` (eventos GA4/Ads), `src/lib/utm.ts`
- `supabase/functions/generate-sitemap/index.ts`, `supabase/functions/track-conversion/index.ts`
- `vite.config.ts` ajustado para pré-render rotas públicas

**Editados**
- `src/App.tsx`: novas rotas públicas + `/admin/vitrine`
- `src/pages/QuotePage.tsx`: usa novos componentes (carrossel, destaques, coleções)
- `src/components/quote/QuoteCatalog.tsx`: integra promoções + URLs amigáveis
- `src/components/quote/QuotePartCard.tsx`: badge promo, link para detalhe público
- `index.html`: GTM, hreflang base, fontes preconnect, meta refinadas
- `public/robots.txt`: bloqueia rotas internas, aponta sitemap
- `src/components/AppSidebar.tsx`: link "Vitrine" para admin

## 8. Entregáveis em 3 fases (sugestão)

1. **Fase 1 (essencial para Ads)**: rotas amigáveis, meta dinâmica, JSON-LD, sitemap, robots, GTM + GA4 + conversão Ads, UTM persistence, consent banner
2. **Fase 2 (vitrine editável)**: banco vitrine + tela admin + carrossel/destaques/coleções no portal
3. **Fase 3 (B2B + imagens)**: formulário B2B com tracking, ofertas/preços promo, upload de imagens de peça, pré-render SSG

## Resultado esperado

- Gestor controla banners, destaques e ofertas sem pedir mudanças no código
- Cada peça tem URL própria, indexável, compartilhável e anunciável no Google Ads
- Google Ads recebe conversões reais (cotação enviada + lead B2B), com atribuição via UTM
- SEO técnico no padrão de e-commerce (sitemap, JSON-LD Product, breadcrumbs, hreflang, Core Web Vitals)
- Portal pronto para tráfego B2C (busca/peça avulsa) **e** B2B (formulário corporativo + WhatsApp dedicado), com conformidade LGPD básica

