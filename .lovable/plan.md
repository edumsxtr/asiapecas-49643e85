

# Plano: Atualização Instantânea via SQL Direto (segundos, não horas)

## Por que demora tanto hoje

O método atual faz **15.298 chamadas individuais** ao banco — uma por peça. Cada chamada passa por: Frontend → Edge Function HTTP → Supabase Client → Banco. Isso leva horas.

## Solução: Uma única migration SQL

Em vez de 15.298 chamadas, vou gerar **1 arquivo SQL** que atualiza tudo de uma vez usando uma tabela temporária. Execução: menos de 10 segundos.

```text
Método atual:     15.298 chamadas HTTP × ~100ms = ~25 minutos+
Método novo:      1 migration SQL com temp table = ~5 segundos
```

## Implementação

### 1. Processar a planilha com Python
- Ler `Peças_Valor_estimado.xlsx`, agrupar por material
- Somar estoques de linhas duplicadas, pegar maior preço
- Gerar arquivo SQL com INSERT INTO temp table + UPDATE parts

### 2. Executar como migration
- Criar migration SQL que:
  - Cria tabela temporária com (material, stock, price)
  - Insere os 15.298 registros
  - Faz UPDATE parts SET stock = t.stock, estimated_price = t.price FROM temp_table t WHERE parts.material = t.material
  - Dropa a tabela temporária
- Execução via ferramenta de migration (direto no banco, sem HTTP)

### 3. Validar
- Query de verificação: total deve ser ~498k unidades e ~R$ 205M+

## Resultado esperado
- De 461.669 unidades → ~498.022 unidades
- De R$ 188M → ~R$ 205M+
- Tempo: menos de 10 segundos

## Arquivos
- 1 script Python temporário (gera o SQL)
- 1 migration SQL (executa no banco)

