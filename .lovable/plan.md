

# Por que está demorando — e como resolver rápido

## O problema
O banco tem **461k unidades** (meta: **498k**). A diferença de ~37k unidades precisa ser atualizada em ~15k registros. As tentativas anteriores falharam por:
1. **Timeout do script Python** — 300s não foi suficiente para 77 chamadas HTTP sequenciais
2. **Circuit breaker do banco** — muitas queries simultâneas

## Solução: Uma única migration SQL

Em vez de chamar a edge function 77 vezes, vou gerar **uma única migration SQL** com todos os 15k UPDATEs usando uma tabela temporária. Isso executa direto no banco, sem HTTP, sem timeouts.

### Passos
1. Processar o Excel com Python e gerar um arquivo SQL com:
   ```sql
   CREATE TEMP TABLE _fix(material text, stock int, price numeric);
   INSERT INTO _fix VALUES ('100000005',8,54.55), ... (15k valores);
   UPDATE parts SET stock=f.stock, estimated_price=f.price 
   FROM _fix f WHERE parts.material=f.material;
   ```
2. Executar via **migration tool** (roda direto no Postgres, sem limite de timeout HTTP)
3. Validar os totais: ~498k unidades, ~R$ 205M

### Depois dos updates
4. Criar tabela `market_research` + RLS
5. Implementar UI de pesquisa de mercado no detalhe da peça
6. Edge function `part-research` com IA para compatibilidade

Isso resolve em **1 passo** em vez de 77 chamadas HTTP.

