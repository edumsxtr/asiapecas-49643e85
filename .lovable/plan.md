

# Plano: Mobile Responsivo + Treinamento de Equipe sobre Estoque

## Parte 1: Seletor de idioma no mobile do portal `/cotacao`

**Problema**: O seletor de idiomas (PT/EN/ES) e a navegacao estao dentro de `hidden md:flex` no header — invisivel no mobile.

**Solucao**: Adicionar menu hamburger no mobile com:
- Links de navegacao (Pecas, Como Funciona, FAQ)
- Seletor de idioma com bandeiras (PT/EN/ES)
- Botao WhatsApp
- Sheet/drawer lateral que abre ao clicar no icone de menu

### Arquivo: `src/pages/QuotePage.tsx`
- Adicionar botao hamburger visivel apenas no mobile (`md:hidden`)
- Usar Sheet do shadcn para menu lateral mobile
- Mover seletor de idioma e nav links para dentro do Sheet
- Manter nav desktop como esta (hidden md:flex)

## Parte 2: Pagina de Treinamento de Equipe (`/treinamento`)

Nova pagina interna (protegida) com conteudo de treinamento focado no estoque, baseado no plano de negocios da Elite Pecas XCMG.

### Conteudo do treinamento (cards interativos com abas):

**Aba 1 — Conhecimento do Estoque**
- Como funciona a classificacao por categorias (Mineracao, Linha Amarela, Perfuratriz, Guindaste, Caminhao Eletrico)
- O que significam as metricas: giro de estoque, capital parado, estoque critico
- Como interpretar o dashboard e agir sobre pecas paradas ha mais de 2 anos

**Aba 2 — Processo de Vendas**
- Fluxo: Cotacao → Orcamento → Pedido → Faturamento → Entrega
- Como usar o portal do cliente (`/cotacao`) para receber pedidos
- Como converter prospects em clientes

**Aba 3 — Atendimento ao Cliente**
- Regioes atendidas: Brasil, Venezuela, Guiana
- Segmentos: mineracao, construcao civil, infraestrutura
- Como usar o pos-venda para fidelizar

**Aba 4 — Ferramentas do Sistema**
- Tour rapido por cada modulo (Dashboard, Catalogo, Estoque, Vendas, Prospeccao)
- Dicas de produtividade: atalhos, filtros, pesquisa IA

### Interatividade:
- Cards com icones e descricoes
- Checklist de progresso (localStorage) — "Marcar como lido"
- Quiz rapido ao final de cada aba (3 perguntas multipla escolha)
- Barra de progresso geral do treinamento

## Parte 3: Link no Sidebar

Adicionar item "Treinamento" no grupo "Ferramentas" do sidebar com icone `GraduationCap`.

## Arquivos a criar/editar

| Arquivo | Acao |
|---------|------|
| `src/pages/QuotePage.tsx` | Editar — menu hamburger mobile com seletor de idioma |
| `src/pages/TrainingPage.tsx` | Criar — pagina de treinamento com 4 abas, quiz, checklist |
| `src/components/AppSidebar.tsx` | Editar — adicionar link "Treinamento" |
| `src/App.tsx` | Editar — rota `/treinamento` protegida |

Sem alteracoes no banco de dados.

