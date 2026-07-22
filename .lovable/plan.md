## Módulo de Cotações — Ásia Peças

Novo hub "Cotações" no menu principal, otimizado para atendimento rápido via WhatsApp. Reaproveita a tabela existente `parts` como fonte de estoque (não duplica) — o campo `material` já é o PN e `stock` a quantidade.

### 1. Banco de dados (nova migration)

Reaproveitar `parts` como "estoque_itens" (já tem: material=PN, description, stock, machine_model=aplicação, estimated_price). Sem duplicar tabela.

Novas tabelas:

**`cotacoes`**
- `numero` gerado por trigger: `COT-YYYY-NNNN` (sequencial por ano)
- `cliente_nome`, `cliente_whatsapp`, `cliente_email`
- `origem` enum: trafego_pago | whatsapp | email | indicacao | outro
- `status` enum: recebida | verificando_estoque | aguardando_fabrica | fabrica_respondeu | cotando_parceiro | proposta_enviada | fechada | perdida
- `responsavel` text (Eduardo / Pedro)
- `observacoes`, `valor_total` (numeric, calculado)
- `data_envio_fabrica` (timestamp — usado para alerta 24h)
- timestamps padrão

**`cotacao_itens`**
- `cotacao_id` FK
- `pn`, `descricao`, `quantidade`
- `fonte` enum: estoque | fabrica | parceiro | sem_fonte
- `preco_custo`, `preco_venda` (numeric)
- `desconto_fabrica` numeric
- `disponibilidade_fabrica` enum: tem | nao_tem | parcial | pendente
- `prazo` text (ex "15 dias")
- `data_envio_fabrica`, `data_resposta_fabrica`
- `parceiro_nome`

**`cotacao_status_historico`** — trigger registra cada mudança de status com timestamp + usuário.

**Índice/consulta**: view `historico_pn` agregando por PN todas as vezes cotadas (data, número, disponibilidade, preço fábrica).

**RLS**: apenas `authenticated` (uso interno). GRANTs padrão.

### 2. Backend — Edge Function

`send-quote-factory-email`: opcional para o botão "gerar e-mail fábrica" — mas o pedido é apenas **copiar texto pronto**, então implementado 100% no frontend (sem edge function nova).

### 3. Frontend

**Rotas novas** (protegidas):
- `/cotacoes` — Dashboard + Kanban
- `/cotacoes/nova` — formulário rápido
- `/cotacoes/:id` — detalhe (edição de itens, resposta da fábrica, e-mail fábrica)
- `/cotacoes/historico-pn` — busca de histórico por PN

**Componentes**:
- `CotacoesPage` — layout com abas: Kanban | Dashboard | Histórico PN. Busca global de PN no topo (Command palette) respondendo "temos/não temos + última cotação".
- `KanbanBoard` — 8 colunas com drag-and-drop (`@dnd-kit`, já no projeto se disponível senão adicionar). Card com badge de dias na coluna; borda vermelha se `status=aguardando_fabrica AND data_envio_fabrica < now()-24h`.
- `NovaCotacaoDialog` — form: dados do cliente + linhas de itens; ao digitar PN, autolookup em `parts` (badge verde EM ESTOQUE / amarelo COTAR FÁBRICA) + aviso se já foi cotado antes.
- `CotacaoDetail` — edição inline dos itens, botão **"Gerar e-mail fábrica"** (abre dialog com texto formatado + botão copiar), botão **"Registrar resposta da fábrica"** (tela por item).
- `RegistrarRespostaFabrica` — grid item-a-item: disponibilidade / preço / desconto / prazo; item "não tem" pode marcar como parceiro.
- `DashboardCotacoes` — KPIs (abertas, aguardando fábrica, atrasadas >24h, propostas, fechadas mês, taxa conversão, valor em negociação) + ranking "PNs mais pedidos sem estoque".
- `BuscaGlobalPN` — comando no topo do módulo.

**Hooks** (`use-cotacoes.ts`): CRUD, lookup PN, histórico, atualização de status. React Query.

**Menu**: adicionar item **Cotações** (ícone `FileText` ou `Quote`) no grupo Comercial em `AppSidebar.tsx`, entre "Vendas" e "Novo Pedido".

### 4. Importação de estoque

O projeto já tem múltiplas importações de estoque em `/configuracoes/fontes/estoque`. Reutilizar. Não criar nova tela.

### 5. Detalhes técnicos

- Sem alterar RLS de `parts`.
- `numero` da cotação: sequência Postgres por ano `cotacoes_numero_seq_YYYY` + trigger BEFORE INSERT.
- Alertas 24h: computados no client via `dayjs`/`date-fns` (já no projeto).
- Drag-and-drop: usar `@dnd-kit/core` — verificar package.json; se ausente instalo.
- Todo o texto em pt-BR, sem emojis, seguindo tokens de cor existentes (azul-marinho + dourado).

### Arquivos a criar/modificar

- `supabase/migrations/...` (nova)
- `src/hooks/use-cotacoes.ts`
- `src/pages/CotacoesPage.tsx`
- `src/pages/CotacaoDetailPage.tsx`
- `src/components/cotacoes/KanbanBoard.tsx`
- `src/components/cotacoes/NovaCotacaoDialog.tsx`
- `src/components/cotacoes/DashboardCotacoes.tsx`
- `src/components/cotacoes/BuscaGlobalPN.tsx`
- `src/components/cotacoes/GerarEmailFabricaDialog.tsx`
- `src/components/cotacoes/RegistrarRespostaFabricaDialog.tsx`
- `src/components/cotacoes/HistoricoPNPanel.tsx`
- `src/App.tsx` (rotas) + `src/components/AppSidebar.tsx` (menu)
