

# Plano: Implementar Clientes, Vendas e Pós-Venda

## Banco de Dados — 3 novas tabelas

### `customers` (Clientes)
- `id`, `name`, `company`, `cnpj_cpf`, `email`, `phone`, `address`, `city`, `state`, `segment` (mineração/construção/etc), `notes`, `created_at`, `updated_at`
- RLS: leitura e escrita pública (sem auth implementado)

### `sales` (Vendas)
- `id`, `customer_id` (FK customers), `sale_date`, `status` (orçamento/confirmado/faturado/cancelado), `total_amount`, `payment_method`, `payment_terms`, `notes`, `created_at`
- Tabela filha `sale_items`: `id`, `sale_id` (FK sales), `part_id` (FK parts), `quantity`, `unit_price`, `total_price`
- RLS: leitura e escrita pública

### `after_sales` (Pós-Venda)
- `id`, `sale_id` (FK sales), `customer_id` (FK customers), `type` (garantia/devolução/reclamação/suporte), `status` (aberto/em andamento/resolvido/fechado), `description`, `resolution`, `priority` (baixa/média/alta/urgente), `created_at`, `resolved_at`
- RLS: leitura e escrita pública

## Páginas e Componentes

### `/clientes` — CRM de Clientes
- Listagem com busca por nome/CNPJ/empresa
- Botão "Novo Cliente" abre dialog com formulário
- Tabela com colunas: nome, empresa, CNPJ, segmento, telefone, email
- Click na linha abre detalhe com histórico de compras e tickets pós-venda
- KPIs: total clientes, novos este mês, por segmento

### `/vendas` — Gestão de Vendas
- Listagem de vendas com filtro por status e período
- Botão "Nova Venda" com formulário: selecionar cliente, adicionar itens (busca peças do catálogo), quantidade, preço
- Cálculo automático do total
- Status visual com badges coloridos (orçamento=cinza, confirmado=azul, faturado=verde, cancelado=vermelho)
- KPIs: total vendas mês, valor total, ticket médio, conversão orçamento→venda

### `/pos-venda` — Gestão Pós-Venda
- Listagem de tickets com filtro por tipo, status e prioridade
- Botão "Novo Ticket" com formulário: selecionar cliente/venda, tipo, prioridade, descrição
- Timeline de resolução
- KPIs: tickets abertos, tempo médio resolução, por tipo

## Sidebar
- Já tem os links para `/clientes`, `/vendas`, `/pos-venda` — trocar de ComingSoonPage para as novas páginas

## Hooks
- `useCustomers()` — CRUD clientes
- `useSales()` — CRUD vendas + items
- `useAfterSales()` — CRUD tickets pós-venda

## Detalhes Técnicos
- Migration: CREATE TABLE customers, sales, sale_items, after_sales + RLS
- ~6 novos componentes de página + dialogs de formulário
- Reutiliza padrões existentes (Card, Table, Badge, Dialog, Form)

