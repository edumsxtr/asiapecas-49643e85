

# Plano: Prospecção Completa — Contatos Reais + Peças Sugeridas + Interface Interativa

## Problema Atual

1. A IA gera prospects sem telefone/email — campos ficam vazios
2. A tabela mostra apenas "X peças" sem detalhar quais
3. Falta interatividade: não dá para ver detalhes, peças sugeridas, ou agir rapidamente
4. O resumo da IA fica escondido no dialog de edição

## O que vou fazer

### 1. Atualizar Edge Function `prospect-search`

Alterar o prompt e o schema da tool call para a IA retornar:
- **Telefone** (formato do país, ex: +55 11 9xxxx-xxxx)
- **Email** (email comercial provável, ex: contato@empresa.com.br)
- **CNPJ** (quando disponível/estimável)
- **Peças recomendadas** com descrição (não só código): ex: "860132921 - Filtro de óleo hidráulico"
- **Justificativa por peça**: por que aquela peça é relevante para o prospect

Adicionar esses campos no schema da function tool e salvar no banco.

### 2. Redesign da Página de Prospecção

**Cards de prospect** em vez de tabela pura — cada prospect vira um card expandível:
- Header: Nome, Empresa, Score (barra visual colorida), Status (seletor inline)
- Corpo expandido ao clicar:
  - Contato: telefone clicável (tel:), email clicável (mailto:), WhatsApp (link direto)
  - Localização: Cidade/Estado/País com bandeira
  - Resumo IA: texto completo da análise
  - **Peças Recomendadas**: lista visual com código, descrição, estoque atual, preço — cada uma com botão "Montar Orçamento"
  - Botões de ação: Editar, Converter para Cliente, WhatsApp, Descartar

**Pipeline visual** no topo: colunas Kanban simplificadas (Novo → Contatado → Qualificado → Negociação → Convertido) com contagem e drag visual (badges clicáveis para filtrar)

### 3. Dialog de Detalhes do Prospect

Ao clicar no prospect, abre dialog completo com:
- Todas as informações de contato (tel, email, WhatsApp, CNPJ)
- Mapa de localização conceitual (estado/cidade)
- Peças recomendadas com cards visuais (material, descrição, estoque, preço)
- Botão "Montar Orçamento" que adiciona as peças ao carrinho e redireciona para `/pedidos/novo`
- Timeline de interações (histórico de mudanças de status)
- Campo de notas editável inline

### 4. Ações Rápidas na Listagem

- Botão WhatsApp direto na linha (abre `wa.me/{phone}` com mensagem pré-formatada)
- Botão Email direto (abre mailto com assunto pré-preenchido)
- Botão "Ver Peças" que expande inline as peças sugeridas

## Banco de Dados

Sem alteração de schema — os campos `phone`, `email`, `cnpj_cpf`, `matched_parts`, `ai_summary` já existem na tabela `prospects`. Apenas a IA vai passar a preenchê-los.

## Arquivos a criar/editar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/prospect-search/index.ts` | Atualizar prompt + schema para incluir telefone, email, CNPJ, peças detalhadas |
| `src/pages/ProspectionPage.tsx` | Redesign completo: cards expandíveis, pipeline visual, ações rápidas (WhatsApp/Email), dialog detalhado com peças recomendadas |
| `src/hooks/use-prospects.ts` | Sem mudança (schema já suporta os campos) |

