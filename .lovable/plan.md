

# Plano: Assistente IA Especialista com Respostas Organizadas e Perguntas Afuniladas

## Problema Atual
- O system prompt não instrui a IA a fazer perguntas de follow-up para afunilar a busca
- As respostas vêm em texto corrido sem estrutura visual clara (tabelas, seções)
- Não há instrução para o assistente agir como especialista XCMG profundo
- O modelo atual (gemini-3-flash) é rápido mas menos preciso — trocar para gemini-2.5-pro para respostas mais inteligentes

## Mudanças

### 1. Reescrever System Prompt (edge function `chat/index.ts`)
Novo prompt com instruções detalhadas para:
- **Perguntas afuniladas**: sempre que a pergunta for genérica, fazer 2-3 perguntas específicas antes de responder (ex: "Qual modelo da máquina?", "É para qual sistema: hidráulico, motor, transmissão?")
- **Respostas organizadas**: usar tabelas markdown para listagem de peças, seções com headers, separadores visuais, resumo executivo no topo
- **Especialista XCMG**: incluir conhecimento técnico sobre sistemas das máquinas (motor, hidráulico, transmissão, elétrico), ciclos de manutenção, peças de desgaste vs peças estruturais
- **Consultor de vendas**: sugerir kits, peças complementares, alertar sobre peças que costumam falhar juntas
- Usar modelo `google/gemini-2.5-pro` para respostas mais profundas

### 2. Melhorar CSS do chat (AssistantPage.tsx)
- Melhorar renderização de tabelas markdown (bordas, padding, zebra striping)
- Suporte a syntax highlighting em blocos de código
- Seções colapsáveis para respostas longas

### 3. Sugestões dinâmicas após cada resposta
- Após cada resposta do assistente, mostrar 2-3 botões de follow-up contextual baseados no conteúdo da resposta

## Arquivos a editar
- `supabase/functions/chat/index.ts` — system prompt + modelo
- `src/pages/AssistantPage.tsx` — CSS tabelas, sugestões dinâmicas, melhor UX

