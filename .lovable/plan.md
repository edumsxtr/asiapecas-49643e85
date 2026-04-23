

# Plano: Importação Inteligente do XLSX + Enriquecimento IA do Cadastro

## O que a planilha contém

Detectei 4 abas no `Clientes_Organizado.xlsx`:

| Aba | Conteúdo | Quantidade |
|---|---|---|
| **CLIENTES — CRM** | UF, cidade, contato, telefone, email, modelos de interesse, propostas, status, visitas | 759 clientes / 49 estados |
| **BRASIM 2025** | Leads de feira: contato, data, setor, porte, agendamentos | 19 participantes |
| **FATURAMENTO SAP** | NFs: documento, condição pagto, pagador, data, valor com impostos | 94 NFs / R$ 1.173.037 |
| **EQUIPAMENTOS VENDIDOS** | Histórico: modelo, série, order form, local entrega, ano, valor | 759 equip. / 730 clientes |

A tabela `customers` já existe com os campos certos (name, company, cnpj_cpf, email, phone, address, city, state, segment, notes, country, source). Vamos **estender** para suportar os dados ricos da planilha + cruzar com vendas e equipamentos.

## Solução em 4 partes

### 1. Schema enriquecido (migração aditiva)

**Tabela `customers`** — adicionar colunas:
- `interest_models text[]` — modelos XCMG de interesse
- `relationship_status text` — ativo / prospect / dormente / sem_contato
- `last_visit_at timestamptz` — última visita comercial
- `last_proposal_at timestamptz` — última proposta enviada
- `total_invoiced numeric default 0` — soma de NFs SAP
- `enrichment_status text default 'pending'` — pending / enriched / failed
- `enriched_at timestamptz`
- `enrichment_data jsonb` — payload bruto da IA (CNAE, porte, redes sociais, site, etc.)

**Nova tabela `customer_equipment`** (1 cliente → N equipamentos):
- `customer_id`, `model`, `serial_number`, `order_form`, `delivery_location`, `purchase_year`, `sale_value`

**Nova tabela `customer_invoices`** (NFs SAP):
- `customer_id`, `document_number`, `payment_terms`, `payer_name`, `invoice_date`, `total_value`

**Nova tabela `customer_imports`** (auditoria):
- `file_name`, `imported_at`, `total_rows`, `inserted`, `updated`, `skipped`, `report jsonb`

Tudo com RLS `authenticated`.

### 2. Importador inteligente do XLSX

**Página `/clientes` → novo botão "Importar XLSX"** que abre um wizard:

**Etapa 1 — Upload e parsing**
- `xlsx` lib (já usada em `import-catalog`) lê as 4 abas no client
- Pré-visualização: contagem por aba, primeiras 10 linhas de cada

**Etapa 2 — Mapeamento de colunas**
- Auto-detecção dos nomes (ex: "Cliente", "CNPJ", "UF", "Cidade", "Telefone", "E-mail", "Modelo", "Status", "Última Visita", "Proposta")
- Usuário confirma/corrige mapeamento por aba

**Etapa 3 — Deduplicação**
- Chave de match em ordem de prioridade: **CNPJ normalizado** → **email** → **(nome+cidade)**
- Para cada linha mostrar: 🟢 novo / 🟡 atualizar / 🔴 conflito (com diff inline)
- Toggle global "atualizar registros existentes" (default on)

**Etapa 4 — Importação batch**
- Edge function `import-customers` (nova) processa em chunks de 100
- Insere/atualiza `customers` + faz upsert em `customer_equipment` e `customer_invoices` ligando ao `customer_id` resolvido
- Calcula `total_invoiced` agregando as NFs
- Marca origem (`source = 'xlsx_import'` / `'brasim_2025'` / `'sap'`)
- Retorna `customer_imports` com relatório completo

### 3. Enriquecimento por IA — "Completar cadastro"

**Botão por cliente** (na tabela e no detalhe): **"Enriquecer com IA"**
**Botão em massa** no header: **"Enriquecer pendentes (N)"**

**Edge function `enrich-customer`**:
- Input: `customer_id`
- Usa **Lovable AI Gateway** com `google/gemini-2.5-pro` (raciocínio + busca pública via grounding) e **tool calling** para retornar JSON estruturado
- Prompt foca em: razão social oficial, CNPJ formatado, CNAE principal, porte (ME/EPP/Médio/Grande), setor, site, LinkedIn, Instagram, telefone alternativo, endereço completo, cidade/UF (preenche faltantes), tomador de decisão típico, observações comerciais (ex: "opera 12 escavadeiras XCMG na região norte")
- Schema do tool:
  ```json
  {
    "official_name": "string",
    "cnpj_formatted": "string|null",
    "cnae": "string|null",
    "company_size": "ME|EPP|Medio|Grande|null",
    "segment": "mineração|construção|logística|energia|geral",
    "website": "string|null",
    "linkedin": "string|null",
    "instagram": "string|null",
    "alt_phone": "string|null",
    "full_address": "string|null",
    "decision_maker_role": "string|null",
    "commercial_notes": "string|null",
    "confidence": "high|medium|low",
    "sources": ["url1","url2"]
  }
  ```
