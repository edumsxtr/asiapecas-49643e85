

# Plano: Revisão de Duplicidades + CRM 360° Integrado (Prospecção, Pedidos, Pós-Venda)

## Contexto

Hoje a importação grava direto no banco e o cliente fica isolado das outras ferramentas (Prospecção, Vendas, Pós-Venda). Precisamos:
1. **Revisar duplicatas antes de gravar** — mesclar / ignorar / criar novo
2. **Identificar clientes vazios** (sem contato/equipamento/faturamento) e enviá-los à **Prospecção com IA**
3. **Integrar tudo**: do CRM o vendedor cria pedido, abre chamado pós-venda, dispara prospecção, e tudo volta para a ficha 360° do cliente

## Solução em 4 blocos

### 1. Tela de Revisão de Duplicidades (pré-gravação)

Nova etapa **3.5** no `ImportXlsxWizard` antes do batch import:

**Edge function `preview-customer-import`** (nova) — recebe as linhas mapeadas e retorna **dry-run**:
- Para cada linha aplica a chave canônica (CNPJ → email → `canonicalCompanyName`+cidade)
- Retorna `{ row_index, status: "new"|"match"|"ambiguous", matches: [{customer_id, name, score, fields_diff}] }`
- `score` 0-100 combinando match exato CNPJ (100), email (90), nome canônico (60-80 por similaridade Jaro-Winkler), cidade (+10)
- `ambiguous` quando 2+ candidatos com score >50

**UI `ImportReviewStep.tsx`** (nova):
- Tabela agrupada por status: 🟢 Novos / 🟡 Match único / 🔴 Ambíguos
- Cada linha ambígua expansível: mostra **diff lado-a-lado** (planilha vs cada candidato), com checkboxes por campo (escolher de qual lado vem cada valor) — **merge cirúrgico**
- Ações por linha: **Mesclar com [X]** / **Criar novo** / **Ignorar**
- Ações em massa: "Aceitar todos os matches únicos", "Ignorar duplicados sem dados novos"
- Contador no topo: "X serão criados, Y mesclados, Z ignorados"
- Só ao confirmar é que dispara `import-customers` com `decisions: [{row_index, action, target_id, field_overrides}]`

`import-customers` ganha modo `apply_decisions` que respeita escolhas do usuário em vez de re-deduplicar.

### 2. Detecção de "Clientes Vazios" + Prospecção integrada

**View / cálculo client-side**: cliente é "vazio" quando:
- Sem `email` E sem `phone` E sem `cnpj_cpf`, OU
- Sem nenhum `customer_equipment` E sem `customer_invoices` E sem `sales`

**`CustomersPage`**: novo filtro **"Vazios / Incompletos"** + badge "📭 Vazio" na linha + ação em massa **"Prospectar com IA (N)"**

**Edge function `prospect-from-customer`** (nova):
- Input: `customer_id` (1 ou N)
- Faz lookup público (web search via Lovable AI grounding) por nome/CNPJ/cidade
- Cria/atualiza linha em `prospects` com `source = 'crm_empty'`, score IA, `ai_summary`, `matched_parts` (cruzando `interest_models` com peças em estoque)
- Marca `customers.relationship_status = 'em_prospeccao'` e linka via `prospects.notes` o `customer_id` original (campo novo `prospects.customer_id uuid` — migração aditiva)
- No retorno, frontend abre `/prospeccao` filtrado por essa campanha

**`CustomerDetailPage` → nova aba "Prospecção"**: lista os registros em `prospects` linkados, com score, resumo IA, botão "Reenriquecer", botão "Promover a cliente ativo" (limpa o vazio e marca status `ativo`)

### 3. Pedidos direto do CRM (integração CRM ↔ Vendas)

**`CustomerDetailPage` → header**: botão **"Novo Pedido"** que navega para `/pedidos/novo?customer_id=:id`

**`NewOrderPage`** ganha:
- Pré-seleção do cliente quando vier `?customer_id=`
- Sugestão automática de peças baseada em:
  - `customer_equipment.model` → filtra `parts.compatible_models`
  - Histórico de `sale_items` desse cliente (top 10 mais comprados)
  - `customers.interest_models`
- Card "Sugestões para este cliente" no topo do catálogo do pedido

**`CustomerDetailPage` → nova aba "Pedidos"**: lista `sales WHERE customer_id = :id` com status, valor, data, link para detalhe da venda; cards de KPI (ticket médio, total comprado, última compra, dias desde último pedido)

