

# Plano: Catálogo do Cliente com Técnicas Avançadas de E-commerce

## Objetivo
Transformar o portal `/cotacao` num catálogo que prende a atenção do cliente, incentiva exploração e maximiza conversão usando técnicas comprovadas de e-commerce.

## Melhorias

### 1. Filtros Avançados no Catálogo (QuoteCatalog)

Sidebar lateral com filtros persistentes:
- **Por fabricante**: dropdown com contagem de peças por fabricante
- **Por modelo de máquina**: dropdown agrupado
- **Por disponibilidade**: "Pronta Entrega" vs "Sob Consulta"
- **Busca por código exato**: campo separado para quem já sabe o material
- **Limpar filtros**: botão visível quando há filtros ativos
- **Contagem de resultados** atualizada em tempo real

### 2. Técnicas de E-commerce no QuotePartCard

- **"Pronta Entrega"**: badge verde pulsante quando stock > 10
- **"Últimas unidades!"**: badge vermelha quando stock entre 1-5 (escassez)
- **"Compatibilidade verificada por IA"**: selo de confiança no card quando tem dados IA
- **Hover com preview rápido**: ao passar o mouse, mostra descrição técnica da IA em tooltip
- **Animação de entrada**: cards aparecem com fade-in escalonado (stagger)
- **"Peças populares"**: seção no topo com as 4 peças mais vendidas (cross com sale_items)
- **"Vistos recentemente"**: barra fixa inferior com últimos 5 itens clicados (localStorage)

### 3. Seção "Peças Populares" e "Recomendados"

Antes do grid principal, 2 carrosséis horizontais:
- **"Mais Cotados"**: query nas peças que mais aparecem em `quote_requests.items`
- **"Novidades em Estoque"**: peças adicionadas recentemente (ordered by created_at)
- Cards menores, scroll horizontal, clicáveis

### 4. Ordenação Visível

Dropdown de ordenação acima do grid:
- Relevância (padrão)
- Maior estoque
- Nome A-Z
- Adicionados recentemente

### 5. Contador de Urgência e Social Proof

- **"X pessoas cotaram esta peça"**: contador baseado em quote_requests (contagem real)
- **"Estoque atualizado hoje"**: timestamp da última importação
- **Barra de progresso do carrinho**: "Adicione mais X peças para cotação especial"

### 6. Mobile Otimizado

- Filtros em sheet/drawer lateral (botão "Filtros" flutuante)
- Cards em 1 coluna com layout compacto
- Carrinho como bottom sheet
- Busca com sugestões autocomplete

## Traduções

Todas as novas strings serão adicionadas ao `translations.ts` em PT/EN/ES.

## Arquivos a criar/editar

| Arquivo | Ação |
|---------|------|
| `src/components/quote/QuoteCatalog.tsx` | Reescrever — sidebar filtros, ordenação, seções populares, social proof |
| `src/components/quote/QuotePartCard.tsx` | Editar — badges escassez, pronta entrega, hover preview, animação |
| `src/components/quote/translations.ts` | Editar — novas strings (filtros, ordenação, urgência) |
| `src/pages/QuotePage.tsx` | Editar — passar novos estados de filtro ao catálogo |
| `src/components/quote/QuoteHero.tsx` | Editar — adicionar stats ("15.000+ peças disponíveis") |

Nenhuma alteração no banco de dados.

