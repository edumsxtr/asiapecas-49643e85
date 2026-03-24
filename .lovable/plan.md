

# Plano: Pesquisa IA em Massa + Catálogo Interativo + Carrinho Integrado + Portal do Cliente

## 4 Grandes Entregas

### 1. Pesquisa IA em Massa (Batch) — Todas as 15k peças pré-pesquisadas

**Edge Function `batch-ai-research/index.ts`**:
- Recebe um lote de materiais (50 por vez)
- Para cada peça sem pesquisa salva em `ai_compatibility_results`, chama a IA (gemini-2.5-flash para velocidade e custo)
- Salva resultados automaticamente
- Controle de rate limit com delay entre chamadas

**Botão no Catálogo**: "Pesquisar Todas com IA" que dispara a pesquisa em lotes (50 peças por request, com progresso visual). Ao terminar, cada peça já tem dados de compatibilidade, descrição técnica e peças relacionadas prontos para consulta instantânea.

**Hook `use-batch-ai-research.ts`**: Gerencia a fila de lotes, progresso, e status.

### 2. Catálogo mais Interativo e Responsivo

- **PartCard**: Adicionar botão "Adicionar ao Pedido" (ícone carrinho) direto no card, sem precisar abrir o dialog
- **Indicador de IA**: Badge verde "IA ✓" no card quando a peça já tem pesquisa salva em `ai_compatibility_results`
- **Quick preview**: Hover no card mostra tooltip com descrição técnica da IA (se disponível)
- **Responsividade**: Grid adapta de 1 a 4 colunas, cards com layout compacto em mobile
- **Busca otimizada**: Quando a peça tem dados de IA, incluir `compatible_machines` na busca (JOIN com `ai_compatibility_results`)

### 3. Montar Pedido/Orçamento direto do Catálogo

- **Carrinho flutuante**: Botão fixo no canto inferior direito com badge de quantidade
- **Estado global do carrinho**: Context/Zustand para compartilhar entre Catálogo e Pedido
- **Fluxo**: Catálogo → Adicionar peças → Clique no carrinho → Abre `/pedidos/novo` com itens preenchidos
- **No PartDetailDialog**: Botão "Adicionar ao Orçamento" ao lado de Editar/Revisar

### 4. Portal do Cliente (separado do vendedor)

**Nova rota `/cotacao`** — Página pública onde o CLIENTE acessa:
- Catálogo simplificado (sem preços internos, sem edição)
- Busca por código, descrição, modelo
- Filtros por categoria e modelo de máquina
- Botão "Solicitar Cotação" em cada peça
- Formulário: Nome, Empresa, CNPJ, Email, Telefone, Lista de peças desejadas + quantidades
- Ao enviar, cria registro em nova tabela `quote_requests` com status "pendente"
- Vendedor vê as cotações pendentes na área de Vendas

**Nova tabela `quote_requests`**:
- `id`, `customer_name`, `company`, `cnpj_cpf`, `email`, `phone`, `items` (jsonb — array de {material, quantity}), `status` (pendente/respondido/convertido), `notes`, `created_at`

## Banco de Dados
- CREATE TABLE `quote_requests` com RLS pública (clientes não autenticados podem inserir)
- Sem alteração nas tabelas existentes

## Arquivos a criar/editar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/batch-ai-research/index.ts` | Criar — pesquisa IA em lote |
| `src/hooks/use-batch-ai-research.ts` | Criar — gerencia pesquisa em massa |
| `src/contexts/CartContext.tsx` | Criar — carrinho global |
| `src/pages/QuotePage.tsx` | Criar — portal do cliente |
| `src/components/catalog/PartCard.tsx` | Editar — botão carrinho + badge IA |
| `src/components/catalog/CatalogContent.tsx` | Editar — botão "Pesquisar Todas" + carrinho flutuante |
| `src/components/catalog/PartDetailDialog.tsx` | Editar — botão "Adicionar ao Orçamento" |
| `src/pages/NewOrderPage.tsx` | Editar — ler itens do CartContext |
| `src/App.tsx` | Editar — rota `/cotacao` + CartProvider |
| `src/pages/SalesPage.tsx` | Editar — tab/seção "Cotações Recebidas" |
| Migration SQL | Criar — tabela `quote_requests` |

