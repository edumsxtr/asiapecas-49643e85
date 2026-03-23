

# Corrigir Dados e Alinhar com a Planilha Original

## Problema Identificado
A planilha original tem **20.436 linhas**, mas nosso banco tem apenas **15.298 registros**. Na importação anterior, linhas duplicadas (mesmo código de material com saldos diferentes) foram descartadas em vez de somadas. Resultado:

| Métrica | Planilha Real | Nosso Banco | Diferença |
|---------|--------------|-------------|-----------|
| SKUs (linhas) | 20.436 | 15.298 | -5.138 |
| Unidades | 498.022 | 398.687 | -99.335 |
| Valor Estoque | ~R$ 204.9M | R$ 153.5M | -R$ 51.4M |

## Plano de Correção

### 1. Re-importar todos os dados da planilha
- Processar as 20.436 linhas do Excel via script
- Para materiais duplicados: **somar os saldos** e usar o **maior preço** (ou média ponderada)
- Manter o material como identificador único, mas com estoque consolidado correto
- Resultado esperado: 15.298 materiais únicos com **498.022 unidades** e **~R$ 204.9M** em valor

### 2. Atualizar KPIs do Dashboard (estilo da imagem de referência)
Reorganizar os 4 KPIs principais no topo para espelhar o layout mostrado:
- **Total SKUs**: 20.436 (contagem de linhas originais) + subtítulo com unidades em estoque
- **Valor do Estoque**: R$ 204.9M + preço médio
- **Vendas 24/25**: placeholder (sem dados de vendas ainda, será preenchido com o CRM)
- **Capital Imobilizado**: valor de estoque parado >2 anos + % do total + quantidade de SKUs

### 3. Atualizar função get_dashboard_stats()
- Recalcular todos os totais com os dados corrigidos
- Adicionar campo `totalSkuRows` (20.436 — contagem de linhas originais da planilha)
- Adicionar campo `capitalImobilizado` com % e contagem de SKUs parados

### 4. Manter todas as análises existentes
- Gráficos por categoria, fabricante, modelo e tempo continuam funcionando
- Tabelas de alertas (estoque crítico e parado) com dados atualizados

## Detalhes Técnicos
- Script Python para reprocessar o Excel e gerar SQL de UPDATE com saldos corrigidos
- Migration para atualizar os registros existentes (UPDATE stock e estimated_price)
- Atualização da RPC `get_dashboard_stats` para incluir novos KPIs
- Refatoração visual dos cards de KPI no `DashboardPage.tsx`

