

# Plano: Portal do Cliente Profissional — Estilo Extra Maquinas

## Referencia Visual

O site da Extra Maquinas tem: hero banner com video/imagem, navegacao por categorias com sidebar, cards de produtos com imagens e specs tecnicas, botao WhatsApp flutuante, secao institucional, e pagina de pecas com busca lateral.

## O que vou fazer

### 1. Reescrever `QuotePage.tsx` como portal completo

**Header profissional**:
- Logo Lopes & Lopes com cores amarelo/preto (brand)
- Menu horizontal: Inicio, Pecas, Maquinas, Sobre Nos, Contato
- Botao "Solicitar Atendimento" destacado
- Botao WhatsApp flutuante no canto inferior direito

**Hero Section**:
- Banner com gradiente amarelo/preto e titulo: "Pecas Originais XCMG"
- Subtitulo: "Distribuidor autorizado — Brasil, Venezuela, Guiana"
- Campo de busca grande centralizado
- Cards de destaque: Mineracao, Linha Amarela, Perfuratriz, Guindaste, Caminhao Eletrico (filtros rapidos por categoria)

**Catalogo com sidebar de filtros**:
- Sidebar esquerda: categorias clicaveis (Mineracao, Linha Amarela, etc.), filtro por modelo de maquina, filtro por fabricante
- Grid de pecas 3 colunas com cards visuais: codigo em badge amarelo, descricao, modelo, disponibilidade, botao "Adicionar a Cotacao"
- Paginacao ou infinite scroll

**Secao "Como Funciona"**:
- 3 passos visuais: 1) Busque a peca, 2) Monte seu pedido, 3) Receba sua cotacao
- Icones ilustrativos

**Secao FAQ / Tire Duvidas**:
- Accordion com perguntas frequentes (prazo de entrega, garantia, formas de pagamento, como rastrear pedido)
- Botao "Fale com um Especialista" que abre WhatsApp

**Secao Institucional**:
- Sobre a Lopes & Lopes (texto do plano de negocios)
- Segmentos atendidos
- Regioes de atuacao

**Footer**:
- Contato, redes sociais, CNPJ, endereco
- Links rapidos

### 2. Carrinho lateral (drawer)

Em vez de card inline, o carrinho abre como sheet/drawer lateral:
- Lista de itens com +/- quantidade
- Botao "Solicitar Cotacao" que abre o formulario
- Sempre visivel como icone flutuante com badge de contagem

### 3. Chat de duvidas integrado

- Botao "Tire suas duvidas" que abre um mini-chat com IA (reutiliza a edge function `chat`)
- O cliente pode perguntar sobre pecas, compatibilidade, prazos
- Resposta automatica baseada no estoque real

### 4. Detalhes da peca (dialog melhorado)

Ao clicar "Ver Detalhes" no card:
- Modal com: codigo, descricao completa, modelo de maquina, disponibilidade
- Se tem pesquisa IA salva: mostra compatibilidade, funcao provavel, specs tecnicas
- Botao "Adicionar a Cotacao" no modal
- Pecas relacionadas/similares (query ILIKE)

## Arquivos a criar/editar

| Arquivo | Acao |
|---------|------|
| `src/pages/QuotePage.tsx` | Reescrever completo — portal profissional |
| `src/components/quote/QuoteHero.tsx` | Criar — hero banner com busca |
| `src/components/quote/QuoteCatalog.tsx` | Criar — catalogo com sidebar + grid |
| `src/components/quote/QuotePartCard.tsx` | Criar — card de peca estilo e-commerce |
| `src/components/quote/QuotePartDetail.tsx` | Criar — dialog detalhes com dados IA |
| `src/components/quote/QuoteCart.tsx` | Criar — drawer lateral do carrinho |
| `src/components/quote/QuoteFAQ.tsx` | Criar — accordion de perguntas frequentes |
| `src/components/quote/QuoteFooter.tsx` | Criar — footer institucional |
| `src/components/quote/QuoteChat.tsx` | Criar — mini-chat com IA para duvidas |

Nenhuma alteracao no banco de dados necessaria — usa as mesmas tabelas `parts`, `quote_requests`, e `ai_compatibility_results`.

