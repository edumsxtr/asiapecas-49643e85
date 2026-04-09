

# Plano: Corrigir Carrinho, Filtros e Envio de Pedidos no Portal do Cliente

## Problemas Identificados

1. **Carrinho perde dados ao atualizar a página** -- O carrinho usa `useState` local no `QuotePage.tsx`, sem persistência
2. **Filtros por tipo de peça não funcionam** -- Apenas 194 de 15.298 peças têm `part_category` preenchido no banco; os filtros retornam quase nada
3. **Pedido enviado "não vai para lugar nenhum"** -- A tabela `quote_requests` recebe o insert corretamente, mas nenhuma tela interna exibe esses pedidos. O usuário quer que apareçam na **página de Vendas**

---

## Solução

### 1. Persistir carrinho no backend (nova tabela `cart_sessions`)

- Criar tabela `cart_sessions` com colunas: `id`, `session_id` (texto, gerado no navegador e salvo em localStorage), `items` (jsonb), `created_at`, `updated_at`
- RLS: INSERT e UPDATE públicos (portal sem login), SELECT público filtrado por `session_id`
- No frontend, gerar um `session_id` UUID no primeiro acesso e salvá-lo em `localStorage`
- Cada alteração no carrinho (add/remove/qty) faz upsert na tabela `cart_sessions`
- Ao carregar a página, buscar o carrinho pela `session_id`

### 2. Categorizar peças em massa no banco (regras determinísticas)

- Executar um UPDATE SQL direto usando `CASE WHEN description ILIKE '%filtro%' THEN 'Filtros'` etc. para as 15.104 peças sem categoria
- Mapear ~20-30 palavras-chave por categoria para cobrir a maioria das peças
- Peças que não casarem com nenhuma regra receberão `'Acessórios e Outros'` como fallback
- Isso resolve imediatamente o filtro por tipo de peça sem depender da edge function de IA

### 3. Conectar cotações à página de Vendas

- Na tabela `quote_requests`, adicionar coluna `converted_sale_id` (uuid, nullable) para rastrear conversão
- Criar uma aba ou seção "Cotações Recebidas" na `SalesPage.tsx` listando pedidos de `quote_requests` com status `pendente`
- Botão "Converter em Orçamento" que cria um registro em `sales` + `sale_items` e marca o `quote_request` como `convertido`
- Isso integra o fluxo público com o fluxo comercial interno

### 4. Corrigir traduções do footer/chat (ainda referencia "Elite Peças")

- Atualizar `translations.ts` para usar "Ásia Peças & Máquinas" em vez de "Elite Peças XCMG"

---

## Arquivos Afetados

| Arquivo | Ação |
|---|---|
| `supabase/migrations/new.sql` | Criar tabela `cart_sessions` + add `converted_sale_id` em `quote_requests` |
| `src/pages/QuotePage.tsx` | Integrar persistência do carrinho via `cart_sessions` |
| `src/components/quote/QuoteCart.tsx` | Upsert no backend ao modificar carrinho |
| `src/pages/SalesPage.tsx` | Adicionar aba "Cotações Recebidas" com listagem e conversão |
| `src/components/quote/translations.ts` | Corrigir referências a "Elite Peças" |
| SQL de dados (insert tool) | UPDATE em massa para categorizar ~15k peças por palavras-chave |