### 4. Pós-Venda integrado

**`CustomerDetailPage` → nova aba "Pós-Venda"**: lista `after_sales WHERE customer_id = :id` (chamados, garantias, suporte) com status colorido; botão **"Abrir chamado"** que cria registro já vinculado ao cliente (e à última venda, se houver)

## Esquema (migração aditiva)

- `prospects.customer_id uuid` (nullable) — link de volta ao CRM quando origem é `crm_empty`
- Índice em `prospects.customer_id`
- Nada mais — reaproveitamos `sales`, `after_sales`, `customers`, `customer_equipment`, `customer_invoices`

## Arquivos afetados

| Arquivo | Ação |
|---|---|
| Migração SQL | Adicionar `prospects.customer_id` + índice |
| `supabase/functions/preview-customer-import/index.ts` | **Novo** — dry-run de dedup com score e diffs |
| `supabase/functions/import-customers/index.ts` | Aceitar `apply_decisions` mode (respeita escolhas do usuário) |
| `supabase/functions/prospect-from-customer/index.ts` | **Novo** — IA gera prospect a partir de cliente vazio |
| `src/components/customers/ImportXlsxWizard.tsx` | Inserir etapa de revisão antes do batch |
| `src/components/customers/ImportReviewStep.tsx` | **Novo** — tabela de revisão + merge cirúrgico |
| `src/components/customers/CustomerProspectionTab.tsx` | **Novo** — aba Prospecção na ficha |
| `src/components/customers/CustomerSalesTab.tsx` | **Novo** — aba Pedidos na ficha |
| `src/components/customers/CustomerAfterSalesTab.tsx` | **Novo** — aba Pós-Venda na ficha |
| `src/pages/CustomerDetailPage.tsx` | 3 novas abas + botão "Novo Pedido" + botão "Prospectar com IA" |
| `src/pages/CustomersPage.tsx` | Filtro "Vazios", badge, ação em massa "Prospectar (N)" |
| `src/pages/NewOrderPage.tsx` | Pré-seleção via `?customer_id=` + bloco "Sugestões para este cliente" |
| `src/hooks/use-customers.ts` | Novos hooks: `usePreviewImport`, `useApplyImportDecisions`, `useProspectFromCustomer`, `useCustomerSales`, `useCustomerAfterSales`, `useCustomerProspects`, `useEmptyCustomersCount` |
| `src/hooks/use-prospects.ts` | Filtro por `customer_id`; mutation "promover a cliente ativo" |

## Detalhes técnicos

- **Scoring de dedup**: Jaro-Winkler (implementação leve em `src/lib/normalize.ts`) sobre nome canônico; CNPJ vale 100, email 90, nome+cidade 60-90
- **Merge cirúrgico**: payload `field_overrides: { name?: "spreadsheet"|"existing"|"custom", phone?: ..., ... }` para o servidor montar o registro final com auditoria em `customer_imports.report.merge_log`
- **Performance**: preview em batch de 200 linhas, retorna em <5s; UI virtualizada (`@tanstack/react-virtual` se passar de 500 linhas)
- **IA prospecção**: Lovable AI Gateway com `google/gemini-2.5-pro` + grounding; fallback para `gemini-2.5-flash` em massa; rate-limit 429/402 com retry/backoff
- **Sugestão de peças no pedido**: query única que cruza `customer_equipment.model` com `parts.compatible_models` (array overlap `&&`) e top vendas via `sale_items` agrupado
- **Segurança**: todas as edge functions validam JWT; Zod no body; nunca sobrescreve campo do cliente sem decisão explícita
- **UX**: barra de progresso por etapa do wizard; toasts diferenciados (criados / mesclados / ignorados / falhas); link direto para a ficha 360° de cada cliente afetado no relatório final

## Resultado esperado

- **Importação segura**: nenhuma duplicata gravada sem revisão; merge campo a campo quando houver conflito
- **Clientes vazios viram oportunidade**: 1 clique transforma cadastro incompleto em prospect enriquecido por IA
- **Ficha 360° real**: Resumo, IA, Equipamentos, Faturamento, **Pedidos**, **Pós-Venda**, **Prospecção** — tudo no mesmo lugar
- **Vendedor vende mais rápido**: do cadastro do cliente até o pedido com peças sugeridas em <30s
- **CRM virou hub central** conectando Importação → Enriquecimento → Prospecção → Vendas → Pós-Venda

