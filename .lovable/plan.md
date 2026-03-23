

# Plano: CRUD Completo + Carrinho de Pedidos + Melhorias

## Gaps identificados

### CRUD incompleto
- **Clientes**: falta edição (só tem criar e deletar, sem botão editar)
- **Vendas**: falta deletar venda, visualizar detalhes da venda, editar itens
- **Pós-Venda**: falta deletar ticket, editar descrição/resolução
- **Catálogo/Estoque**: sem edição inline de peças

### Funcionalidades ausentes
- **Carrinho/Montagem de Pedidos**: o fluxo de venda atual é básico — não tem carrinho persistente, não desconta estoque, não gera número de pedido
- **Detalhes expandidos**: clicar numa venda/cliente/ticket não abre detalhes

## Implementação

### 1. CRUD Completo — Clientes
- Adicionar botão "Editar" na tabela que abre dialog com o formulário preenchido
- Reutilizar o mesmo dialog de criação, detectando se é edição ou criação
- Usar o hook `useUpdateCustomer` já existente

### 2. CRUD Completo — Vendas
- Adicionar `useDeleteSale` (já existe no hook mas não é usado na UI)
- Dialog de **detalhes da venda**: ao clicar na linha, abrir dialog mostrando cliente, itens com material/descrição/qtd/preço, total, notas
- Botão de deletar na listagem com confirmação

### 3. CRUD Completo — Pós-Venda
- Adicionar `useDeleteAfterSale` no hook
- Botão deletar na tabela
- Dialog de edição: poder alterar resolução, prioridade, tipo

### 4. Carrinho de Pedidos (Nova Rota `/pedidos/novo`)
- Fluxo completo de montagem de pedido:
  1. Selecionar cliente (ou criar novo inline)
  2. Buscar peças do catálogo e adicionar ao carrinho com quantidade
  3. Ver estoque disponível em tempo real ao lado de cada item
  4. Ajustar preços (desconto por item)
  5. Escolher condições de pagamento
  6. Resumo do pedido com subtotais
  7. Confirmar → cria venda + sale_items + desconta estoque automaticamente
- Tabela `orders` não precisa — usa `sales` com status `orcamento` → `confirmado`
- **Desconto de estoque**: ao confirmar venda (status `confirmado`), atualizar `parts.stock` via edge function para evitar race conditions

### 5. Edge Function `confirm-sale/index.ts`
- Recebe `sale_id`, valida estoque suficiente para todos os itens
- Atualiza `parts.stock` (decrementa quantidade vendida)
- Atualiza `sales.status` para `confirmado`
- Retorna erro se estoque insuficiente

### 6. Melhorias gerais
- **Sidebar**: adicionar link "Novo Pedido" com ícone de carrinho no grupo Comercial
- **Confirmação de exclusão**: dialog de confirmação antes de deletar clientes/vendas/tickets
- **Número do pedido**: adicionar coluna `order_number` (serial) na tabela `sales` para referência humana
- **Busca global na sidebar**: input de busca rápida para peças (já existe no catálogo, expor no header)

## Banco de Dados
- Migration: `ALTER TABLE sales ADD COLUMN order_number serial`
- Nova edge function: `confirm-sale/index.ts`

## Arquivos a criar/editar
- `supabase/functions/confirm-sale/index.ts` — nova edge function
- `src/pages/NewOrderPage.tsx` — página do carrinho
- `src/pages/CustomersPage.tsx` — adicionar edição
- `src/pages/SalesPage.tsx` — adicionar detalhes + delete
- `src/pages/AfterSalesPage.tsx` — adicionar delete + edição
- `src/hooks/use-sales.ts` — hook para confirmar venda
- `src/hooks/use-after-sales.ts` — adicionar delete
- `src/components/AppSidebar.tsx` — novo link
- `src/App.tsx` — nova rota

