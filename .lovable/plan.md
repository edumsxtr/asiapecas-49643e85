

# Plano: Portal Multilíngue (PT/EN/ES) + Limpeza de Caracteres Chineses

## Diagnóstico

- O portal do cliente (`/cotacao`) está 100% em português
- Existem **3 peças** no banco com caracteres chineses nas descrições (ex: `海绵` = "esponja", `（` = parêntese full-width)
- O portal atende Brasil, Venezuela e Guiana — precisa de inglês e espanhol

## O que vou fazer

### 1. Sistema de idiomas no portal (i18n leve)

Criar um dicionário de traduções (PT/EN/ES) sem dependência externa. Um seletor de idioma no header do portal (bandeiras BR/US/ES).

Todas as strings do portal serão traduzidas:
- Hero: título, subtítulo, placeholder de busca, nomes de categorias
- "Como Funciona": títulos e descrições dos 3 passos
- Cards de peças: "Detalhes", "Cotar", "Adicionado", "Indisponível"
- Carrinho: labels do formulário, botões, mensagens
- FAQ: perguntas e respostas em 3 idiomas
- Footer: textos institucionais
- Chat: mensagem inicial e placeholder

### 2. Limpeza de caracteres chineses no banco

Migration SQL para:
- Substituir `海绵` por "ESPONJA" nas 2 peças (material 310202069 e 310202070)
- Substituir `（` por `(` e `）` por `)` em todas as descrições

### 3. Arquivos a criar/editar

| Arquivo | Ação |
|---------|------|
| `src/components/quote/translations.ts` | Criar — dicionário PT/EN/ES com todas as strings |
| `src/pages/QuotePage.tsx` | Editar — estado de idioma + seletor no header + passar idioma aos componentes |
| `src/components/quote/QuoteHero.tsx` | Editar — usar traduções |
| `src/components/quote/QuoteCatalog.tsx` | Editar — usar traduções |
| `src/components/quote/QuotePartCard.tsx` | Editar — usar traduções |
| `src/components/quote/QuotePartDetail.tsx` | Editar — usar traduções |
| `src/components/quote/QuoteCart.tsx` | Editar — usar traduções |
| `src/components/quote/QuoteFAQ.tsx` | Editar — FAQs em 3 idiomas |
| `src/components/quote/QuoteFooter.tsx` | Editar — usar traduções |
| `src/components/quote/QuoteChat.tsx` | Editar — mensagem inicial + placeholder por idioma |
| Migration SQL | Limpar caracteres chineses das descrições |

### Detalhes técnicos

- O dicionário será um objeto `Record<Lang, Record<string, string>>` com chaves semânticas
- O seletor de idioma será 3 botões com bandeira/código (PT, EN, ES) no header
- As descrições das peças ficam em português (dados do banco) — apenas a interface muda de idioma
- O chat da IA receberá instrução do idioma selecionado para responder no mesmo idioma

