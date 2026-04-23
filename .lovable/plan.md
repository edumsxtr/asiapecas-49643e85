

# Plano: CRM com CRUD em lote, WhatsApp direto, paginação e perfil 360° unificado

## O que muda

### 1. CRUD em lote na lista (`CustomersPage.tsx`)

- **Coluna de checkbox** em cada linha + checkbox "selecionar todos" no cabeçalho (respeita filtros e página atual)
- **Barra flutuante de ações em massa** aparece quando ≥1 cliente selecionado, ancorada acima da tabela:
  - **Editar em lote** → dialog com campos opcionais: `segment`, `relationship_status`, `state`, `city` — só aplica os preenchidos via `update().in("id", ids)`
  - **Excluir em lote** → AlertDialog com confirmação ("Excluir N clientes?") usando `delete().in("id", ids)`
  - **Enriquecer com IA** → loop sequencial pela mutation existente
  - **Prospectar com IA** → reusa `useProspectFromCustomer`
  - **Exportar CSV** dos selecionados (reusa `export-csv.ts`)
  - **Mensagem em lote no WhatsApp** → abre dialog com template (`Olá {nome}, ...`), botões "Abrir conversa" um por um (não dá pra disparar para vários simultaneamente — limitação técnica do `wa.me`)
- Hooks novos em `use-customers.ts`: `useBulkUpdateCustomers`, `useBulkDeleteCustomers`

### 2. Botão WhatsApp direto

- Helper `formatWhatsAppLink(phone, name?)` em `src/lib/whatsapp.ts`:
  - Sanitiza telefone (remove tudo que não é dígito), adiciona `55` se faltar DDI
  - Retorna `https://wa.me/55XXXXXXXXXXX?text=...` com saudação pré-preenchida em PT-BR
  - Se telefone inválido/vazio → retorna `null` e o botão fica desabilitado com tooltip "Sem telefone"
- Posições do botão (ícone verde do WhatsApp, lucide `MessageCircle`):
  - **Linha da tabela** em `CustomersPage` (ao lado de "Ver detalhe")
  - **Header do perfil 360°** em `CustomerDetailPage`
  - **Tabela de prospects** (`ProspectionPage` / `CustomerProspectionTab`) — também usa o mesmo helper
- Abre nova aba (`target="_blank"` + `rel="noopener noreferrer"`)

### 3. Paginação real na lista

- Hoje: `useCustomers` faz um único `.limit(2000)` e renderiza tudo
- Novo: `useCustomers({ search, page, pageSize, filters })` retorna `{ rows, total, page, pageSize }` usando `.range()` + `count: "exact"`
  - Move filtros (UF, segmento, enriquecimento) para o servidor — performance e contagem real
  - `pageSize` padrão = 25, opções: 25 / 50 / 100
- Componente de paginação no rodapé da tabela (Anterior/Próximo + número de páginas + jump-to)
- Sincroniza com URL via `useSearchParams` (`?page=3&q=...&uf=SP`) — link compartilhável e refresh preserva estado
- Skeleton loading em vez do "Carregando..." de texto puro

### 4. Perfil 360° unificado em **uma única aba** (`CustomerDetailPage.tsx`)

Hoje: 7 abas (`Resumo, IA, Equipamentos, Faturamento, Pedidos, Pós-Venda, Prospecção`). 
Novo: **uma aba "Visão 360°" rolável** com seções enxutas, navegação lateral sticky e ações inline.

Estrutura da aba 360°:

```text
┌───────────────────────────────────────────────────────────┐
│  Header sticky: nome + badges + botões (WhatsApp, Pedido) │
├──────────────┬────────────────────────────────────────────┤
│  Sidebar     │  ┌─ Contato & Localização (cards densos) ─┐│
│  sticky      │  ├─ Inteligência IA (resumo + insights)  ─┤│
│  com âncoras │  ├─ Equipamentos (tabela compacta + add) ─┤│
│  de scroll:  │  ├─ Faturamento SAP (último 12m + total) ─┤│
│  • Contato   │  ├─ Pedidos (timeline + total + status)  ─┤│
│  • IA        │  ├─ Pós-Venda (tickets abertos primeiro) ─┤│
│  • Equipam.  │  ├─ Prospecção (status + ações rápidas)  ─┤│
│  • Faturam.  │  └─ Observações & histórico              ─┘│
│  • Pedidos   │                                            │
│  • Pós-venda │  Cada seção: header colapsável + "Ver +"  │
│  • Prospec.  │  para abrir a lista completa em Sheet     │
└──────────────┴────────────────────────────────────────────┘
```

