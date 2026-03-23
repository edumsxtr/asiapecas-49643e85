
# Sistema de Gestão de Peças XCMG — Lopes & Lopes

## Visão Geral
Plataforma completa para gerenciar o catálogo de peças XCMG, controle de estoque, CRM para clientes no Brasil/Venezuela/Guiana, integração com IA e pós-venda.

---

## Fase 1 — Catálogo Interativo + Análise de Estoque

### Catálogo de Peças
- Página de catálogo com busca, filtros por categoria (Mineração, Linha Amarela, Perfuratriz, Guindaste, Caminhão Elétrico), modelo de máquina e fabricante
- Cards de peças com código, descrição, preço estimado, saldo em estoque, tempo de última entrada
- **Classificação cruzada**: indicação de quais peças servem em outras máquinas/modelos para aumentar vendas
- Detalhes da peça com informações completas

### Busca com IA
- Chatbot integrado para pesquisar peças por descrição natural (ex: "preciso de um filtro para escavadeira XE215")
- A IA retorna peças compatíveis, sugestões de peças similares e compatibilidade entre modelos

### Dashboard de Estoque
- Visão geral: valor total em estoque, peças por categoria, alertas de estoque parado (>2 anos)
- Gráficos de distribuição por categoria, modelo e tempo de estoque
- Importação de planilhas Excel + cadastro manual de peças

---

## Fase 2 — CRM + Prospecção com IA

### CRM de Clientes
- Cadastro de clientes com dados de contato, localização (Brasil, Venezuela, Guiana), segmento (mineração, construção, agro)
- Pipeline de vendas com etapas (Prospecto → Contato → Negociação → Fechado)
- Histórico de interações e pedidos por cliente

### IA para Prospecção
- Sugestões automáticas de clientes potenciais baseado no segmento e região
- Chatbot para consultar: "quais clientes na Venezuela podem precisar de peças de mineração?"
- Matching inteligente: peça em estoque → segmento → região → cliente potencial

---

## Fase 3 — Pós-Venda + Controle Operacional

### Controle de Pós-Venda
- Registro de vendas realizadas com rastreamento de entrega
- Acompanhamento de satisfação e suporte técnico
- Alertas de recompra baseado no ciclo de vida da peça

### Painel Operacional Unificado
- Dashboard geral com KPIs: vendas do mês, estoque crítico, clientes ativos, pedidos pendentes
- Sidebar com navegação para todos os módulos

---

## Autenticação e Perfis
- Login com email/senha
- Perfis: Admin (acesso total), Vendedor (catálogo + CRM), Cliente (consulta de catálogo)

## Design
- Interface moderna com sidebar de navegação
- Cores da marca XCMG (amarelo/preto)
- Responsivo para desktop e tablet
- Idioma: Português BR

## Tecnologias
- Lovable Cloud (Supabase) para banco de dados, autenticação e edge functions
- Lovable AI para chatbot e sugestões inteligentes
- Upload de Excel para importação de dados
