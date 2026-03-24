

# Plano: Separar botões flutuantes + Corrigir WhatsApp

## Problema

1. **Sobreposição**: O botão do WhatsApp e o botão do carrinho estão ambos em `fixed bottom-6 right-6 z-50` — ficam sobrepostos, causando cliques errados
2. **Número WhatsApp incorreto**: O link usa `559597400928` (faltando dígito). O correto é `5595974009289` (55 + 95 + 974009289)

## Solução

### 1. Reposicionar botões flutuantes

- **Carrinho**: manter `bottom-6 right-6` (posição principal)
- **WhatsApp**: mover para `bottom-24 right-6` (acima do carrinho, com espaço)
- **Chat IA**: já está em `bottom-6 left-6` (sem conflito)

### 2. Corrigir número WhatsApp em todos os lugares

Trocar `559597400928` por `5595974009289` em:
- `QuotePage.tsx` (header + botão flutuante)
- `QuoteFAQ.tsx` (botão "Fale com especialista")

## Arquivos a editar

| Arquivo | Ação |
|---------|------|
| `src/pages/QuotePage.tsx` | Mover WhatsApp para `bottom-24`, corrigir número |
| `src/components/quote/QuoteFAQ.tsx` | Corrigir número do WhatsApp |

