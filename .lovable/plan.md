

# Plano: Sincronizar Catálogo Completo + Salvar Pesquisas IA + Exportar Planilha

## Diagnóstico

| Dado | Planilha | Banco Atual | Gap |
|------|----------|-------------|-----|
| Linhas | 20.436 | 15.298 | 5.138 linhas a mais na planilha |
| Materiais únicos | ~15.298 | 15.298 | Os mesmos materiais, mas a planilha tem **duplicatas** (mesmo material em modelos/estoques diferentes) |

A planilha tem o mesmo material repetido com estoques e modelos diferentes (ex: `272102015` aparece 2x com stock 45 e 20). O banco tem 1 registro por material. Os totais diferem porque a planilha soma os estoques de linhas duplicadas.

## O que vou fazer

### 1. Importar planilha completa via script SQL
- Processar o Excel, agrupar por material (somando estoques de linhas duplicadas)
- Atualizar stock e estimated_price de todos os 15.298 materiais
- Para materiais com múltiplos modelos na planilha, concatenar os modelos no campo `compatible_models`
- Gerar uma migration com todos os UPDATEs usando tabela temporária (executa direto no banco, sem timeout)

### 2. Nova tabela `ai_compatibility_results` — salvar pesquisas da IA
- Campos: `id`, `part_id` (FK parts), `material`, `compatible_machines` (text[]), `technical_description`, `probable_function`, `technical_specs` (text[]), `maintenance_tips`, `related_parts` (text[]), `researched_at`, `model_used`
- Quando o usuário clicar "Pesquisar com IA" na aba de compatibilidade, o resultado é salvo automaticamente nesta tabela
- Na próxima vez que abrir a mesma peça, mostra o resultado salvo (com opção de "Atualizar pesquisa")

### 3. Atualizar edge function `part-research`
- Após receber resposta da IA, salvar resultado na tabela `ai_compatibility_results`
- Se já existe resultado salvo para aquele material, atualizar

### 4. Atualizar componente `PartAIResearch.tsx`
- Ao abrir, verificar se já existe pesquisa salva para a peça
- Se sim, mostrar resultado salvo com data + botão "Atualizar Pesquisa"
- Se não, mostrar botão "Pesquisar com IA" como hoje

### 5. Atualizar hook `use-part-ai-research.ts`
- Adicionar query para buscar pesquisa salva da tabela `ai_compatibility_results`
- Adicionar mutação para salvar/atualizar resultado

### 6. Exportação de planilha consolidada
- Novo botão "Exportar Catálogo" no header do catálogo (ao lado de "Importar Planilha")
- Exporta XLSX com todas as peças + colunas de compatibilidade IA (se pesquisadas)
- Colunas: Material, Descrição, Estoque, Preço, Modelo, Fabricante, Categorias, Tempo Entrada, **Máquinas Compatíveis (IA)**, **Descrição Técnica (IA)**, **Data Pesquisa IA**

### 7. Incluir pesquisas IA no contexto do chat
- Atualizar `chat/index.ts` para consultar `ai_compatibility_results` quando relevante

## Banco de Dados
- Migration: CREATE TABLE `ai_compatibility_results` + RLS pública
- Migration: UPDATE em massa de stock/price via tabela temporária (dados da planilha)

## Arquivos a criar/editar
- **Migration SQL**: nova tabela + updates de estoque
- `supabase/functions/part-research/index.ts` — salvar resultado no banco
- `src/hooks/use-part-ai-research.ts` — buscar resultado salvo + salvar
- `src/components/catalog/PartAIResearch.tsx` — mostrar resultado salvo
- `src/components/catalog/CatalogContent.tsx` — botão "Exportar Catálogo"
- `src/components/catalog/ExportCatalogButton.tsx` — novo componente de exportação
- `supabase/functions/chat/index.ts` — incluir ai_compatibility_results no contexto

