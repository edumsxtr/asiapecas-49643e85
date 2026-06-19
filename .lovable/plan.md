## Objetivo

Refinar o Portal do Cliente (`/cotacao`) deixando-o estritamente preto, amarelo e branco, sem emojis, e com tipografia mais moderna e institucional alinhada à logo Ásia Peças.

## 1. Remover emojis do portal

- `src/lib/subcategory-rules.ts` — remover o mapa `SUBCATEGORY_ICONS` (todas as entradas com emoji). Substituir o export por um helper `getSubcategoryIcon(sub)` que devolve um ícone vetorial do `lucide-react` (ex.: `Cog`, `Droplet`, `Zap`, `Wrench`, `CircleDot`, `Gauge`, `Snowflake`, `Battery`, `Lightbulb`, `Filter`, `Package`) com fallback `Package`.
- `src/components/quote/CategoryShowcase.tsx` — trocar o `<div className="text-3xl">{emoji}</div>` por `<Icon className="h-6 w-6 text-primary" />` usando o helper. Remover a legenda secundária do título (deixar apenas "Peças que você encontra aqui" sem subtítulo/contagem decorativa? — manter apenas o título do bloco, conforme pedido: "retire das legendas do peças que você encontra aqui"). Remover o parágrafo `{cnt} {partsLabel}` dos tiles.
- `src/components/quote/CategoryGroupedView.tsx` — mesma troca do emoji por ícone Lucide.
- Nenhum outro arquivo do portal contém emoji (varredura confirmada).

## 2. Tipografia mais moderna (logo Ásia)

- `src/index.css`:
  - Trocar o import do Google Fonts para `Manrope` (400–800) como corpo e `Sora` (500–800) como display — pareamento geométrico e técnico que combina com o lettering reto da logo Ásia. Manter `Space Grotesk` removido das referências hardcoded.
  - `body { font-family: 'Manrope', sans-serif; }`
  - `h1..h6 { font-family: 'Sora', sans-serif; letter-spacing: -0.01em; }`
  - Adicionar utilitário `.font-display { font-family: 'Sora', sans-serif; }`.
- Substituir todas as ocorrências de `font-['Space_Grotesk']` no portal (`QuotePage.tsx`, `CategoryShowcase.tsx`, e demais componentes em `src/components/quote/*`) por `font-display`.
- `CategoryShowcase.tsx` "Marcas compatíveis": aumentar peso e tracking — `text-[11px] font-display font-semibold uppercase tracking-[0.2em] text-foreground/70` no rótulo, e cada chip em `font-display font-semibold tracking-wide text-sm bg-white border border-foreground/15 text-foreground`.

## 3. Tema preto, amarelo e branco

Em `src/index.css` (apenas tokens `:root` — modo claro do portal):

- `--background: 0 0% 100%`  (branco puro)
- `--foreground: 0 0% 8%`     (preto)
- `--card: 0 0% 100%`
- `--muted: 0 0% 96%` / `--muted-foreground: 0 0% 35%`
- `--border: 0 0% 90%` / `--input: 0 0% 90%`
- `--secondary: 0 0% 8%` / `--secondary-foreground: 0 0% 100%` (header preto)
- `--primary: 45 100% 50%` / `--primary-foreground: 0 0% 8%` (amarelo Ásia, mantido)
- `--accent: 45 100% 50%` / `--accent-foreground: 0 0% 8%`
- `--ring: 45 100% 50%`

Remover o tom bege quente atual (`40 20% 97%`) que destoa do branco. Não alterar tokens do modo `.dark` (usado no painel admin).

## 4. Limpezas visuais coerentes com o tema

- `QuotePage.tsx`:
  - Faixa B2B (`bg-gradient-to-r from-primary/10 via-primary/5 to-transparent`) → `bg-foreground text-background` com botão amarelo. Remove o degradê colorido.
  - Botão flutuante WhatsApp e CTA mobile: trocar `bg-[hsl(142,71%,45%)] text-white` por `bg-primary text-primary-foreground` para manter a paleta preto/amarelo/branco.
- `CategoryShowcase.tsx`: trust strip com `bg-white border border-foreground/10` em vez de `bg-muted/40`; ícones em círculo `bg-primary text-primary-foreground`.

## Fora de escopo

- Tradução EN/ES de novos rótulos (mantém as strings existentes).
- Alteração de páginas internas/admin, blog ou páginas legais.
- Refatoração do `HeroCarousel`/`FeaturedStrip` além das trocas de fonte e cor já implícitas via tokens.

## Detalhes técnicos

Arquivos modificados:
- `src/index.css`
- `src/lib/subcategory-rules.ts`
- `src/components/quote/CategoryShowcase.tsx`
- `src/components/quote/CategoryGroupedView.tsx`
- `src/pages/QuotePage.tsx`

Nenhum arquivo novo, nenhuma migração de banco, nenhuma mudança em edge functions.
