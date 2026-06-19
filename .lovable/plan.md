# Cadastro Automático de Cliente via IA

Permitir colar um texto ou enviar um arquivo (PDF/Word) com os dados do cliente e ter o formulário de cadastro preenchido automaticamente, com revisão antes de salvar.

## Fluxo do usuário

1. Na página de Clientes, novo botão **"Cadastrar via IA"** ao lado de "Novo cliente".
2. Abre um diálogo com 3 abas:
   - **Colar texto** — textarea livre
   - **PDF** — upload de .pdf
   - **Word** — upload de .docx
3. Clica em **Extrair dados** → IA processa e retorna os campos estruturados.
4. Tela de revisão mostra todos os campos preenchidos + alerta se já existe cliente com mesmo CNPJ/email/nome.
5. Usuário ajusta o que precisar e clica em **Salvar cliente** (reusa o fluxo de criação atual).

## Campos extraídos

- **Identificação**: Razão Social, Nome Fantasia, CNPJ
- **Fiscal**: Inscrição Estadual, Inscrição Municipal
- **Endereço estruturado**: logradouro, número, complemento, bairro, cidade, UF, CEP
- **Contatos** (lista): nome, cargo, telefone, email, whatsapp — salvos em `customer_contacts`
- **Outros**: site, segmento, observações

## Detalhes técnicos

- **Nova edge function `extract-customer-from-document`**
  - Entrada: `{ text?, fileBase64?, fileType? }` (limite 10MB)
  - PDF → enviado direto ao Gemini (multimodal nativo via `type: "file"`)
  - DOCX → enviado em base64 ao Gemini (mime `application/vnd.openxmlformats-officedocument.wordprocessingml.document`)
  - Texto puro → enviado como prompt
  - Modelo: `google/gemini-2.5-flash` via Lovable AI Gateway
  - Saída validada com Zod, JSON estruturado
  - Normalização: CNPJ/CEP só dígitos, email lowercase, UF maiúsculo
- **Frontend**:
  - `src/components/customers/AICustomerImportDialog.tsx` (diálogo com tabs + revisão)
  - `src/hooks/use-extract-customer.ts` (mutation chamando a edge function)
  - Edita `src/pages/CustomersPage.tsx` para adicionar o botão
- **Detecção de duplicados**: reusa a função `preview-customer-import` existente (CNPJ exato + email + nome fuzzy).

## Fora de escopo

- OCR de PDFs escaneados (apenas imagem) — Gemini lida bem com PDFs nativos, mas digitalizações ruins podem falhar.
- Importação em lote de vários clientes num único arquivo.
- Edição do prompt pela UI (fica fixo na edge function).