- **Salva** os campos diretos em `customers` (apenas se vazios, nunca sobrescreve telefone/email já preenchido sem confirmação)
- **Sempre** salva o payload completo em `customers.enrichment_data` (jsonb) com timestamp
- Marca `enrichment_status = 'enriched'` e `enriched_at = now()`

**UI**:
- Na linha da tabela: badge "✨ IA" se enriquecido, ⏳ se pendente
- No diálogo de detalhe: nova aba **"Inteligência IA"** com fontes consultadas, confiança, redes sociais clicáveis, CNAE, porte, observações
- **Aprovar/descartar sugestões** com diff lado-a-lado quando IA propõe alterar campos já existentes

### 4. Página de detalhe do cliente (nova rota `/clientes/:id`)

Substitui o diálogo atual por uma **página completa 360°** com tabs:
- **Resumo** — dados cadastrais + cards (total faturado SAP, nº equipamentos, última visita, próxima ação)
- **Inteligência IA** — dados enriquecidos + botão re-enriquecer
- **Equipamentos** — tabela `customer_equipment` (modelo, série, ano, valor)
- **Faturamento SAP** — tabela `customer_invoices` com gráfico mensal
- **Vendas internas** — `sales` ligadas via `customer_id` (cruza com sistema atual)
- **Histórico de propostas / visitas** — texto + datas

A listagem `/clientes` ganha:
- **Filtros**: UF, segmento, porte, status relacionamento, "tem equipamento XCMG", "enriquecido"
- **Coluna de score** combinando faturamento + equipamentos + última interação

## Arquivos afetados

| Arquivo | Ação |
|---|---|
| Migração SQL | Adicionar colunas em `customers`, criar `customer_equipment`, `customer_invoices`, `customer_imports` + RLS |
| `src/hooks/use-customers.ts` | Expor novos campos, novos hooks `useCustomerEquipment`, `useCustomerInvoices`, `useEnrichCustomer`, `useImportCustomers` |
| `src/pages/CustomersPage.tsx` | Botão importar, botão enriquecer em massa, filtros, badges, link para detalhe |
| `src/pages/CustomerDetailPage.tsx` | **Nova** — página 360° com tabs |
| `src/components/customers/ImportXlsxWizard.tsx` | **Novo** — wizard 4 etapas |
| `src/components/customers/EnrichmentPanel.tsx` | **Novo** — exibe payload IA + aprovar diffs |
| `src/components/customers/CustomerEquipmentTab.tsx` | **Novo** |
| `src/components/customers/CustomerInvoicesTab.tsx` | **Novo** |
| `supabase/functions/import-customers/index.ts` | **Novo** — recebe linhas mapeadas, dedup, upsert em batch |
| `supabase/functions/enrich-customer/index.ts` | **Novo** — chama Lovable AI com tool calling para JSON estruturado |
| `src/App.tsx` | Adicionar rota `/clientes/:id` |
| `src/lib/normalize.ts` | **Novo** — utilitários: `normalizeCnpj`, `normalizePhone`, `normalizeEmail` para deduplicação consistente |

## Detalhes técnicos

- **Deduplicação**: chave canônica `cnpj_normalizado || email_lower || slug(nome+cidade)`; resolvida em SQL com `ON CONFLICT` em índice único parcial
- **Performance**: importação em chunks de 100 via edge function; UI com progresso por aba; `react-query` invalida só `customers` no fim
- **IA**: Lovable AI Gateway com **tool calling** (não texto livre) para garantir JSON; modelo `google/gemini-2.5-pro` por padrão (qualidade), `google/gemini-2.5-flash` para enriquecimento em massa (custo); rate-limit handling 429/402 com toast
- **Segurança**: edge functions validam JWT do usuário; Zod no body de ambas; nunca sobrescreve campo preenchido sem flag `force = true`
- **Auditoria**: cada importação grava linha em `customer_imports` com relatório navegável (downloadable como CSV via `export-csv.ts` existente)
- **Reuso**: aproveita `xlsx` já no projeto (`import-catalog`), `export-csv.ts`, padrões de hooks já estabelecidos

## Resultado esperado

- Importação de **759 clientes + 94 NFs + 759 equipamentos** em poucos cliques, com deduplicação visível e relatório
- Cadastro **enriquecido por IA** sob demanda ou em massa: CNPJ, CNAE, porte, redes sociais, decisor, fontes
- Visão **360° por cliente** integrando CRM + faturamento SAP + frota XCMG + vendas internas
- Base limpa, sem duplicados, com origem rastreável e prontinha para a equipe comercial agir

