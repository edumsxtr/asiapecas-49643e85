

# Plano: CRUD Pesquisa de Mercado + Importação de Catálogo + Upload de Documentos para IA

## Resumo

Transformar a Pesquisa de Mercado no módulo central do sistema com CRUD completo (editar/deletar registros), criar funcionalidade de importação de novas peças via planilha, e permitir upload de documentos para a IA analisar.

## 1. CRUD Completo — Pesquisa de Mercado

### Hook `use-market-research.ts`
- Adicionar `useUpdateMarketResearch` (editar registro existente)
- Adicionar `useDeleteMarketResearch` (deletar registro)

### Página `MarketResearchPage.tsx`
- Adicionar botão "Nova Pesquisa" que abre dialog (criar pesquisa avulsa, sem precisar ir no catálogo)
- Edição inline: clicar no registro abre dialog preenchido para editar distribuidor, preço, prazo, disponibilidade
- Botão deletar com confirmação (AlertDialog)
- Filtros: por distribuidor, por período, por disponibilidade
- Busca por texto
- Coluna com nome da peça (join com parts via part_id)
- KPI adicional: menor preço médio vs nosso preço médio (competitividade geral)

### Tab `MarketResearchTab.tsx`
- Adicionar botões Editar e Deletar em cada linha da tabela
- Dialog de edição reutilizando o formulário existente

## 2. Importação de Catálogo (Novas Peças via Planilha)

### Nova Edge Function `supabase/functions/import-catalog/index.ts`
- Recebe CSV/JSON com lista de peças
- Valida campos obrigatórios (material, description)
- Insere peças novas (upsert por material — atualiza se já existe)
- Retorna relatório: quantas inseridas, atualizadas, erros

### Frontend: Componente de Import na página de Estoque ou Catálogo
- Botão "Importar Planilha" no header do catálogo
- Dialog com dropzone para upload de arquivo (.csv, .xlsx, .json)
- Parse no frontend (Papa Parse para CSV, SheetJS para XLSX)
- Preview dos dados antes de confirmar
- Mapeamento de colunas: material, descrição, preço, estoque, modelo, fabricante
- Barra de progresso durante importação
- Relatório final: X inseridas, Y atualizadas, Z erros

## 3. Upload de Documentos para IA Analisar

### Storage Bucket
- Criar bucket `documents` para armazenar arquivos enviados

### Nova Edge Function `supabase/functions/analyze-document/index.ts`
- Recebe arquivo (texto extraído no frontend) + pergunta do usuário
- Envia conteúdo para Lovable AI (gemini-2.5-pro) com system prompt contextualizado
- Retorna análise estruturada

### Frontend: Upload no Assistente
- Adicionar botão de upload (📎) no campo de input do AssistantPage
- Aceitar: .csv, .xlsx, .pdf, .txt, .json, .doc
- Para CSV/XLSX: parse no frontend e enviar dados como texto ao chat
- Para PDF/TXT: extrair texto e enviar junto com a mensagem
- Mostrar badge com nome do arquivo anexado
- A IA recebe o conteúdo e responde com análise (identificar peças, preços, compatibilidade)

## 4. Sincronização entre Módulos

- Quando importar novas peças → invalidar queries de `parts`, `dashboard-stats`
- Quando adicionar pesquisa de mercado → invalidar `market-research-overview` + dados do dashboard
- O assistente IA já consulta todas as tabelas em tempo real (parts, sales, customers, after_sales) — adicionar também consulta a `market_research` na edge function do chat

### Atualizar Edge Function `chat/index.ts`
- Adicionar seção para buscar dados de `market_research` quando perguntarem sobre preços de concorrentes, competitividade, distribuidores

## Arquivos a criar/editar

- `supabase/functions/import-catalog/index.ts` — nova edge function
- `supabase/functions/analyze-document/index.ts` — nova edge function
- `src/hooks/use-market-research.ts` — adicionar update + delete
- `src/pages/MarketResearchPage.tsx` — CRUD completo + filtros
- `src/components/catalog/MarketResearchTab.tsx` — editar/deletar
- `src/components/catalog/ImportCatalogDialog.tsx` — novo componente
- `src/pages/AssistantPage.tsx` — upload de documentos
- `supabase/functions/chat/index.ts` — incluir market_research no contexto

## Banco de Dados
- Migration: criar bucket `documents` no storage
- Sem alterações de schema nas tabelas existentes

