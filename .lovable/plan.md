

# Plano: Sincronizar Estoque com Planilha Completa (20.436 linhas → 498k unidades → R$ 204M+)

## Diagnóstico

A planilha tem **20.436 linhas**, mas muitos materiais aparecem repetidos com estoques diferentes. Exemplo real:

| Material | Linhas na planilha | Estoque planilha (soma) | Estoque no banco |
|----------|-------------------|------------------------|-----------------|
| 860132921 | 3x (386+380+348) | **1.114** | 386 (só 1a linha) |
| 272102015 | 2x (45+20) | **65** | 85 (parece ok) |
| 453101366 | 2x (279+204) | **483** | 484 (ok) |

**O problema**: a importação original não somou os estoques das linhas duplicadas de forma consistente. Resultado: faltam ~36k unidades e ~R$ 16M em valor.

| Métrica | Planilha (correto) | Banco atual | Gap |
|---------|-------------------|-------------|-----|
| Materiais únicos | ~15.298 | 15.298 | OK |
| Unidades totais | ~498.000 | 461.669 | -36.331 |
| Valor total | ~R$ 204M+ | R$ 188M | -R$ 16M |

## Solução

### 1. Script de correção via psql
- Ler a planilha completa (20.436 linhas) com Python/pandas
- Agrupar por material, **somar estoques** de todas as linhas duplicadas
- Para preço: usar a **média ponderada** (ou o maior preço quando houver variação)
- Para `compatible_models`: **concatenar** todos os modelos únicos das linhas duplicadas
- Gerar SQL de UPDATE em massa e executar direto no banco

### 2. Execução
- Processar o arquivo `Peças_Valor_estimado.xlsx` com pandas
- Gerar updates em batches de 500 via `psql`
- Verificar totais finais: deve bater ~498k unidades e ~R$ 204M+

### 3. Validação
- Query de verificação final comparando totais do banco com totais da planilha
- Se houver materiais na planilha que não existem no banco, inserir como novos

## Detalhes Técnicos
- Usar `psql` com INSERT access para inserir novos materiais (se existirem)
- Para updates, criar migration SQL com tabela temporária
- O script roda fora do app, direto no banco — sem timeout de edge function

## Arquivos
- Nenhum arquivo do projeto precisa mudar — é apenas correção de dados no banco
- Após correção, os dashboards e catálogo refletirão automaticamente os valores corretos

