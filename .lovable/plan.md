

# Plano: Assistente IA Treinado com Estoque Completo

## O que já existe
- Edge function `chat/index.ts` com busca no catálogo (busca por texto na descrição/material/modelo, limite 20 resultados)
- Chatbot flutuante no canto inferior direito (AIChatbot.tsx)
- Rota `/assistente` aponta para ComingSoonPage

## O que falta
O assistente atual faz busca simples por texto. Precisa ser melhorado para:
1. **Identificar compatibilidade entre máquinas** — buscar peças por categoria e modelo, cruzar `compatible_models`
2. **Conhecimento de vendas e clientes** — consultar tabelas `sales`, `customers`, `after_sales`
3. **Respostas confiáveis baseadas nos dados reais** — trazer estatísticas do estoque, preços, tempo parado
4. **Página dedicada** em vez de apenas o chat flutuante

## Implementação

### 1. Melhorar Edge Function `chat/index.ts`
- Busca inteligente: além de texto livre, detectar intenção (compatibilidade, preço, estoque, venda)
- Quando perguntar sobre compatibilidade: buscar todas as peças do mesmo `machine_model` e peças que têm o modelo em `compatible_models`
- Quando perguntar sobre clientes/vendas: consultar tabelas `customers`, `sales`, `sale_items`, `after_sales`
- Incluir estatísticas globais: total peças, valor total, peças paradas, peças críticas
- Buscar peças relacionadas por categoria (mineração, linha amarela, etc.)
- System prompt expandido com conhecimento XCMG: linhas de produtos, categorias, dicas de venda cruzada

### 2. Criar Página `/assistente` — Chat em tela cheia
- Layout com sidebar (AppLayout) + área de chat ocupando toda a tela
- Sugestões rápidas: "Peças para XE215", "Peças paradas há mais de 2 anos", "Compatibilidade filtro hidráulico", "Resumo de vendas"
- Histórico de conversa na sessão
- Indicadores visuais: quando menciona peça, mostrar código/preço inline

### 3. Manter Chatbot Flutuante
- O chat flutuante continua funcionando, mas usa a mesma edge function melhorada
- Adicionar link "Abrir em tela cheia" que leva para `/assistente`

## Arquivos a criar/editar
- `supabase/functions/chat/index.ts` — reescrever com busca inteligente multi-tabela
- `src/pages/AssistantPage.tsx` — nova página de chat em tela cheia
- `src/components/chat/AIChatbot.tsx` — adicionar botão "tela cheia"
- `src/App.tsx` — trocar rota `/assistente` de ComingSoonPage para AssistantPage

