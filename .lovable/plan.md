## Visão geral

Vamos reestruturar toda a cadeia **Cliente → Proposta → Histórico** para refletir o padrão do PDF da BORAPEÇAS (preto e branco, institucional). Tudo configurável em **Configurações**, com **pré-visualização** antes de gerar o PDF.

---

## 1. Cadastro de Cliente PJ (expandido)

Ampliar a tela de cliente para incluir, em abas/seções:

**Dados fiscais**
- Razão Social, Nome Fantasia, CNPJ
- Inscrição Estadual, Inscrição Municipal

**Endereço estruturado**
- CEP (com busca automática), Rua, Número, Complemento, Bairro, Cidade, UF

**Contatos múltiplos**
- Lista (nome, cargo, telefone, email, "principal" sim/não)
- Botão "Adicionar contato"

**Aba "Propostas / Orçamentos"** (nova, dentro do detalhe do cliente)
- Lista todas as propostas geradas para aquele cliente
- Colunas: Nº proposta, data, validade, valor total, status (rascunho / enviada / aprovada / recusada / expirada)
- Botões: Ver PDF, Duplicar, Nova proposta

---

## 2. Configurações → nova aba "Propostas"

Centraliza todos os padrões editáveis:

**a) Vendedores** (CRUD)
- Nome, cargo, telefone, email, foto/assinatura (opcional)
- Na hora de gerar proposta, vendedor é selecionável (dropdown)

**b) Empresa (Fornecedor)**
- Já existe; complementar com: Razão Social emissora (ex: Lopes e Lopes Mineração Ltda), Inscrição Estadual, dados bancários (banco, agência, conta, favorecido, PIX)

**c) Templates de Garantia** (CRUD)
- Nome (ex: "Motor Novo Cummins", "Filtros", "Sem Garantia")
- Prazo (meses)
- Texto introdutório
- Lista de "Condições de validade" (itens)
- Lista de "Exclusões" (itens)
- Vínculo: categoria/subcategoria que aplica por padrão

**d) Templates de Condição de Pagamento** (CRUD)
- Nome (ex: "À vista PIX 5% desc.", "40% + 3x mensal", "30/60/90")
- Tipo: à vista | entrada+parcelas | parcelado puro
- Parâmetros: % entrada, nº parcelas, intervalo (dias), desconto
- Sistema calcula automaticamente valores e datas de vencimento

**e) Identidade visual da Proposta**
- Modo: **Preto e Branco Institucional** (padrão novo) / Amarelo atual
- Logo, rodapé, observações padrão

---

## 3. Fluxo de Geração da Proposta

Wizard em 4 passos, com **preview ao vivo** ao lado:

**Passo 1 — Cliente**
- Selecionar cliente existente OU cadastrar novo inline
- Validar que tem CNPJ, IE, endereço completo (avisar se faltar)
- Escolher contato principal da proposta

**Passo 2 — Itens**
- Adicionar peças (busca do catálogo)
- Por item: quantidade, condição (Novo/Recondicionado/Usado), valor unitário (sugerido pelo markup, editável)
- **Garantia por item**: sistema sugere template pela categoria da peça; vendedor pode trocar template ou editar texto/prazo individual ("Templates + override no item")
- Local de retirada por item (endereço)

**Passo 3 — Condições**
- Vendedor responsável (dropdown)
- Validade da proposta (dias)
- Template de pagamento (dropdown) → gera tabela de boletos automaticamente, com datas editáveis
- Frete (Por conta do comprador / FOB / CIF / valor)
- Observações gerais

**Passo 4 — Preview & Gerar**
- **Pré-visualização HTML fiel ao PDF final** (lado a lado com botões)
- Botões: Voltar, Salvar Rascunho, **Gerar PDF**, Enviar por WhatsApp/Email
- Só consome o "render PDF" no clique final → economia

---

## 4. Novo PDF Padrão (Preto e Branco Institucional)

Replicando a estrutura do exemplo BORAPEÇAS:

