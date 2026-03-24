

# Plano: Autenticação + Separação Portal Público vs Sistema Interno

## Situação Atual

- `/cotacao` — portal do cliente (deve continuar **público**, sem login)
- Todas as outras rotas (`/`, `/catalogo`, `/estoque`, `/clientes`, `/vendas`, etc.) — sistema operacional interno, atualmente **sem proteção nenhuma**
- Dados sensíveis de clientes, vendas, prospects estão acessíveis a qualquer pessoa que acesse as URLs
- Não existe autenticação no sistema

## O que vou fazer

### 1. Página de Login (`/login`)

- Formulário com email + senha (design com cores da marca Elite Peças)
- Opções: Login e Cadastro (com abas)
- Validação de email obrigatória (sem auto-confirm — o usuário precisa verificar o email)
- Página de recuperação de senha (`/reset-password`)
- Logo Elite Peças no topo

### 2. Contexto de Autenticação (`AuthContext`)

- Provider que escuta `onAuthStateChange` do backend
- Verifica sessão ativa
- Expõe `user`, `loading`, `signIn`, `signUp`, `signOut`

### 3. Componente de Rota Protegida (`ProtectedRoute`)

- Wrapper que verifica se há usuário autenticado
- Se não autenticado, redireciona para `/login`
- Mostra loading enquanto verifica sessão

### 4. Separação de Rotas no `App.tsx`

**Rotas públicas** (sem login):
- `/cotacao` — portal do cliente
- `/login` — login/cadastro
- `/reset-password` — redefinir senha

**Rotas protegidas** (exigem login):
- `/` — Dashboard
- `/catalogo`, `/estoque`, `/clientes`, `/vendas`, `/pos-venda`
- `/pedidos/novo`, `/prospeccao`, `/pesquisa-mercado`
- `/assistente`, `/relatorio`, `/configuracoes`

### 5. Botão Logout no Sidebar

- Adicionar botão "Sair" no rodapé do sidebar
- Ao clicar, faz logout e redireciona para `/login`

### 6. RLS — Proteger dados sensíveis

As tabelas `customers`, `sales`, `prospects`, `after_sales` atualmente permitem acesso público (SELECT/INSERT/UPDATE/DELETE para `{public}`). Vou restringir para apenas usuários autenticados:

- `customers` — SELECT/INSERT/UPDATE/DELETE apenas para `authenticated`
- `sales` — SELECT/INSERT/UPDATE/DELETE apenas para `authenticated`
- `sale_items` — SELECT/INSERT/UPDATE/DELETE apenas para `authenticated`
- `prospects` — SELECT/INSERT/UPDATE/DELETE apenas para `authenticated`
- `after_sales` — SELECT/INSERT/UPDATE/DELETE apenas para `authenticated`
- `prospection_campaigns` — SELECT/INSERT/UPDATE/DELETE apenas para `authenticated`
- `market_research` — SELECT/INSERT/UPDATE/DELETE apenas para `authenticated`
- `stock_imports` / `stock_import_items` — apenas `authenticated`

Tabelas que continuam públicas:
- `parts` — SELECT público (o portal do cliente precisa ler)
- `quote_requests` — INSERT público (cliente envia cotação sem login)
- `ai_compatibility_results` — SELECT público (portal do cliente usa)

## Arquivos a criar/editar

| Arquivo | Ação |
|---------|------|
| `src/pages/LoginPage.tsx` | Criar — login/cadastro com email+senha |
| `src/pages/ResetPasswordPage.tsx` | Criar — redefinir senha |
| `src/contexts/AuthContext.tsx` | Criar — provider de autenticação |
| `src/components/ProtectedRoute.tsx` | Criar — wrapper de rota protegida |
| `src/App.tsx` | Editar — envolver rotas internas com ProtectedRoute |
| `src/components/AppSidebar.tsx` | Editar — adicionar botão Sair |
| Migration SQL | Atualizar RLS — restringir tabelas sensíveis para `authenticated` |

## Banco de Dados

Migration para atualizar as policies RLS das tabelas sensíveis, trocando `{public}` por `{authenticated}` em SELECT/INSERT/UPDATE/DELETE.

