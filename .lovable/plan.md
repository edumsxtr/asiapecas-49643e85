

# Corrigir Dados do Estoque — Updates em Lote

## Situação Atual
| Métrica | Banco Atual | Meta (Planilha) | Gap |
|---------|------------|-----------------|-----|
| Materiais únicos | 15.298 | 15.298 | ✅ OK |
| Unidades | 429.347 | 498.022 | -68.675 |
| Valor Total | R$ 166.8M | ~R$ 205M | -R$ 38M |

O problema: para materiais duplicados na planilha, o import original pegou apenas uma linha em vez de **somar os saldos** de todas as linhas.

## Plano de Execução

### 1. Reprocessar Excel via Python
- Ler todas as 20.436 linhas do Excel com pandas
- Para cada material único: **somar todos os Saldos** e usar o **maior Preço Estimado**
- Gerar os comandos SQL de UPDATE para cada um dos 15.298 materiais

### 2. Executar Updates em Lotes via psql
- Usar o insert tool (que suporta UPDATE) para aplicar as correções em lotes de ~500 registros
- Validar após cada lote que os totais estão convergindo para os valores da planilha

### 3. Validação Final
- Query para confirmar: ~498k unidades e ~R$ 205M em valor total
- Verificar que o dashboard reflete os KPIs corretos

### 4. Atualizar Dashboard
- Adicionar campo `totalSkuRows` (20.436) ao `get_dashboard_stats()` para mostrar total de linhas da planilha
- Atualizar o `DashboardPage.tsx` para exibir os 4 KPIs principais no estilo da referência:
  - Total SKUs (20.436) com unidades em estoque
  - Valor do Estoque (~R$ 205M)
  - Capital Imobilizado (estoque parado >2 anos com % do total)
  - Estoque Crítico

## Detalhes Técnicos
- Python + pandas para processar o Excel e gerar SQL
- psql insert tool para executar os UPDATEs (não migration)
- Migration apenas para atualizar a função `get_dashboard_stats()` com novo campo `totalSkuRows`
- Atualização do `DashboardPage.tsx` e `use-parts.ts` para os novos KPIs

