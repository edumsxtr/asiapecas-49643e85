

# Plano: Sistema de Prospecção IA com Modelo OpenAI GPT-5

## Sobre o modelo de IA

Boa notícia: o seu projeto já tem acesso aos modelos OpenAI através do Lovable AI, **sem precisar de API key separada**. Os modelos disponíveis incluem:

- **openai/gpt-5** — Raciocínio avançado, multimodal, contexto longo
- **openai/gpt-5.2** — Último modelo, melhor para problemas complexos
- **openai/gpt-5-mini** — Mais rápido, custo menor, boa performance

Vou usar o **openai/gpt-5.2** (o mais potente disponível) para o módulo de prospecção.

---

## Banco de Dados

### Nova tabela `prospects`
- `id`, `name`, `company`, `cnpj_cpf`, `email`, `phone`, `country` (BR/VE/GY), `state`, `city`, `segment`, `source` (ia/manual), `status` (novo/contatado/qualificado/negociação/convertido/descartado), `score` (0-100), `matched_parts` (text[]), `notes`, `ai_summary`, `created_at`, `updated_at`

### Nova tabela `prospection_campaigns`
- `id`, `name`, `target_country`, `target_states` (text[]), `target_segments` (text[]), `status`, `total_prospects`, `converted`, `notes`, `created_at`

### Alterar tabela `customers`
- Adicionar `country text DEFAULT 'BR'` e `source text DEFAULT 'manual'`

## Edge Function: `prospect-search/index.ts`

- Usa **openai/gpt-5.2** via Lovable AI Gateway (mesma URL, só muda o modelo)
- Consulta estoque real (categorias, modelos, quantidades disponíveis)
- Gera perfis de empresas potenciais por região (todos os estados BR + Venezuela + Guiana)
- Retorna structured output via tool calling (nome, segmento, score, peças recomendadas, justificativa)
- Salva automaticamente na tabela `prospects`

## Nova Página: `/prospeccao`

- Filtros: País, Estado, Segmento (mineração/construção/logística/energia)
- Botão "Buscar Prospects com IA" (GPT-5.2)
- Tabela com prospects: Nome, Empresa, País/Estado, Score, Status, Peças Recomendadas
- Pipeline visual: Novo → Contatado → Qualificado → Negociação → Convertido
- Botão "Converter para Cliente" → copia para `customers`
- KPIs: total por país, taxa de conversão, prospects por segmento

## Atualizar chat do assistente

- Trocar modelo do `chat/index.ts` também para **openai/gpt-5.2**
- Trocar modelo do `analyze-document/index.ts` para **openai/gpt-5.2**
- Trocar modelo do `part-research/index.ts` para **openai/gpt-5.2**

## Arquivos a criar/editar

- **Migration**: CREATE TABLE `prospects`, `prospection_campaigns`, ALTER TABLE `customers`
- `supabase/functions/prospect-search/index.ts` — nova edge function com GPT-5.2
- `src/pages/ProspectionPage.tsx` — página completa
- `src/hooks/use-prospects.ts` — CRUD + converter para cliente
- `src/components/AppSidebar.tsx` — link "Prospecção"
- `src/App.tsx` — nova rota
- `supabase/functions/chat/index.ts` — trocar para openai/gpt-5.2
- `supabase/functions/analyze-document/index.ts` — trocar para openai/gpt-5.2
- `supabase/functions/part-research/index.ts` — trocar para openai/gpt-5.2

