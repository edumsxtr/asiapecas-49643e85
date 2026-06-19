
## Objetivo

1. Separar Banners e Vitrines em páginas próprias no portal `/cotacao`.
2. Substituir o fundo cinza por preto no portal.
3. Enviar automaticamente cada cotação para `vendas@asiapecas.com`.
4. Permitir imagem personalizada por categoria (configurada no admin).

---

## 1. Páginas dedicadas no portal do cliente

Hoje `QuotePage` mistura hero, banners, vitrine, catálogo e FAQ na mesma rota. Vou criar:

- `/cotacao/banners` — página pública que renderiza apenas o `HeroCarousel` (banners ativos do `vitrine_banners`) em tela cheia, com título, navegação e CTA configurados no admin.
- `/cotacao/vitrine` — página pública que lista todas as coleções de `vitrine_collections` + peças destacadas (`vitrine_featured_parts`), paginadas, sem mistura com o catálogo.
- `/cotacao` continua como home, mas com seções enxutas (hero compacto + atalhos para Banners, Vitrine, Categorias, Modelos).
- Header do portal ganha links: Banners | Vitrine | Categorias | Modelos | Minhas Cotações.

Rotas adicionadas em `src/App.tsx`. Componentes em `src/pages/portal/BannersPage.tsx` e `VitrinePage.tsx`.

## 2. Tema preto (remover cinza)

Atualizar tokens em `src/index.css`:
- `--background: 0 0% 0%` (preto puro) e `--foreground: 0 0% 100%` no escopo do portal público, ou aplicar classe `bg-black text-white` no shell do portal sem quebrar áreas internas autenticadas.
- Ajustar `--card`, `--muted` e `--border` para tons de preto/cinza-escuro mínimos somente nas páginas `/cotacao/*`.
- Revisar `QuotePage`, `QuoteFooter`, `HeroCarousel`, `CategoryShowcase`, `QuotePartCard` para usar `bg-background`/`text-foreground` no novo tema.

Painel interno (Dashboard, Configurações, etc.) permanece com o tema atual.

## 3. Envio automático de cotação por email

- Verificar/configurar domínio de email Lovable (`email_domain--check_email_domain_status`). Se não houver, abrir setup.
- Rodar `setup_email_infra` + `scaffold_transactional_email`.
- Criar template `quote-request-notification` em `supabase/functions/_shared/transactional-email-templates/` com: dados do cliente (nome, empresa, CNPJ, contato, endereço), itens solicitados (material, descrição, qtd) e observações.
- Em `QuoteCart.tsx`, após `insert` em `quote_requests` com sucesso, invocar `send-transactional-email` com `recipientEmail: "vendas@asiapecas.com"`, `templateName: "quote-request-notification"` e `idempotencyKey: quote.id`.
- Opcional: também enviar confirmação ao cliente quando ele informar email (template `quote-confirmation-customer`).

## 4. Imagem personalizada por categoria

Hoje categorias são derivadas de `parts.category` (texto livre), sem tabela própria. Plano:

- Migração: criar `public.category_media` com colunas `category` (text, PK), `image_url` (text), `headline` (text), `description` (text). GRANT padrão (`SELECT` anon/authenticated; `ALL` service_role; `INSERT/UPDATE/DELETE` apenas admin via RLS usando `has_role`).
- Reuso do bucket `vitrine` (já público) para upload das imagens.
- Admin: nova aba em `/configuracoes/banners` chamada "Categorias" listando todas as categorias distintas de `parts`, com upload de imagem + textos.
- Frontend público: `CategoryShowcase`, `CategoryHero` e `CategoryPublicPage` passam a buscar `category_media` e exibir a imagem personalizada quando existir; caso contrário, mantêm o fallback atual.

---

## Arquivos afetados (resumo)

**Novos**
- `src/pages/portal/BannersPage.tsx`, `src/pages/portal/VitrinePage.tsx`
- `src/components/admin/CategoryMediaTab.tsx`
- `src/hooks/use-category-media.ts`
- `supabase/functions/_shared/transactional-email-templates/quote-request-notification.tsx`
- Migração `category_media`

**Modificados**
- `src/App.tsx` (rotas novas)
- `src/index.css` (tema preto do portal)
- `src/pages/QuotePage.tsx`, `QuoteFooter.tsx`, `HeroCarousel.tsx`, `CategoryShowcase.tsx`, `CategoryHero.tsx`, `QuotePartCard.tsx`
- `src/components/quote/QuoteCart.tsx` (dispara email pós-insert)
- `src/pages/AdminVitrinePage.tsx` (nova aba Categorias)
- `src/pages/CategoryPublicPage.tsx` (usa imagem personalizada)

## Fora do escopo
- Mudanças no tema do painel interno autenticado.
- Edição visual das páginas legais/blog.
- Marketing/newsletters (apenas notificação transacional da cotação).
