# Ásia Peças & Máquinas

Plataforma da **Ásia Peças & Máquinas**, distribuidora de peças e máquinas **XCMG** (Brasil, Venezuela e Guiana). O sistema reúne, no mesmo código:

- **Site público / Portal do cliente** (`asiapecas.com`) — catálogo de peças, máquinas, blog, páginas institucionais, cotação e área do cliente.
- **ERP/CRM interno** (rotas protegidas) — estoque, clientes, vendas, prospecção, relatórios, etc.

> Projeto originado no Lovable, com backend no **Supabase** (Postgres + Auth + Edge Functions). Front em **React + Vite + TypeScript + Tailwind + shadcn/ui**.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Build/dev | Vite 5 (SWC), porta dev `8080` |
| UI | React 18, TypeScript, Tailwind CSS, shadcn/ui (Radix) |
| Estado/dados | @tanstack/react-query, React Context |
| Rotas | react-router-dom v6 (lazy loading por página) |
| Backend | Supabase (`@supabase/supabase-js`) |
| Ícones/fontes | lucide-react · Archivo + IBM Plex Mono |
| Extras | recharts, jspdf, xlsx, framer-motion, react-helmet-async |

## Como rodar

```bash
npm install
cp .env.example .env      # preencha com as chaves do Supabase
npm run dev               # http://localhost:8080
npm run build             # build de produção → dist/
npm run preview           # serve o build localmente
npm run test              # vitest
npm run lint              # eslint
```

### Variáveis de ambiente (`.env`)

O cliente Supabase (`src/integrations/supabase/client.ts`) lê:

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave **anon/publishable** (pública, vai no bundle) |
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto |

> A `SERVICE_ROLE` key **nunca** vai no front — vive apenas como secret das Edge Functions no painel do Supabase. O `.env` está no `.gitignore`.

---

## Estrutura

```
src/
├─ pages/                 # páginas (lazy) — públicas e do ERP
│  ├─ legal/              # institucionais (Sobre, Contato, Privacidade, Termos…)
│  ├─ portal/             # área do cliente (login/cadastro, minhas cotações, catálogos)
│  ├─ MachineModelPage    # página de detalhe de cada máquina (data-driven)
│  └─ ModelsIndexPage     # catálogo de máquinas (/maquinas)
├─ components/
│  ├─ quote/              # site público (Header, Footer, catálogo, cards, heróis…)
│  │  └─ site/            # SiteHeader, BenefitsStrip, WhatsAppCTA
│  ├─ auth/               # ilustração da tela de login
│  ├─ legal/              # LegalPageShell (molde das páginas legais)
│  └─ ui/                 # shadcn/ui
├─ data/machines.ts       # FONTE ÚNICA das máquinas (specs, fotos, descrição)
├─ contexts/AuthContext   # auth Supabase (signIn/signUp/signOut)
├─ integrations/supabase/ # client + types gerados
├─ lib/                   # seo, slugs, utils
└─ assets/machines/       # fotos das máquinas
supabase/
├─ migrations/            # schema versionado
└─ functions/             # edge functions
```

## Rotas do site público

| Rota | Página |
|---|---|
| `/` | Home |
| `/pecas` | Catálogo de peças (filtros + busca) |
| `/maquinas` | Catálogo de máquinas (miniaturas, por categoria) |
| `/maquinas/:categoria/:slug` | Detalhe da máquina (ex.: `/maquinas/escavadeiras/xe225br`) |
| `/catalogos` | Vitrine (catálogo por máquina + peças em destaque) |
| `/blog`, `/blog/:slug` | Blog técnico |
| `/contato`, `/sobre` | Institucionais |
| `/garantia`, `/trocas-e-devolucoes`, `/politica-de-privacidade`, `/termos-de-uso`, `/politica-de-cookies`, `/seguranca-e-compliance` | Legais |
| `/portal/login` | Entrar / Criar conta (abas) |
| `/minhas-cotacoes` | Área do cliente |
| `/cotacao/c/:slug`, `/cotacao/m/:slug`, `/cotacao/p/:material` | Detalhe de categoria/modelo/peça |
| `/painel`, `/estoque`, `/clientes`, `/vendas`, … | **ERP interno** (protegido, `ProtectedRoute`) |

