# Portal do Cliente → E-commerce + Blog SEO

Transformar `/cotacao` em experiência de e-commerce real, com múltiplas fotos por peça (carrossel), upload via Storage, blog gerenciável com geração automática por IA, e SEO robusto para ranqueamento.

## 1. Imagens múltiplas por peça (Storage + DB)

**Nova tabela `part_images`**
- `part_id` (FK parts), `url`, `storage_path`, `position` (ordem), `is_primary`, `alt_text`, `width`, `height`
- Índice por `part_id, position`
- RLS: leitura pública; escrita autenticado

**Bucket Storage `part-images`** (público, com cache longo)
- Estrutura: `parts/{material}/{uuid}.webp`
- Políticas: SELECT público, INSERT/UPDATE/DELETE autenticado
- Otimização: salvar como WebP, sizes responsivos (`?width=400`, `?width=800`), `loading="lazy"` + `decoding="async"`
- `image_url` legado da tabela `parts` continua como fallback (primeira imagem)

**Upload (admin)**
- Em `PartDetailDialog` e nova aba "Imagens" no detalhe da peça
- Multi-upload com drag-and-drop, reordenação, marcar principal, excluir
- Compressão client-side antes do upload (canvas → WebP)

## 2. Carrossel de imagens no portal

- `QuotePartCard`: usar primeira imagem + badge "+N fotos" se múltiplas
- `PartDetailPublicPage`: substituir imagem única por carrossel (shadcn `carousel`) com thumbnails, zoom on hover, swipe mobile
- Schema.org Product já inclui array de imagens (atualizar `productLd` em `src/lib/seo.tsx`)

## 3. Visual e-commerce no Portal do Cliente

Refinar `/cotacao` (`QuoteCatalog`, `QuotePartCard`):
- Header tipo loja: busca grande centralizada, mini-cart sticky, links Categorias / Modelos / Blog / Ofertas
- Grid mais denso, filtros laterais persistentes (categoria, modelo, faixa de preço, em estoque)
- Seção "Mais vendidos", "Novidades", "Em promoção" na home
- Trust badges (entrega, garantia, pagamento) no footer
- Breadcrumbs em todas as páginas
- Manter idioma (PT/EN/ES) já existente

## 4. Blog

**Tabelas**
- `blog_posts`: `slug`, `title`, `excerpt`, `content_md`, `cover_url`, `cover_storage_path`, `author_id`, `status` (draft/published), `published_at`, `tags[]`, `related_part_ids[]`, `related_category`, `seo_title`, `seo_description`, `views`
- `blog_categories`: `slug`, `name`, `description`
- RLS: leitura pública só de `status='published'`; CRUD autenticado

**Bucket Storage `blog-images`** (público)

**Rotas públicas**
- `/blog` — lista paginada, filtro por categoria/tag
- `/blog/:slug` — post completo com SEO completo (Article JSON-LD, OG, canonical), peças relacionadas no rodapé
- `/blog/categoria/:slug`

**Admin (`/configuracoes/blog`)**
- CRUD posts com editor markdown (preview), upload de capa, seleção de peças relacionadas, agendamento, SEO override
- Lista paginada (reusa `DataPagination`)
- Botão "Gerar com IA" → abre dialog

**Geração automática por IA**
- Edge function `generate-blog-post`
  - Input: tópico OU material/categoria de peça
  - Usa Lovable AI Gateway (Gemini) com dados reais: descrição da peça, specs (`ai_compatibility_results`), modelos compatíveis, manutenção
  - Output: título SEO, slug, excerpt, conteúdo markdown estruturado (H2/H3), tags, meta description
  - Salva como `draft` para revisão antes de publicar
- Botão "Gerar 10 posts a partir do catálogo" — escolhe peças com maior estoque/valor e enfileira gerações

## 5. SEO robusto

- `react-helmet-async` já configurado? Se não, instalar e envolver app
- Por rota: title único, meta description, canonical, OG completo, Twitter card
- JSON-LD: Organization (sitewide), Product (peça), Article (blog), BreadcrumbList, FAQPage onde aplicável, ItemList nas categorias
- `sitemap.xml` via edge function `generate-sitemap` (já existe): adicionar URLs de blog e categorias de blog
- `robots.txt`: garantir Allow + Sitemap
- Performance: WebP, lazy load, preload da LCP, dimensões explícitas (evita CLS)
- URLs amigáveis com slug (já há `src/lib/slugs.ts`)
- Alt text em todas as imagens (campo no `part_images` e blog)

## 6. Performance e organização

- React Query com `staleTime` adequado para imagens e posts
- Paginação server-side em catálogo grande (já tem em parte) e blog
- Índices: `part_images(part_id, position)`, `blog_posts(status, published_at)`, `blog_posts(slug)`
- Cache HTTP nos buckets (1 ano, immutable)
- Code-splitting da rota `/blog` e admin do blog

## Detalhes técnicos

**Novas tabelas (migração)**: `part_images`, `blog_posts`, `blog_categories` — todas com GRANT + RLS.

**Novos buckets**: `part-images` (público), `blog-images` (público).

**Novas edge functions**: `generate-blog-post` (Lovable AI).

**Novos componentes**:
- `src/components/quote/PartImageCarousel.tsx`
- `src/components/admin/PartImagesManager.tsx` (multi-upload + reorder)
- `src/components/blog/BlogCard.tsx`, `BlogPostView.tsx`, `MarkdownRenderer.tsx`
- `src/pages/BlogIndexPage.tsx`, `BlogPostPage.tsx`
- `src/pages/settings/SettingsBlogPage.tsx`, `BlogPostEditor.tsx`
- `src/components/blog/AIBlogGeneratorDialog.tsx`

**Hooks**: `use-part-images`, `use-blog-posts`, `use-ai-blog-generator`.

**Rotas em `App.tsx`**: `/blog`, `/blog/:slug`, `/blog/categoria/:slug`, `/configuracoes/blog`, `/configuracoes/blog/:id`.

**Sidebar**: adicionar "Blog" sob Configurações.

**Atualizar**: `QuotePartCard` (badge multi-foto), `PartDetailPublicPage` (carrossel + Product JSON-LD com array images), `AppSidebar`, `generate-sitemap` (incluir blog).

## Fora de escopo

- Checkout real / gateway de pagamento (continua via cotação/WhatsApp)
- Comentários no blog
- Tradução automática de posts (PT apenas na v1)
- CDN externa (usa Storage público do backend já com cache)

## Execução em fases (para evitar colapso)

1. **Fase 1 — Imagens**: tabela `part_images`, bucket, manager admin, carrossel público
2. **Fase 2 — Blog base**: tabelas, rotas públicas, admin CRUD, SEO
3. **Fase 3 — IA do blog**: edge function + dialog de geração
4. **Fase 4 — Polish e-commerce**: refino visual do portal, seções home, breadcrumbs