- Mantém abas antigas como fallback de tela cheia? **Não** — substituídas pela navegação por âncora (`scrollIntoView` suave + highlight no item ativo do menu lateral)
- Conteúdo pesado (listas com muitos itens) carrega só o **resumo** inline; "Ver todos N" abre `Sheet` lateral com a lista completa (reusando os componentes atuais `CustomerEquipmentTab`, `CustomerInvoicesTab`, etc.)
- 4 KPIs do header viram inline no card "Visão geral" no topo
- **Botões de contato** (WhatsApp, e-mail, telefone) ficam sempre visíveis no header sticky
- Layout responsivo: `lg:grid-cols-[220px_1fr]` desktop; mobile vira tabs colapsáveis ou navegação superior compacta

## Arquivos afetados

| Arquivo | Ação |
|---|---|
| `src/lib/whatsapp.ts` | **Novo** — helper de formatação e link |
| `src/components/customers/WhatsAppButton.tsx` | **Novo** — botão reutilizável (icon + texto opcional + tooltip) |
| `src/hooks/use-customers.ts` | Reescrever `useCustomers` com paginação + filtros server-side; adicionar `useBulkUpdateCustomers`, `useBulkDeleteCustomers` |
| `src/pages/CustomersPage.tsx` | Adicionar checkboxes, barra de ações em lote, paginação, sync URL, dialogs de edição/exclusão em lote, botão WhatsApp por linha |
| `src/components/customers/BulkEditDialog.tsx` | **Novo** — dialog com campos opcionais |
| `src/components/customers/BulkActionsBar.tsx` | **Novo** — barra flutuante com contador e ações |
| `src/components/customers/CustomerPagination.tsx` | **Novo** — controle de paginação com page-size |
| `src/pages/CustomerDetailPage.tsx` | Reescrever para layout 360° com sidebar sticky e seções inline |
| `src/components/customers/Customer360Section.tsx` | **Novo** — wrapper para cada seção (header + colapso + "Ver mais" → Sheet) |
| `src/components/customers/CustomerEquipmentTab.tsx`, `CustomerInvoicesTab.tsx`, `CustomerSalesTab.tsx`, `CustomerAfterSalesTab.tsx`, `CustomerProspectionTab.tsx` | Receber prop `compact?: boolean` para render inline (top 5) ou full (Sheet). Mínima refatoração |

## Detalhes técnicos

- **Performance da lista**: paginação server-side com `count: "exact"` é mais lenta em tabelas grandes; usar `count: "estimated"` quando não houver filtros para velocidade, "exact" quando filtros ativos
- **Sync URL**: `useSearchParams` do `react-router-dom`, debounce 300ms na busca
- **WhatsApp**: regex `/\D/g` para limpar; valida pelo menos 10 dígitos após limpeza; assume DDI Brasil quando faltar; template padrão `Olá ${nome}, sou da Ásia Peças & Máquinas. ` (encoded com `encodeURIComponent`)
- **Bulk**: limita 500 IDs por operação client-side; mostra toast com progresso
- **Bulk WhatsApp**: como `wa.me` exige interação humana, abrir N abas seguidas é bloqueado pelo browser — fluxo correto é mostrar lista clicável com botão "Abrir" um por um
- **Perfil 360°**: usar `IntersectionObserver` para destacar seção ativa na sidebar; `scroll-margin-top` nas seções para o sticky header não cobrir
- **Acessibilidade**: foco navegável, `aria-current="true"` no item ativo da sidebar, checkboxes com label oculto
- **Sem mudança de RLS**: políticas atuais já permitem update/delete em massa para `authenticated`

## Resultado esperado

- Vendedor seleciona vários clientes e atualiza segmento/status em 1 ação
- 1 clique no ícone do WhatsApp abre conversa com saudação pronta
- Lista carrega rapidamente mesmo com 10k+ clientes (paginação real)
- Perfil 360° mostra **toda a história do cliente em uma rolagem**, sem trocar de aba
- Estado da tela compartilhável via URL (link de busca filtrada)
- Zero perda funcional — tudo que existia em abas continua acessível inline ou via "Ver mais"

