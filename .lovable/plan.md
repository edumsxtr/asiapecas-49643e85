

# Plano: Relatório Executivo + Explicação 20k vs 15k + Alinhamento com Plano de Negócios

## Por que 15.298 e não 20.436

A planilha tem **20.436 linhas**, mas muitos materiais se repetem (mesmo código, modelos diferentes). Ao agrupar por código de material, restam **~15.298 materiais únicos**. Os estoques das linhas repetidas são somados. Isso precisa ser explicado claramente no app.

## O que vou fazer

### 1. Nova página `/relatorio` — Relatório Executivo Interativo

Uma página estilo apresentação corporativa que explica toda a operação, conectada ao plano de negócios. Seções:

**Slide 1 — Visão Geral da Empresa**
- Nome: Lopes & Lopes — Distribuidor XCMG
- Missão, segmentos atendidos (Mineração, Linha Amarela, Perfuratriz, Caminhão Elétrico, Guindaste)
- Mercados: Brasil (todos os estados), Venezuela, Guiana

**Slide 2 — Inventário: 20.436 linhas → 15.298 materiais únicos**
- Card explicativo com infográfico: "A planilha original contém 20.436 registros. Muitos materiais aparecem em múltiplas linhas (diferentes modelos de máquina, filiais ou lotes). Ao consolidar por código de material, existem 15.298 materiais únicos."
- Tabela exemplo: mostrar um material que aparece 2-3x na planilha com estoques diferentes
- Totais consolidados: ~498k unidades, ~R$ 205M+
- Dados puxados em tempo real do banco

**Slide 3 — Análise por Categoria**
- Gráficos de categorias (Mineração, Linha Amarela, etc.) com valores e percentuais

**Slide 4 — Análise por Tempo de Estoque**
- Capital parado > 2 anos, giro de estoque

**Slide 5 — Estrutura de Vendas**
- Pipeline: Prospecção IA → Prospect → Cliente → Orçamento → Venda → Pós-venda
- KPIs de vendas, clientes, tickets

**Slide 6 — Expansão Internacional**
- Mapa conceitual: estados BR + Venezuela + Guiana
- Prospects por país/região

**Slide 7 — Plano de Ação**
- Próximos passos alinhados ao plano de negócios
- Metas de conversão, redução de estoque parado

### 2. Atualizar Dashboard
- Adicionar card "Relatório Executivo" com link para `/relatorio`
- Mostrar claramente "15.298 materiais únicos (de 20.436 linhas na planilha)"

### 3. Sidebar
- Adicionar link "Relatório" no menu

## Arquivos a criar/editar

- `src/pages/ReportPage.tsx` — nova página com relatório estilo apresentação
- `src/App.tsx` — adicionar rota `/relatorio`
- `src/components/AppSidebar.tsx` — adicionar link "Relatório"
- `src/components/dashboard/DashboardPage.tsx` — ajustar label de SKUs para explicar 20k vs 15k

