

# Plano: Rebranding para Elite Peças XCMG + Info Institucional + WhatsApp

## O que muda

A empresa agora se chama **Elite Peças XCMG**. A logo enviada (fundo amarelo, ícone azul/amarelo) será adicionada ao projeto. O número de WhatsApp é **95 9 7400-9289** (55 95 974009289).

## Implementação

### 1. Copiar logo para o projeto
- Salvar `user-uploads://image-2.png` em `src/assets/elite-logo.png`
- Usar como `import` nos componentes

### 2. Atualizar Header do Portal (`QuotePage.tsx`)
- Trocar "LL" / "Lopes & Lopes" pela imagem da logo Elite Peças
- Atualizar link WhatsApp para `https://wa.me/559597400928`
- Botão WhatsApp verde flutuante fixo no canto inferior direito (separado do chat IA)

### 3. Atualizar Hero (`QuoteHero.tsx`)
- Manter estrutura, trocar textos de referência à marca

### 4. Atualizar Footer (`QuoteFooter.tsx`)
- Logo Elite Peças em vez de "LL"
- Nome: "Elite Peças XCMG"
- Texto institucional: distribuidor de peças XCMG, atuação Brasil/Venezuela/Guiana
- Contato real: WhatsApp 95 9 7400-9289
- Email placeholder: contato@elitepecas.com.br

### 5. Atualizar traduções (`translations.ts`)
- Trocar todas as referências "Lopes & Lopes" por "Elite Peças"
- Atualizar `footer.about` com texto institucional do plano de negócios
- Atualizar `chat.title` e `chat.greeting` com novo nome

### 6. Chat IA (`QuoteChat.tsx`)
- Trocar título para "Assistente Elite Peças"

### 7. FAQ (`QuoteFAQ.tsx`)
- Botão WhatsApp aponta para número correto

### 8. Botão WhatsApp flutuante
- Adicionar em `QuotePage.tsx` um botão verde fixo no canto inferior direito com ícone WhatsApp
- Link: `https://wa.me/559597400928` com mensagem pré-preenchida "Olá, gostaria de informações sobre peças XCMG"

## Arquivos a editar

| Arquivo | Ação |
|---------|------|
| `src/assets/elite-logo.png` | Criar — copiar logo |
| `src/pages/QuotePage.tsx` | Editar — header com logo, WhatsApp flutuante |
| `src/components/quote/QuoteHero.tsx` | Editar — referências de marca |
| `src/components/quote/QuoteFooter.tsx` | Editar — logo, nome, contato, institucional |
| `src/components/quote/QuoteChat.tsx` | Editar — título do assistente |
| `src/components/quote/QuoteFAQ.tsx` | Editar — link WhatsApp correto |
| `src/components/quote/translations.ts` | Editar — trocar "Lopes & Lopes" por "Elite Peças" em PT/EN/ES |

Sem alterações no banco de dados.

