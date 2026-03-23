

# Plano: Corrigir Dados + Ferramenta de Pesquisa de Mercado + IA de Compatibilidade

## Parte 1: Executar Updates de Estoque (Dados)

O banco ainda tem valores desalinhados com a planilha original (faltam ~68k unidades e ~R$ 38M).

- Processar o Excel com Python/pandas para calcular totais consolidados por material (somar saldos, usar maior preço)
- Gerar e executar SQL UPDATEs em lotes de ~200 registros via insert tool (psql)
- Validar que os totais chegam a ~498k unidades e ~R$ 205M

## Parte 2: Ferramenta de Pesquisa de Mercado

Nova tabela e interface para rastrear preços de concorrentes por peça.

### Banco de Dados
- Criar tabela `market_research` com colunas:
  - `part_id` (FK para parts), `distributor_name`, `price_found`, `delivery_days`, `payment_terms`, `availability` (em estoque/sob encomenda), `source_url`, `notes`, `researched_at`, `researched_by`
- RLS: leitura pública, escrita para autenticados

### Interface
- Dentro do diálogo de detalhe da peça (`PartDetailDialog`), adicionar aba "Pesquisa de Mercado" mostrando:
  - Tabela com preços encontrados em outros distribuidores
  - Formulário para adicionar novo registro (distribuidor, preço, prazo, condições)
  - Comparativo visual: nosso preço vs. mercado (maior/menor/média)
  - Indicador de competitividade (se estamos acima ou abaixo da média)
- Nova página `/pesquisa-mercado` no sidebar com visão consolidada:
  - Peças sem pesquisa de preço realizada
  - Peças onde nosso preço está acima da média do mercado
  - Histórico de pesquisas recentes

### Menu Lateral
- Adicionar "Pesquisa de Mercado" no grupo "Ferramentas" do sidebar

## Parte 3: IA para Compatibilidade e Detalhes de Peças

Expandir o chatbot existente e a edge function `chat` para:

### Edge Function `chat/index.ts`
- Atualizar o system prompt para incluir instruções de:
  - Identificar peças que servem em outras máquinas (usando `compatible_models` e similaridade de descrição)
  - Fornecer detalhes técnicos sobre a peça quando perguntado
  - Sugerir peças alternativas ou equivalentes do catálogo

### Nova Edge Function `part-research`
- Recebe um `material` (código da peça)
- Usa Lovable AI para gerar informações enriquecidas:
  - Função provável da peça baseada na descrição
  - Máquinas compatíveis conhecidas (além das cadastradas)
  - Especificações técnicas prováveis
- Retorna JSON estruturado para exibir no detalhe da peça

### Interface no Detalhe da Peça
- Botão "Pesquisar com IA" no `PartDetailDialog` que chama a edge function e exibe:
  - Descrição técnica expandida
  - Lista de máquinas potencialmente compatíveis
  - Sugestões de peças relacionadas do catálogo

## Detalhes Técnicos

- **Tabela**: `market_research` com FK para `parts.id`
- **Migration**: CREATE TABLE + RLS policies
- **Edge function**: `part-research` com Lovable AI (gemini-3-flash-preview)
- **Componentes novos**: `MarketResearchTab`, `MarketResearchPage`, `PartAIResearch`
- **Hooks**: `useMarketResearch(partId)`, `usePartAIResearch(partId)`
- **Sidebar**: Novo item "Pesquisa de Mercado" com ícone Search

