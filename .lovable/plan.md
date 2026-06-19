## Objetivo

Quando alguém pesquisar **asiapecas.com** no Google, o resultado deve abrir o **Portal do Cliente** (catálogo público de cotação), não a tela de login. O login continua existindo, mas apenas para uso interno da equipe.

## Causa do problema atual

Hoje a rota `/` está protegida e cai no Dashboard interno. Quem não está logado é redirecionado para `/login`. Como o Google indexa `asiapecas.com` (raiz), o que ele encontra é a tela de login.

## Mudanças

### 1. Rotas
- `/` passa a renderizar o **Portal do Cliente** (mesma página de `/cotacao`).
- `/cotacao` continua funcionando (redireciona para `/`) para não quebrar links antigos.
- Dashboard interno muda para `/painel` (protegido por login).
- `/login` redireciona para `/painel` após autenticação.
- Sidebar interna passa a apontar "Dashboard" para `/painel`.

### 2. Metadados (index.html)
- `canonical` e `og:url` apontando para `https://asiapecas.com/`.
- Título e descrição já são do portal (sem alteração).

### 3. SEO técnico
- `robots.txt`: adicionar `Disallow: /painel` e trocar o `Sitemap:` para `https://asiapecas.com/sitemap.xml`.
- `sitemap.xml`: gerar com base `https://asiapecas.com` e listar `/` como rota principal (prioridade 1.0), além de `/cotacao/categorias`, `/cotacao/modelos`, `/cotacao/vitrine`, `/blog` e páginas institucionais.
- Breadcrumbs já apontam para `/` — continuam corretos.

### 4. Comunicação interna
- A equipe acessa o sistema digitando `asiapecas.com/login` ou `asiapecas.com/painel` (o link público do portal não muda).

## Fora de escopo
- Layout do portal (já feito anteriormente).
- Mudanças no backend, RLS ou edge functions.
- Alterações no fluxo de carrinho, cotação ou autenticação.

## Resultado esperado

Após a próxima reindexação do Google (24–72h), buscar "asiapecas.com" mostra o portal público com título "Peças XCMG originais e compatíveis | Ásia Peças & Máquinas" e leva direto ao catálogo, não ao login.
