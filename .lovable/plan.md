## Importação XCMG — 20.958 itens

Planilha: `Referência de Preços XCMG - estoque atual 28-05-26 (3).xlsx`
Colunas detectadas: Material, Descrição, Saldo Atual, Preço Revenda, Preço Consumidor Final.

### O que vou fazer

1. **Schema (migration)** — adicionar coluna `consumer_price numeric` na tabela `parts` para armazenar o "Preço Consumidor Final". O `estimated_price` continua sendo o Revenda (custo/base de markup, conforme regra atual de pricing).

2. **Importação direta via SQL** (sem passar pela UI):
   - Copiar XLSX → CSV → tabela temporária via `COPY`.
   - Criar registro em `stock_imports` com `source_label = "XCMG Estoque 28-05-2026"`, `file_name` da planilha.
   - Inserir 20.958 linhas em `stock_import_items` (em lotes).
   - Agregar por `material` (soma saldo, máx. preço) e fazer **UPSERT** na tabela `parts`:
     - `stock` = saldo
     - `estimated_price` = Preço Revenda
     - `consumer_price` = Preço Consumidor Final
     - `manufacturer` = "XCMG" (padrão, já que a planilha é XCMG)
     - `description` sanitizada
   - Marcar import como `completo` com totais finais.

3. **Atualizar o ImportCatalogDialog** para também ler a coluna "Preço Estimado como referência para Consumidor Final" em futuras importações pela UI.

### Decisões assumidas
- Fonte: **"XCMG Estoque 28-05-2026"** (você não respondeu — confirme se quer outro rótulo).
- Fabricante: **XCMG** aplicado a todos os itens.
- Itens existentes (mesmo `material`): **atualizados** com novos preço/estoque; novos itens são inseridos.

### Resultado esperado
- ~20.958 materiais únicos no catálogo com ambos preços disponíveis.
- Registro rastreável em `stock_imports` + `stock_import_items` para auditoria.
- Margem padrão (30%) continua aplicada sobre `estimated_price` (Revenda) na tela de Vendas; `consumer_price` fica disponível para exibição/comparação.

Confirme para eu executar.