## Objetivo

Elevar o portal Ásia Peças & Máquinas a um padrão institucional/corporativo, com identidade visual alinhada ao logo (preto + amarelo, tipografia sóbria), gestão própria de banners e cobertura completa das páginas que o Google espera para ranqueamento e confiança (E-E-A-T).

---

## 1. Identidade visual institucional

Refinar o design system para transmitir solidez (peças pesadas, mineração, frota):

- Paleta ajustada em `src/index.css`:
  - `--background` branco quente, `--foreground` quase-preto (#0B0B0C)
  - `--secondary` preto institucional (#111214) usado no header/footer
  - `--primary` amarelo Ásia calibrado (HSL fechado) para CTAs e detalhes
  - Tokens novos: `--gradient-institutional`, `--shadow-card-strong`, `--border-strong`
- Tipografia: manter Space Grotesk para títulos, trocar corpo para "Inter Tight" ou "DM Sans" com tracking levemente apertado; criar utilitário `.font-display` e `.font-body`
- Remover qualquer emoji do código (header, FAQ, footer, traduções, banners promo, chat, WhatsApp pills) e substituir por ícones `lucide-react` quando fizer sentido
- Revisar tom dos textos em `src/components/quote/translations.ts` para linguagem corporativa, sem expressões de marketing exagerado nem marcações típicas de IA ("Vamos lá", "Claro!", "Aqui está", "Em resumo", listas com bullets decorativos)
- Header e footer reestilizados em versão institucional: barra superior fina com contato/idiomas, barra principal com logo + navegação + CTA, footer em três colunas (Empresa, Catálogo, Atendimento) + selo de CNPJ/endereço

## 2. Gestão de banners (vitrine)

Já existe a tabela `vitrine_banners` e `HeroCarousel.tsx` consumindo-a. Falta a UI de administração:

- Novo CRUD em **Configurações → Vitrine / Banners** (`/configuracoes/banners`):
  - Listagem paginada (usa `DataPagination`)
  - Upload de imagem para bucket `vitrine-banners` (criar bucket privado + URLs assinadas longas, padrão já adotado)
  - Campos: título, subtítulo, CTA label, CTA link, idioma (pt/en/es/all), ordem, datas início/fim, ativo
  - Pré-visualização do banner no formato real do carrossel
- Hook `use-vitrine-banners.ts` com CRUD
- Entrada no `SettingsPage.tsx` no card "Operações" (ou novo card "Conteúdo")
- Banners institucionais default (3 peças) gerados via `imagegen` com a estética nova caso a tabela esteja vazia

## 3. Páginas institucionais exigidas pelo Google (E-E-A-T)

Criar páginas públicas reais (não placeholders), com SEO completo (Helmet + JSON-LD adequado), todas linkadas no footer e no `sitemap.xml`:

- `/sobre` — História, missão, estrutura, fotos do galpão, números (anos de mercado, SKUs, clientes atendidos)
- `/contato` — Endereço, telefone, WhatsApp, e-mail, formulário (grava em `quote_requests` com tipo `contact`), mapa estático, horário comercial; JSON-LD `LocalBusiness`
- `/politica-de-privacidade` — LGPD: dados coletados, finalidade, base legal, direitos do titular, DPO/contato
- `/termos-de-uso` — Uso do portal, propriedade intelectual, limitações, foro
- `/politica-de-cookies` — Categorias de cookies, consentimento (integra com `ConsentBanner`)
- `/trocas-e-devolucoes` — Política comercial (peças, garantia, prazos)
- `/garantia` — Política de garantia das peças
- `/entrega-e-frete` — Cobertura, prazos, modais
- `/faq` — versão dedicada (hoje só existe seção embutida)

Implementação:

- Componente `InstitutionalLayout` reutilizável (breadcrumb + container + tipografia editorial)
- Cada página com `<SEO>` (title <60, description <160, canonical, OG) e BreadcrumbList JSON-LD
- Conteúdo redigido em português institucional, sem emojis e sem padrões de IA

## 4. SEO técnico complementar

- `index.html`: title/description institucionais, Organization JSON-LD ampliado (logo, endereço, telefones, sameAs vazio por enquanto), `theme-color` preto
- `public/robots.txt`: manter `Allow: /`, adicionar `Sitemap:` apontando para `https://asiapecas.lovable.app/sitemap.xml`
- `supabase/functions/generate-sitemap`: incluir as novas rotas institucionais + `/blog`, `/cotacao`, categorias e modelos já existentes
- `WebSite` JSON-LD com `SearchAction` no `QuotePage`
- Garantir `<h1>` único por página, `alt` em todas as imagens, `loading="lazy"` em imagens fora do fold

## 5. Limpeza de "linguagem de IA" e emojis

- Varredura em `src/components/quote/translations.ts`, `PromoBanner`, `B2BLeadDialog`, `QuoteChat`, `BlogHighlightStrip`, `FeaturedStrip`, `QuoteHero`, `CategoryShowcase`, `QuoteFAQ`, `QuoteFooter`
- Remover emojis (🇧🇷, ⚡, 🚚, ✅, 🔥 etc.) — substituir por ícones lucide
- Reescrever microcopy em tom B2B sóbrio: frases curtas, voz ativa, sem "Vamos", "Aqui você encontra", "Confira!", sem bullets com check decorativo
- Prompt do `generate-blog-post` ajustado para proibir emojis, listas decorativas, abertura/encerramento típicos de IA e exigir tom técnico-editorial

---

## Detalhes técnicos

**Novos arquivos**
- `src/components/layout/InstitutionalLayout.tsx`
- `src/components/layout/SiteHeader.tsx`, `SiteFooter.tsx` (versões institucionais reutilizáveis)
- `src/hooks/use-vitrine-banners.ts`
- `src/pages/settings/SettingsBannersPage.tsx`
- `src/pages/institutional/AboutPage.tsx`, `ContactPage.tsx`, `PrivacyPage.tsx`, `TermsPage.tsx`, `CookiesPage.tsx`, `WarrantyPage.tsx`, `ReturnsPage.tsx`, `ShippingPage.tsx`, `FAQPage.tsx`
- Migração SQL: bucket `vitrine-banners` (privado) + policies; ajuste de RLS em `vitrine_banners` se necessário para writes autenticados

**Arquivos modificados**
- `src/index.css`, `tailwind.config.ts` (tokens institucionais)
- `index.html` (metadata sitewide + Organization LD ampliado)
- `src/App.tsx` (novas rotas)
- `src/components/quote/translations.ts` e demais componentes do `/cotacao` (remoção de emojis, tom institucional)
- `src/components/quote/QuoteFooter.tsx` (links institucionais)
- `src/pages/SettingsPage.tsx` (card de Banners)
- `supabase/functions/generate-sitemap/index.ts` (novas URLs)
- `supabase/functions/generate-blog-post/index.ts` (prompt anti-emoji/anti-IA)
- `public/robots.txt`

**Fora de escopo**
- Redesenhar páginas internas (Dashboard, Vendas, Estoque) — foco é o portal público e a área de configurações relacionada
- Internacionalizar as novas páginas institucionais (ficam em PT no primeiro corte; estrutura preparada para i18n futuro)
- Integração com Google Search Console / verificação de domínio
