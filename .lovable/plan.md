# Desconto PIX opcional + Gerador de garantia inteligente

## 1. Desconto opcional na proposta

Hoje o desconto vem do template de pagamento (campo `discount_pct`) e é aplicado **automaticamente** ao escolher um template (ex.: PIX 5%). Vou tornar isso opcional, sem perder o template.

Na aba **Pagamento** do `ProposalGeneratorDialog`:
- Switch **"Aplicar desconto do template"** (ligado por padrão se o template tiver desconto > 0).
- Campo numérico **"Desconto manual (%)"** que sobrescreve o desconto do template quando preenchido.
- Resumo claro abaixo: Total bruto · Desconto aplicado · **Total final**.
- Recalcula `buildSchedule` usando o desconto efetivo (template, manual ou 0).
- Salva `applied_discount_pct` em `sales` para auditoria.

CRUD dos templates de pagamento já existe em `ProposalConfigTab` → aba "Pagamento" (criar/editar/excluir, com `discount_pct` configurável). Vou só destacar visualmente quando um template tem desconto > 0 na seleção (badge "−5%").

## 2. Garantias mais amplas + gerador inteligente

### a) Mais templates pré-cadastrados (seed)
Migration que insere templates iniciais cobrindo as principais famílias de peça, se ainda não existirem (sem duplicar pelo nome):
- Motor / componentes internos (6 meses)
- Sistema hidráulico (3 meses)
- Sistema elétrico (3 meses)
- Material rodante / undercarriage (3 meses)
- Filtros & consumíveis (sem garantia — desgaste)
- Pneus (garantia de fabricação)
- Peça recondicionada (3 meses condicional)
- Peça usada (sem garantia / 30 dias contra defeito oculto)
- Acessórios e cabine (6 meses)
- Padrão geral (3 meses) — fallback

Cada um já com `intro_text`, `conditions[]`, `exclusions[]` e `default_for_category` apontando para categoria correspondente, para `pickTemplateForCategory` resolver automaticamente.

### b) Gerador de garantia com IA (por item)
Botão **"Gerar com IA"** ao lado do select de garantia em cada item da aba "Itens & Garantia".

Fluxo:
1. Coleta contexto do item: material, descrição, categoria, subcategoria, condição (Novo/Recond./Usado), fabricante, modelo da máquina.
2. Chama nova edge function `generate-warranty` → Lovable AI Gateway (`google/gemini-2.5-flash`) com prompt estruturado que retorna JSON:
   ```json
   { "months": 3, "intro_text": "...", "conditions": ["..."], "exclusions": ["..."], "suggested_name": "Garantia Hidráulica - 3m" }
   ```
3. O retorno preenche os overrides do item (`warranty_custom_months`, `warranty_custom_text`) ou substitui o template selecionado.
4. Diálogo de confirmação mostra a sugestão e oferece dois botões:
   - **Aplicar só neste item** (vai para overrides do item).
   - **Salvar como novo template** (cria via `useUpsertWarrantyTemplate`, fica disponível no CRUD).

### c) CRUD reforçado
Já existe em `ProposalConfigTab` → aba "Garantias". Vou:
- Adicionar coluna "Padrão p/ categoria" mais visível.
- Adicionar botão **"Duplicar"** ao lado de editar/excluir, útil para criar variações.
- Garantir que o gerador IA leve direto para o diálogo de edição quando "Salvar como novo template" é escolhido.

## Arquivos

- **Nova edge function**: `supabase/functions/generate-warranty/index.ts`
- **Novo hook**: `src/hooks/use-warranty-ai.ts` (mutation para chamar a função)
- **Migration**: seed dos 10 templates de garantia (idempotente por nome) + nova coluna `sales.applied_discount_pct` (numeric, default 0)
- **Editar**: `src/components/sales/ProposalGeneratorDialog.tsx` (switch desconto, override manual, botão IA por item, recalc do schedule)
- **Editar**: `src/components/sales/ProposalConfigTab.tsx` (badge de desconto no select, botão duplicar em garantias)
- **Editar**: `src/hooks/use-payment-templates.ts` (assinatura `buildSchedule` aceitando `overrideDiscountPct?: number | null`)

## Fora de escopo

- Mudar a estrutura de `warranty_templates` (campos atuais já cobrem).
- Aplicar IA em lote para todos os itens de uma vez (fica para depois — começa item a item para validar qualidade).
- Limitar quem pode editar templates (já é admin-only via RLS existente).