```text
┌──────────────────────────────────────────────┐
│ [LOGO ÁSIA]              Proposta nº AP-...  │
│                          Data / Validade     │
├──────────────────────────────────────────────┤
│ Parágrafo de apresentação personalizado      │
│                                              │
│ 1. IDENTIFICAÇÃO DAS PARTES                  │
│ ┌────────────────┬────────────────┐          │
│ │  FORNECEDOR    │    CLIENTE     │          │
│ └────────────────┴────────────────┘          │
│                                              │
│ 2. OBJETO DA PROPOSTA                        │
│ [tabela: Item|Descrição|Qtd|Condição|Vlr]    │
│                              TOTAL: R$ ...   │
│                                              │
│ 3. CONDIÇÕES COMERCIAIS & DADOS BANCÁRIOS    │
│ [tabela parcelas + bloco dados bancários]    │
│                                              │
│ 4. PRAZO, RETIRADA E FRETE                   │
│ [tabela com endereço de retirada por item]   │
│                                              │
│ 5. GARANTIA                                  │
│ [texto + condições + exclusões — por item    │
│  agrupado quando templates iguais]           │
│                                              │
│ 6. OBSERVAÇÕES GERAIS                        │
│                                              │
│ Atenciosamente,                              │
│ [Vendedor selecionado] — contatos            │
└──────────────────────────────────────────────┘
       Rodapé fixo: Ásia Peças | site | tel
```

Tipografia serifada institucional para títulos, sans para corpo. Sem cores fortes — preto, cinzas, fundos brancos, linhas finas.

---

## 5. Numeração de Propostas

Formato `AP-DDMMAAAA-NNN` (igual ao exemplo), sequencial por dia. Gerado no backend ao salvar rascunho.

---

## Detalhes Técnicos

**Banco (migrations):**
- `customers`: adicionar `legal_name`, `trade_name`, `state_registration`, `municipal_registration`, `address_street`, `address_number`, `address_complement`, `address_district`, `address_city`, `address_state`, `address_zip`
- Nova tabela `customer_contacts` (FK customers, nome, cargo, telefone, email, is_primary)
- Nova tabela `salespeople` (nome, cargo, telefone, email, signature_url, active)
- Nova tabela `warranty_templates` (nome, prazo_meses, intro_text, conditions[], exclusions[], default_for_category)
- Nova tabela `payment_condition_templates` (nome, tipo, entry_pct, installments, interval_days, discount_pct)
- `proposal_settings`: adicionar `legal_company_name`, `state_registration`, `bank_name`, `bank_agency`, `bank_account`, `bank_favored`, `pix_key`, `pdf_theme` (`bw_institutional` | `yellow_legacy`)
- `sales`: adicionar `proposal_number` (AP-...), `warranty_overrides` (jsonb por item via `sale_items.warranty_template_id` + `warranty_custom_text`), `payment_template_id`, `payment_schedule` (jsonb com parcelas calculadas), `salesperson_id`, `pickup_locations` (jsonb por item), `freight_terms`
- `sale_items`: adicionar `condition` (Novo/Recond/Usado), `warranty_template_id`, `warranty_custom`, `pickup_address`

**Frontend:**
- `src/pages/CustomerDetailPage.tsx`: nova aba "Propostas"
- `src/components/customers/CustomerFormDialog.tsx`: campos fiscais + endereço + contatos
- `src/pages/ProposalWizardPage.tsx` (novo): wizard 4 passos com preview lado-a-lado
- `src/components/proposals/ProposalPreview.tsx` (novo): renderiza HTML fiel ao PDF
- `src/components/settings/`: 4 novas abas (Vendedores, Garantias, Pagamento, Identidade Proposta)
- `src/lib/generate-proposal-pdf.ts`: refatorar para tema "bw_institutional" replicando estrutura BORAPEÇAS; manter `yellow_legacy` como fallback
- Hooks: `use-salespeople`, `use-warranty-templates`, `use-payment-templates`, `use-customer-proposals`

**Fora do escopo:**
- Envio automático por email (deixa só botão "Baixar/Compartilhar")
- Assinatura digital
- Aprovação online pelo cliente
- Conversão de proposta em pedido/NF (pode ser próxima etapa)

---

## Entregáveis

1. Cadastro de cliente PJ completo com contatos múltiplos
2. Aba Configurações → Propostas (vendedores, garantias, pagamento, identidade)
3. Wizard de geração com preview ao vivo
4. PDF preto e branco institucional padrão BORAPEÇAS
5. Aba "Propostas" no detalhe do cliente com histórico

Aprovando, eu implemento em ordem: migrations → cadastro cliente → configurações → wizard+preview → PDF novo → histórico no cliente.