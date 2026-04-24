

# Plano: Simplificar rótulos "IA" no catálogo + remover "verificado com IA"

## Mudança

Sweep de UI para remover menções a "IA" em rótulos visíveis ao usuário, incluindo o badge "verificado com IA" da pesquisa de mercado. Funcionalidade não muda — apenas textos e ícones decorativos.

### Substituições

| Antes | Depois |
|---|---|
| "Pesquisar com IA" | "Pesquisar" |
| "Pesquisando com IA…" | "Pesquisando…" |
| "Enriquecer com IA" / "Re-enriquecer" | "Carregar informações" / "Atualizar informações" |
| "Categorizar com IA" | "Categorizar" |
| "Resolver tudo com IA" | "Resolver em lote" |
| "Subcategorizar com IA" | "Subcategorizar" |
| "Inteligência IA" (header) | "Informações complementares" |
| **"Verificado com IA"** / **"Página verificada ✓ (IA)"** | **"Verificado"** / **"Página verificada ✓"** |
| Tooltip "Link confirmado pela IA" | "Link confirmado — código encontrado na página" |
| Empty state "Nenhuma pesquisa IA…" | "Nenhuma informação carregada ainda." |
| Toasts "Enriquecimento IA concluído" | "Informações atualizadas" |
| Ícones `Sparkles` decorativos isolados | Removidos (mantidos onde têm função de CTA) |

**Mantido onde "IA" É o produto**: `AIChatbot`, página `/assistente`.

## Arquivos afetados (apenas strings/ícones)

| Arquivo | Mudança |
|---|---|
| `src/components/catalog/MarketResearchTab.tsx` | "Pesquisa de Mercado IA" → "Pesquisa de Mercado"; badge "verificado com IA" → "Verificado"; tooltips simplificados |
| `src/components/catalog/PartAIResearch.tsx` | "Pesquisar com IA" → "Pesquisar" |
| `src/components/customers/EnrichmentPanel.tsx` | "Enriquecer com IA" → "Carregar informações"; "Inteligência IA" → "Informações complementares"; remove `Sparkles` decorativo do header |
| `src/components/customers/CustomerProspectionTab.tsx` | "Pesquisar com IA" → "Pesquisar"; empty state reescrito |
| `src/components/customers/BulkActionsBar.tsx` | "Enriquecer IA" → "Carregar informações"; "Prospectar IA" → "Buscar prospects" |
| `src/components/stock/DataHealthDrillDown.tsx` | "Categorizar com IA" / "Resolver tudo com IA" → "Categorizar" / "Resolver em lote" |
| `src/components/stock/SubcategorizeAITab.tsx` | "Reclassificação IA" → "Reclassificação de acessórios"; descrições suavizadas |
| `src/pages/CustomersPage.tsx` | Menus/botões em massa idem |
| `src/pages/CustomerDetailPage.tsx` | Header e seção de informações: remover menções "IA" |
| `src/pages/ProspectionPage.tsx` | "Pesquisar com IA" → "Pesquisar" |
| `src/hooks/use-batch-ai-research.ts` · `use-auto-market-research.ts` · `use-market-research.ts` · `use-part-ai-research.ts` · `use-customers.ts` (toasts) | Mensagens com "IA" → texto neutro ("pesquisa", "informações atualizadas", "link confirmado") |

## Detalhes

- **Sem alterações** em banco, RLS, edge functions ou lógica de negócio.
- **Estados de loading** padronizados: "Carregando…" para fetch passivo, "Pesquisando…" quando o usuário acionou busca ativa.
- **Badge "verificado"**: muda só o texto e o tooltip — a regra de validação (`url_verified === true` com evidência) continua igual.
- Padronização PT-BR comercial em toda a UI.

## Resultado

- UI mais limpa e profissional, sem dar a impressão de que "tudo é IA / não temos catálogo próprio".
- Vendedor vê verbos diretos ("Pesquisar", "Carregar informações", "Verificado") em vez de jargão técnico.
- Zero impacto funcional.

