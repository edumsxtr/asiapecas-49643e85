

# Plano: Sistema de Importação Rápida + Multi-Planilha + Filtros Avançados

## Problema Atual

1. **Importação lenta e com erros**: o sistema faz 1 chamada HTTP por peça (20k chamadas = timeout). A planilha tem 20.436 linhas mas o banco mostra 461k unidades em vez de 498k
2. **Sem rastreio de planilha/filial**: todas as peças vão para a mesma tabela sem saber de qual planilha vieram
3. **Filtros limitados**: só filtra por categoria (mineração, etc.) e busca textual. Falta filtrar por modelo, fabricante, faixa de preço, tempo parado
4. **Referências não atualizam**: compatibilidades da IA não são atualizadas automaticamente ao importar

## Solução

### 1. Nova tabela `stock_imports` (rastreio de planilhas)

Cada planilha importada vira um registro:
- `id`, `file_name`, `imported_at`, `total_rows`, `total_stock`, `total_value`, `status` (processando/completo/erro), `source_label` (ex: "Filial Pouso Alegre", "Estoque Central")

### 2. Nova tabela `stock_import_items` (dados brutos por planilha)

Preserva os dados originais de cada planilha separadamente:
- `id`, `import_id` (FK stock_imports), `material`, `description`, `stock`, `estimated_price`, `machine_model`, `manufacturer`, `supplier`, `last_entry_time`, categorias booleanas

### 3. Reescrever importação — Edge Function `import-catalog`

Em vez de 20k chamadas individuais pelo frontend, o fluxo será:
1. Frontend lê o XLSX com SheetJS e converte para JSON
2. Envia JSON inteiro para edge function `import-catalog` (uma única chamada)
3. Edge function usa `SUPABASE_SERVICE_ROLE_KEY` para:
   - Criar registro em `stock_imports`
   - Inserir todos os itens em `stock_import_items` em batch (usando `.insert()` com array de até 1000 por vez)
   - Atualizar tabela `parts`: agregar todos os `stock_import_items` por material (somando estoques de todas as planilhas) e atualizar `parts.stock`, `parts.estimated_price`
   - Para materiais novos (que não existem em `parts`), inserir automaticamente
4. Retorna relatório: inseridos, atualizados, erros

Isso reduz de 20k chamadas para 1 chamada. Tempo estimado: 5-15 segundos.

### 4. Sincronizar dados da planilha atual

Executar a importação da planilha `Peças_Valor_estimado-2.xlsx` usando a nova edge function para corrigir os totais (461k -> 498k unidades, R$ 188M -> R$ 205M+).

### 5. Filtros avançados no Catálogo

Adicionar ao `CatalogContent.tsx`:
- **Por máquina/modelo**: dropdown com todos os modelos únicos do banco
- **Por fabricante**: dropdown com fabricantes únicos
- **Por faixa de preço**: slider ou seletor (0-1k, 1k-10k, 10k-50k, 50k-100k, 100k+)
- **Por tempo parado**: badges clicáveis (6-12 meses, 1-2 anos, >2 anos)
- **Ordenação**: por preço, estoque, valor total, nome

Atualizar `useParts` hook para aceitar esses filtros como parâmetros.

### 6. Página de Gestão de Planilhas

Nova seção na página de Estoque (ou tab) mostrando:
- Lista de planilhas importadas (data, nome, total de itens, valor)
- Botão "Importar Nova Planilha" (usa a nova edge function)
- Botão "Ver itens" para cada planilha
- Visão consolidada (soma de todas as planilhas)

### 7. Auto-atualizar referências ao importar

Ao finalizar importação, disparar atualização de `compatible_models` em `parts`:
- Agrupar por material e concatenar todos os modelos únicos encontrados em `stock_import_items`
- Atualizar o campo `compatible_models` de cada peça

### 8. Exportar catálogo com referências IA

O `ExportCatalogButton` já existe e funciona. Garantir que inclui dados de `ai_compatibility_results` na exportação (já implementado).

## Banco de Dados

- CREATE TABLE `stock_imports` + RLS pública
- CREATE TABLE `stock_import_items` + RLS pública + FK para stock_imports

## Arquivos a criar/editar

- **Migration SQL**: criar tabelas `stock_imports` e `stock_import_items`
- `supabase/functions/import-catalog/index.ts` — nova edge function (importação em massa)
- `src/components/catalog/ImportCatalogDialog.tsx` — reescrever para usar edge function + campo "fonte/filial"
- `src/components/catalog/CatalogContent.tsx` — adicionar filtros avançados
- `src/hooks/use-parts.ts` — aceitar novos filtros (modelo, fabricante, preço, tempo)
- `src/pages/StockPage.tsx` — adicionar seção de planilhas importadas
- `src/hooks/use-stock-imports.ts` — novo hook para gestão de importações

