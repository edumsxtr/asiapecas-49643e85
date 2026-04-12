

# Plano: Busca e Filtros na aba Cotações Recebidas

## O que será feito

Adicionar ao `QuoteRequestsTab.tsx`:

1. **Campo de busca** -- Input de texto que filtra por nome do cliente, empresa ou email
2. **Filtro por status** -- Botões (Todos / Pendente / Convertido / Cancelado) para filtrar cotações por status

A filtragem será feita no frontend (client-side) sobre os dados já carregados, sem necessidade de alterações no banco de dados.

## Arquivo afetado

| Arquivo | Mudança |
|---|---|
| `src/components/quote/QuoteRequestsTab.tsx` | Adicionar estados `search` e `statusFilter`, barra de busca + botões de filtro acima da tabela, e aplicar `useMemo` para filtrar `quotes` |

## Detalhes técnicos

- Dois novos estados: `search` (string) e `statusFilter` (string, default "todos")
- `filteredQuotes` via `useMemo`: filtra por status e depois por texto (busca case-insensitive em `customer_name`, `company`, `email`)
- Barra com `Input` (ícone Search) + 4 botões de status renderizados acima do `Card` da tabela
- Contadores vazios atualizados para refletir "nenhum resultado para o filtro"

