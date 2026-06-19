# Portal Institucional, Banners e Páginas Exigidas pelo Google

Reorganização do portal `/cotacao` com identidade visual mais alinhada à marca Ásia (preto + amarelo), gestão de banners reativada dentro de **Configurações**, remoção de emojis e criação das páginas institucionais que o Google espera para ranquear (E-E-A-T).

## 1. Gestão de Banners (já existe, falta reexpor)

A tabela `vitrine_banners` e o `HeroCarousel` já estão prontos. O que falta é dar acesso ao admin depois que removemos "Vitrine" do menu.

- Mover `AdminVitrinePage` para dentro do hub **Configurações** como nova rota `/configuracoes/banners`.
- Adicionar card "Banners da Vitrine" em `SettingsPage` na seção *Dados & Conteúdo*.
- Manter `/admin/vitrine` redirecionando para a nova rota (compatibilidade).
- Upload das imagens vai para o bucket `part-images` (reaproveitado) em pasta `banners/`, com URL assinada de longa duração — mesmo padrão das fotos de produto.

## 2. Redesign Institucional do Portal `/cotacao`

Objetivo: visual mais sóbrio, corporativo, transmitindo confiança de distribuidor autorizado. Sem emojis em nenhum lugar.

**Identidade visual (tokens em `index.css`)**
- Paleta principal: preto profundo (`--secondary`), amarelo Ásia como acento (`--primary`), neutros quentes para fundos institucionais.
- Adicionar `--brand-deep` (preto carvão), `--brand-gold` (amarelo refinado), `--surface-elevated` (off-white), `--shadow-institutional` (sombra sutil, sem brilho colorido).
- Tipografia: manter Space Grotesk para títulos, mas reduzir peso/escala — menos "startup", mais "institucional". Body em Inter (já existe).

**Header**
- Remover bandeiras-emoji do seletor de idioma; substituir por códigos textuais (`PT | EN | ES`) com indicador sutil.
- Adicionar barra superior fina com: CNPJ, "Distribuidor Autorizado XCMG", telefone direto — passa credibilidade imediata.
- Logo maior, sem `rounded-lg` (logo institucional não fica em cartão).

**Hero**
- Substituir gradiente atual por composição mais corporativa: foto industrial em preto e branco com overlay preto translúcido + faixa amarela fina.
- Selos de confiança logo abaixo do hero: "Distribuidor Autorizado", "Peças Originais XCMG", "Atendimento Brasil/Venezuela/Guiana", "Garantia de Fábrica" — em linha sóbria, sem cards coloridos.

**Seções do portal**
- Remover qualquer emoji em `QuoteHero`, `CategoryShowcase`, `FeaturedStrip`, `QuoteFAQ`, `BlogHighlightStrip`, `QuoteChat`, `ConsentBanner`.
- Trocar microcopy informal por linguagem institucional (ex.: "Monte seu pedido" → "Solicitação de Cotação", "Tire suas dúvidas" → "Perguntas Frequentes").
- Footer ganha bloco institucional: razão social, CNPJ, endereço completo, links para páginas legais.

## 3. Páginas Institucionais Exigidas pelo Google (E-E-A-T)

Criar as páginas que ranqueamento orgânico de B2B normalmente exige. Todas com `<Helmet>` (title, description, canonical, JSON-LD adequado) e link no footer.

| Rota | Conteúdo | Schema |
|---|---|---|
| `/sobre` | Quem somos, missão, história, atuação em 3 países, parceria XCMG | `AboutPage` + `Organization` |
| `/contato` | Telefones, WhatsApp, e-mail, endereços, formulário simples, mapa estático | `ContactPage` + `LocalBusiness` |
| `/politica-de-privacidade` | LGPD: dados coletados, finalidade, base legal, direitos do titular, DPO, cookies | `PrivacyPolicy` (WebPage) |
| `/termos-de-uso` | Uso do portal, cotações não vinculantes, propriedade intelectual, foro | `WebPage` |
| `/politica-de-cookies` | Cookies essenciais x analytics, opt-out, link para ConsentBanner | `WebPage` |
| `/garantia` | Política de garantia de peças originais XCMG, prazos, exclusões | `WebPage` |
| `/trocas-e-devolucoes` | Procedimento, prazos, condições | `WebPage` |
| `/seguranca-e-compliance` | Boas práticas, anti-fraude, canal de denúncias | `WebPage` |

