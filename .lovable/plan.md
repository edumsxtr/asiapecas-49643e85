

# Plano: Precificação + Proposta Personalizada na Área de Vendas

## Resumo

Adicionar na página de Vendas: (1) uma aba/seção de **Configuração de Proposta** onde o usuário define dados da empresa, margem global, validade, prazo de entrega, garantia e observações padrão; (2) um **dialog de personalização** antes de gerar o PDF, permitindo revisar/editar os dados da proposta; (3) usar `sell_price` nos itens do PDF em vez de `unit_price` (preço de custo).

## Problemas Atuais

- O PDF usa `unit_price` (preço de custo) nos itens em vez do `sell_price`
- Dados da empresa estão hardcoded no código (`generate-proposal-pdf.ts`)
- Não há como editar validade, prazo de entrega, garantia antes de gerar
- Não há acesso à precificação (margem) na página de Vendas -- só no Novo Pedido

## Solução

### 1. Tabela `proposal_settings` no banco

Armazenar configurações editáveis da proposta:
- `company_name`, `cnpj`, `address`, `phone`, `email` (dados da empresa)
- `default_validity_days` (validade padrão, ex: 15)
- `default_delivery_terms` (prazo de entrega padrão)
- `default_warranty_text` (texto de garantia)
- `default_observations` (observações padrão)
- `default_markup` -- reutilizar da `pricing_settings` existente

### 2. Aba "Configurações" na página de Vendas

Nova aba nas Tabs existentes (Vendas | Cotações Recebidas | **Configurações**) com:
- Card "Dados da Empresa" -- editar nome, CNPJ, endereço, telefone, email
- Card "Precificação" -- margem global (%) com botão salvar
- Card "Padrões da Proposta" -- validade, prazo de entrega, garantia, observações

### 3. Dialog de personalização antes de gerar PDF

Ao clicar "Gerar Proposta", abrir um dialog com campos pré-preenchidos (dos `proposal_settings`) que o usuário pode ajustar antes de confirmar:
- Validade da proposta
- Prazo de entrega
- Condições de garantia
- Observações extras
- Preview dos preços (sell_price vs cost)

### 4. Corrigir PDF para usar sell_price

Atualizar `generate-proposal-pdf.ts` para:
- Receber as configurações da proposta como parâmetro
- Usar `sell_price` (ou `unit_price * markup` como fallback) nos itens
- Usar dados da empresa do banco em vez de hardcoded

## Arquivos Afetados

| Arquivo | Ação |
|---|---|
| `supabase/migrations/new.sql` | Criar tabela `proposal_settings` com RLS |
| `src/hooks/use-proposal-settings.ts` | **Novo** -- CRUD para `proposal_settings` |
| `src/components/sales/ProposalConfigTab.tsx` | **Novo** -- aba de configurações |
| `src/components/sales/ProposalCustomizeDialog.tsx` | **Novo** -- dialog de personalização pré-PDF |
| `src/pages/SalesPage.tsx` | Adicionar aba Configurações + dialog de personalização |
| `src/lib/generate-proposal-pdf.ts` | Usar sell_price + dados dinâmicos da empresa |

## Detalhes Técnicos

- A tabela `proposal_settings` terá uma única linha (como `pricing_settings`), com RLS para authenticated
- O dialog de personalização receberá o `Sale` + `proposal_settings` e permitirá override temporário dos campos antes de chamar `generateProposalPDF`
- O PDF mostrará `sell_price` quando disponível, senão aplicará markup sobre `unit_price`