---

## Design System — "Concreto & Cobalto"

Direção industrial de precisão. Tokens em `src/index.css` (HSL shadcn), config em `tailwind.config.ts`.

- **Paleta:** Cobalto `#1A3C9C` (`primary`) · Grafite `#15181D` (`foreground`) · Amarelo-Cabine `#F5B400` (`accent`) · Concreto `#EEEFEA` (`background`) · Aço `#5A6473` (`muted-foreground`). Status: `success`/`warning`/`info`.
- **Regra de cor:** só tokens (`bg-primary`, `text-accent`, `text-muted-foreground`…). Nada de hex/`gray-*`/`bg-white` cru. Exceção: verde do WhatsApp `#25D366` (cor de marca).
- **Tipografia:** Archivo (display/corpo) + IBM Plex Mono (`font-mono`, para SKUs/códigos/specs). Corpo mínimo `text-xs`.
- **Raio:** `--radius = 0.25rem`. Use `rounded-lg/md/sm` (todos = 0.25rem) e `rounded-full` (pills). **Não** usar `rounded-xl/2xl`.
- **Container canônico:** `max-w-7xl mx-auto px-4 md:px-6` (leitura longa: `max-w-3xl`).
- **Cabeçalho de página (herói):** faixa clara em gradiente, compacta:
  ```
  <div className="border-b border-border bg-gradient-to-br from-primary/5 to-background">
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-7 md:py-9"> … </div>
  </div>
  ```
  h1 `text-2xl md:text-3xl font-display font-bold tracking-tight` + breadcrumb + subtítulo. Seções alternam `bg-background` / `bg-muted/40` + `border-t` para separação.

---

## Máquinas (data-driven)

Todas as máquinas vivem em **`src/data/machines.ts`** (`MACHINES`, `MACHINE_LIST`, `getMachine`). A listagem (`/maquinas`) e a página de detalhe (`MachineModelPage`) consomem essa mesma fonte.

**Adicionar uma máquina nova:**
1. Coloque a foto (fundo transparente, ~500×500) em `src/assets/machines/<slug>.png`.
2. Importe a imagem e adicione um item ao `MACHINES` com: `slug`, `model`, `name`, `category`, `categorySlug`, `tagline`, `highlights`, `specs`, `description`, `applications?`, `image`.
3. Pronto — ela aparece no catálogo e ganha a rota `/maquinas/<categorySlug>/<slug>` automaticamente.

Cadastradas hoje: **XE225BR**, **XE370BR** (escavadeiras), **XC870BR-II**, **XT870BR-I** (retroescavadeiras), **GR1803BR** (motoniveladora).

---

## Supabase

- **Migrations** versionadas em `supabase/migrations/`. Aplicar com `supabase db push`.
- **RLS:** tabelas internas exigem `is_staff()` (papel em `user_roles`); clientes do portal só acessam os próprios dados (`auth.uid()`).
- **⚠️ Migration pendente:** `20260630120000_link_portal_customers.sql` — vincula o cadastro do portal à tabela `customers` (via trigger em `auth.users`, lendo o `user_metadata` enviado no signup) e libera o cliente a ler/editar o próprio registro. **Precisa ser aplicada** (`supabase db push`) para os cadastros virarem clientes do CRM.

---

## Deploy (Vercel)

Config em `vercel.json` (preset **Vite**, `outputDirectory: dist`, **rewrites de SPA** para as rotas client-side funcionarem em produção).

**Passos:**
1. Importe o repositório `edumsxtr/asiapecas-49643e85` na Vercel (ou faça push para a `main` se o projeto já estiver conectado — deploy automático).
2. **Environment Variables** (Production + Preview): defina `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_SUPABASE_PROJECT_ID` (valores do seu `.env`).
3. Build Command `npm run build` · Output `dist` (já no `vercel.json`).
4. Domínio: apontar `asiapecas.com` para a Vercel.

> Lembrete: aplicar a migration pendente do Supabase (acima) para o fluxo de cadastro do portal ficar completo em produção.
