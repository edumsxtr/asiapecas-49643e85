

# Importar Todos os Itens da Planilha (~20.000+ linhas)

## Situação Atual
- A planilha contém **~20.436 linhas** de peças
- O sistema atual tem apenas **12 peças hardcoded** em `sample-parts.ts`
- **Não há banco de dados** configurado — sem Supabase

## Problema
20.000+ itens não podem ficar em um arquivo TypeScript estático. Isso travaria o navegador e tornaria o app inutilizável. Precisamos de um banco de dados.

## Plano

### 1. Habilitar Lovable Cloud (Supabase)
- Criar tabela `parts` com todas as colunas da planilha: material, descrição, tempo de entrada, saldo, preço estimado, fornecedor, fabricante, modelo de máquina, categorias (mineração, linha amarela, perfuratriz, caminhão elétrico, guindaste)
- Criar índices para busca eficiente por material, descrição e modelo

### 2. Importar Todos os Dados da Planilha
- Processar o Excel completo via script, extraindo todas as ~20.000 linhas
- Tratar duplicatas (mesma peça aparece em linhas diferentes com modelos diferentes — consolidar como modelos compatíveis)
- Inserir no banco de dados via migration com seed data, ou via edge function de importação

### 3. Atualizar o Frontend
- Substituir o import de `sample-parts.ts` por queries ao Supabase com paginação
- Catálogo com busca server-side, filtros e scroll infinito ou paginação
- Dashboard calculando KPIs direto do banco (totais reais, não amostra)

### 4. Funcionalidade de Upload de Planilha
- Permitir importar novas planilhas Excel para atualizar o estoque
- Parsing client-side com `xlsx` (já instalado) + insert no Supabase

## Pré-requisito
**Preciso que você habilite o Lovable Cloud** (botão no painel do projeto) para eu poder criar o banco de dados e importar os dados. Sem isso, não consigo armazenar 20.000 peças.

## Detalhes Técnicos
- Tabela: `parts` com colunas tipadas (text, integer, numeric, boolean)
- RLS habilitado com políticas de leitura pública e escrita para admin
- Queries com `react-query` + cliente Supabase
- Paginação de 50 itens por página no catálogo