Conteúdo redigido em PT-BR institucional, sem placeholders genéricos — usar dados reais da marca (Ásia Peças & Máquinas, atuação Brasil/Venezuela/Guiana, distribuidor XCMG, contatos já existentes). Onde faltar dado específico (CNPJ, endereço completo, nome do DPO), uso texto neutro indicando "Disponível mediante solicitação via [contato]" para evitar inventar fatos.

**Sitemap & robots**
- Adicionar todas as novas rotas em `supabase/functions/generate-sitemap/index.ts`.
- `robots.txt` já permite tudo — nada a mudar.

**Footer**
- Nova coluna "Institucional" com links para Sobre, Contato, Garantia, Trocas.
- Nova coluna "Legal" com Privacidade, Termos, Cookies, Compliance.

## 4. Remoção de Emojis e "linguagem de IA"

Varrer e limpar:
- Bandeiras emoji em `QuotePage` (`LANG_FLAGS`).
- Emojis em microcopy de `QuoteHero`, `CategoryShowcase`, `FeaturedStrip`, `BlogHighlightStrip`, `QuoteFAQ`, `QuoteChat`, `ConsentBanner`.
- Frases típicas de IA ("Vamos lá!", "Que tal...", "Incrível!", "✨", "🚀") em qualquer copy do portal e do blog gerado.
- Atualizar prompt da função `generate-blog-post` para exigir tom institucional jornalístico, proibir emojis, exclamações excessivas, frases de venda agressivas e marcadores típicos de IA.
- Atualizar prompt do `chat` para responder em tom corporativo, sem emojis.

## Detalhes Técnicos

**Arquivos novos**
- `src/pages/legal/AboutPage.tsx`, `ContactPage.tsx`, `PrivacyPage.tsx`, `TermsPage.tsx`, `CookiesPage.tsx`, `WarrantyPage.tsx`, `ReturnsPage.tsx`, `CompliancePage.tsx`
- `src/components/quote/InstitutionalTopBar.tsx` (barra superior com CNPJ + tel)
- `src/components/quote/TrustBadges.tsx` (selos de confiança)
- `src/components/quote/LegalFooterLinks.tsx` (extensão do footer)

**Arquivos modificados**
- `src/index.css` — novos tokens institucionais
- `src/App.tsx` — rotas novas + redirect `/admin/vitrine` → `/configuracoes/banners`
- `src/pages/SettingsPage.tsx` — card de Banners
- `src/components/quote/HeroCarousel.tsx`, `QuoteHero.tsx`, `QuoteFooter.tsx`, `CategoryShowcase.tsx`, `FeaturedStrip.tsx`, `BlogHighlightStrip.tsx`, `QuoteFAQ.tsx`, `QuoteChat.tsx`, `ConsentBanner.tsx` — limpeza de emojis e copy institucional
- `src/pages/QuotePage.tsx` — substituir `LANG_FLAGS` por códigos textuais, inserir `InstitutionalTopBar` e `TrustBadges`
- `src/components/quote/translations.ts` — strings novas para selos/legal/copy institucional
- `supabase/functions/generate-sitemap/index.ts` — incluir páginas legais
- `supabase/functions/generate-blog-post/index.ts` — prompt sem emojis, tom institucional
- `supabase/functions/chat/index.ts` — mesmo ajuste de tom

**Sem mudanças**
- Não mexer em `client.ts`, `types.ts`, `.env`, `config.toml`.
- Não criar nova tabela: `vitrine_banners` e bucket `part-images` já cobrem banners.
- Não tocar em lógica de cotação, carrinho, pricing ou catálogo.

## Fora de Escopo

- Tradução das páginas legais para EN/ES (só PT-BR nesta entrega; menu de idiomas continua afetando portal mas legais ficam PT-BR como é padrão jurídico brasileiro).
- Redesign completo do dashboard interno.
- Sistema de consentimento de cookies granular (mantemos o `ConsentBanner` atual, só limpo).
