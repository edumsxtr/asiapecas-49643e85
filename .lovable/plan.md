## Problema

Ao expandir o detalhe de uma venda em `/vendas` (e nas mesmas listas em Clientes), os itens aparecem comprimidos, sem espaçamento, e não há como editar/excluir linha a linha nem navegar quando há muitos itens.

## O que será feito

### 1. Visual — espaçamento dos itens expandidos
- Envolver a tabela de itens em um container com borda, fundo neutro e padding (`rounded-lg border bg-card p-4`).
- Aplicar padding vertical maior nas linhas (`py-3`), separadores entre linhas, header com fundo `muted/40`, fonte um pouco maior e colunas alinhadas (Qtd centralizado, valores à direita com `tabular-nums`).
- Cabeçalho da seção com título "Itens da venda" + contador e total ao lado.
- Mesmo tratamento na aba "Propostas / Orçamentos" do cliente.

### 2. CRUD de itens da venda
Dentro do dialog de detalhe da venda, cada linha ganha um menu de ações:
- **Editar**: abre um pequeno popover/dialog com quantidade, preço unitário e garantia (override). Recalcula `total_price` e o `total_amount` da venda.
- **Excluir**: confirma e remove o item; atualiza o total da venda.
- **Adicionar item**: botão "Adicionar item" abre busca de peça (mesmo seletor já usado no gerador de proposta) e insere uma nova linha.

Tudo via hooks novos (`use-sale-items`) usando as tabelas `sale_items` / `sales` já existentes — sem alterar schema.

### 3. Paginação dos itens
- Quando a venda tiver mais de **10 itens**, mostrar paginação simples (Anterior / Página X de Y / Próxima) abaixo da tabela.
- Tamanho de página configurável (10 / 25 / 50) num pequeno seletor.
- Paginação puramente client-side (os itens já vêm carregados com a venda).

### 4. Aplicar o mesmo padrão em outras telas
- `CustomerProposalsTab` (histórico de propostas do cliente): mesmo container com margem + paginação client-side de 10 por página na lista de propostas.
- `SalesPage` lista principal: já tem paginação? Se não, adicionar paginação de 20 vendas por página.

## Detalhes técnicos

- Arquivos afetados (frontend apenas):
  - `src/pages/SalesPage.tsx` — refator do bloco `detailSale` (linhas ~186-209), adicionar paginação na lista principal se faltar.
  - `src/components/sales/SaleItemsTable.tsx` *(novo)* — tabela reutilizável com CRUD + paginação.
  - `src/components/sales/SaleItemEditDialog.tsx` *(novo)* — dialog de edição/criação de item.
  - `src/hooks/use-sale-items.ts` *(novo)* — `addItem`, `updateItem`, `deleteItem` (atualiza `total_amount` da venda em transação simples via update somado).
  - `src/components/customers/CustomerProposalsTab.tsx` — aplicar mesmo wrapper visual + paginação.
- Sem migrações: `sale_items` e `sales` já têm as colunas necessárias.
- Sem alteração no PDF / proposta institucional.

## Fora de escopo

- Alterar a geração do PDF da proposta.
- Mudar cálculo de margem/preço (continua usando markup global).
- Histórico de auditoria das edições de item.
