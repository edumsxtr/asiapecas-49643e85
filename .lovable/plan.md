
## Objetivo

Reestruturar toda a área pública `/cotacao/*` para o padrão de e-commerce de autopeças (estilo Engepeças), mantendo o tema preto/amarelo/branco e a logo ÁSIA PEÇAS. O foco é layout/estrutura — o backend (catálogo, carrinho, cotação, e-mail) permanece intacto.

## Estrutura visual de referência

```text
┌──────────────────────────────────────────────────────────────┐
│ TOPBAR PRETA  vendas@asiapecas.com · (31) 99229-3767  · ▾BR  │
├──────────────────────────────────────────────────────────────┤
│ LOGO   [ 🔍 Buscar peça, código ou modelo XCMG... ] [Cart 0] │
├──────────────────────────────────────────────────────────────┤
│ AMARELO: Categorias ▾ | Modelos ▾ | Vitrine | Banners | …   │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  HERO/BANNER CAROUSEL grande (full width)   │
│  │ Mega-menu   │                                              │
│  │ Escavadeiras│                                              │
│  │ Pás         │  ──────────────────────────────────────      │
│  │ Motoniv.    │  CATEGORIAS EM DESTAQUE (6 cards quadrados) │
│  │ Compactador │  ──────────────────────────────────────      │
│  │ …           │  MAIS PROCURADAS (grid 4 col, paginado)      │
│  └─────────────┘  ──────────────────────────────────────      │
│                   POR MODELO XCMG (carrossel horizontal)      │
│                   BENEFÍCIOS (4 ícones: entrega, garantia…)   │
└──────────────────────────────────────────────────────────────┘
RODAPÉ PRETO em 4 colunas + faixa institucional amarela
```

## Mudanças por página

### 1. Header global (`QuotePage.tsx`)
- **Topbar preta fina** (já existe) — manter contatos.
- **Barra principal branca** com: logo à esquerda, **busca grande central** (input redondo com botão amarelo "Buscar"), bloco direita: "Minhas cotações" + ícone carrinho com badge.
- **Barra de navegação amarela** logo abaixo, links em preto bold uppercase: Categorias (dropdown), Modelos (dropdown), Vitrine, Banners, Promoções, Contato.
- Sticky no scroll (topbar some, navegação amarela fica).

### 2. Home `/cotacao` (`QuotePage.tsx` conteúdo)
Substituir o conteúdo atual por seções na ordem:
1. **Hero carousel** full-width (reaproveita `HeroCarousel` existente, altura maior 480px desktop).
2. **Sidebar de categorias + grid de destaques** (layout 2 colunas em desktop, full em mobile): sidebar lista categorias com contagem; conteúdo mostra 6 cards de categoria em destaque (usa `category_media`).
3. **"Mais procuradas"** — grid 4×3 de peças (reaproveita `QuotePartCard`), paginado, sem preços (já alinhado com memória).
4. **"Por modelo XCMG"** — carrossel horizontal com cards de modelo (imagem + nome).
5. **Faixa de benefícios** — 4 colunas com ícones: "Distribuidor autorizado", "Atendimento BR/VE/GY", "Garantia de origem", "Cotação em até 24h".
6. **CTA WhatsApp** — banner amarelo full-width com botão preto.

### 3. Listagens (`/cotacao/categoria/:slug`, `/cotacao/modelo/:slug`, `/cotacao/vitrine`)
- Layout 2 colunas: **sidebar filtros à esquerda** (categoria, modelo, sub-categoria) + **grid de produtos à direita** (4 col desktop, 2 mobile), paginação no rodapé. Mantém componente `QuotePartCard` sem preço.

### 4. Página de peça (`PartDetailPublicPage.tsx`)
- Layout 2 colunas: imagem grande à esquerda (galeria), à direita: nome, código, modelo compatível, descrição, botão amarelo grande "Adicionar à cotação" + botão WhatsApp.
- Abaixo: tabs "Especificações | Compatibilidade | Garantia".
- Seção "Peças relacionadas" no fim (carrossel).

### 5. Rodapé (`QuoteFooter.tsx`)
- 4 colunas: Institucional (sobre + logo), Atendimento (contatos completos com 2 telefones), Categorias (links), Legal (privacidade, garantia, devoluções).
- Faixa inferior preta com © e selos (XCMG autorizado, bandeiras BR/VE/GY).

## Design tokens (preto/amarelo/branco)

Em `src/index.css` no escopo `.quote-portal`/rotas `/cotacao`:
- `--background: 0 0% 100%` (branco como base das listagens)
- `--foreground: 0 0% 7%` (quase preto)
- `--primary: 48 100% 50%` (amarelo XCMG `#FFCC00`)
- `--primary-foreground: 0 0% 7%`
- `--secondary: 0 0% 7%` (preto institucional para header/rodapé)
- `--accent: 48 100% 50%`
- `--muted: 0 0% 96%` para faixas suaves de seção

Tipografia: manter fonte moderna já adotada (sem mudar família, já foi decidido em iteração anterior). Pesos: título 800 uppercase com tracking, corpo 400/500.

## Componentes novos / refatorados

- `src/components/quote/site/SiteHeader.tsx` — engloba topbar + barra de busca + nav amarela.
- `src/components/quote/site/CategorySidebar.tsx` — sidebar de categorias reutilizável (home + listagens).
- `src/components/quote/site/BenefitsStrip.tsx` — 4 colunas com ícones (lucide).
- `src/components/quote/site/ModelCarousel.tsx` — carrossel horizontal de modelos.
- `src/components/quote/site/SiteFooter.tsx` — substitui visualmente `QuoteFooter` (mantém props).
- `src/components/quote/site/ProductListLayout.tsx` — wrapper 2 colunas (sidebar + grid) usado pelas páginas de categoria/modelo/vitrine.

## Fora do escopo

- Nenhuma mudança em backend, RLS, edge functions, e-mail de notificação ou lógica de cotação/carrinho.
- Painel administrativo e rotas autenticadas internas (`/dashboard`, `/configuracoes`) permanecem como estão.
- Páginas legais mantêm o `LegalPageShell` atual (só herdam novo header/rodapé).
- Não mudar fontes nem paleta já aprovadas (preto/amarelo/branco).
