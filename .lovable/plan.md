
# Catálogo Interativo de Planos de Manutenção (Filtros)

Transformar a planilha `PLANO_DE_MANUTENÇÃO_-_FILTROS.xlsx` em uma ferramenta integrada para vendedores estudarem, simularem trocas e **montarem pedidos a partir do estoque real** — tudo dentro da plataforma, com CRUD completo e reaproveitando carrinho, vendas e propostas que já existem.

## O que a planilha tem (medido)

- **18 abas** por categoria (ESCAVADEIRA, CARREGADEIRA, ROLO, GUINDASTE, CAMINHÃO, AR CONDICIONADO, FLUIDOS, MAQUINAS ANTIGAS, etc.).
- **161 modelos de máquina** (ex.: `XE150BR-I`, `LW180KV`, `XE210W`).
- **1.227 linhas de filtro** → **581 códigos únicos** (`material`).
- Por filtro: grupo (Motor/Hidráulico/Transmissão/AR), descrição, código, código substituto, quantidade, e marcação de troca em **100h / 500h / 1000h / 1500h / 2000h**, mais agregados "trocas em 1000h" e "trocas em 2000h".
- ~50% dos códigos já existem em `parts` (verificado em amostra) — o resto vira "sem estoque cadastrado" (ainda assim listado, com botão "criar SKU").

## Modelo de dados (3 tabelas novas)

```text
maintenance_machines           maintenance_plans            maintenance_plan_items
------------------------       --------------------------   ----------------------------
id uuid pk                     id uuid pk                   id uuid pk
category text                  machine_id → machines        plan_id → plans
model text   (XE150BR-I)       interval_hours int (100..)   group text  (Motor/Hidráulico/...)
serial text   (XUGA135...)     created_at                   description text
notes text                                                  material text   (código)
created_at, updated_at                                      substitute_codes text[]
                                                            quantity int
                                                            sort_order int
```

- `interval_hours` é a "coluna" da planilha (100, 500, 1000, 1500, 2000). Cada item aparece N vezes por intervalo em que a planilha marca "1".
- `material` é a chave de junção com `parts` (estoque) — sem foreign key formal porque alguns códigos não existem ainda.

RLS:
- **leitura pública** em `maintenance_machines` e `maintenance_plan_items` (vendedores logados e portal interno).
- **CRUD** apenas para `authenticated`.

## Importador único da planilha

Edge function `import-maintenance-plan` (POST com `file_url` do Storage):
1. Lê o XLSX com `xlsx` (mesma lib do `import-catalog`).
2. Detecta cabeçalho de modelo (linha com texto na col A, vazia depois).
3. Detecta tabela de filtros pela linha "Grupo | Descrição | Código…".
4. Para cada linha cria item em todos os intervalos onde houver "1".
5. Idempotente: `(model, material, interval_hours)` é único; reimport substitui.
6. Retorna relatório: modelos criados/atualizados, itens, códigos sem match em `parts`.

Botão de upload na página nova (admin), além de seed inicial via script único.

## UI nova: página `/manutencao`

Rota protegida + entrada na sidebar ("Plano de Manutenção" — ícone `Wrench`).

Layout (3 colunas em desktop, drawer no mobile):

```text
┌─ Sidebar navegacional ────┐ ┌─ Tabela de filtros do modelo ─────────────────┐
│ 🔍 Buscar máquina/código  │ │ Modelo: XE150BR-I  ▾  • Total filtros: 13     │
│ ▾ ESCAVADEIRA (28)        │ │ Tabs intervalos: [100h][500h][1000h][1500h][2000h][TUDO] │
│   • XE150BR-I             │ │                                                │
│   • XE150BRII   ◀ ativo   │ │ Grupo | Descrição | Código | Subst | Qtd | ✓Estoque | + │
│   • XE180BR               │ │ Motor | Filtro óleo LF17535 | 800159597 | — | 1 | 12un R$420 | [+]│
│ ▾ CARREGADEIRA (26)       │ │ Motor | Filtro sep. FS20019 | 800150422 | 800159366 | 1 | 0 ❗ | [criar SKU]│
│ ▾ ROLO (7) ...            │ │ Hidr. | Filtro retorno | 860149012 | … | 1 | 4un R$1.250 | [+]│
└───────────────────────────┘ │                                                │
                              │ Resumo: simulação 1000h → 8 SKUs · R$ 14.320  │
                              │ [+ Tudo no carrinho]  [Gerar proposta]        │
                              └────────────────────────────────────────────────┘
```

Funcionalidades:
1. **Busca inteligente** (já existe `search_parts`): por modelo, código de filtro, descrição.
2. **Tabs por intervalo** filtram o `interval_hours` mostrado.
3. **Coluna estoque** lê de `parts` em tempo real — chip verde (em estoque), amarelo (baixo), vermelho (zerado).
4. **Botão `+`** adiciona ao **carrinho existente** (`CartContext`) — usa o mesmo fluxo de `/cotacao`.
5. **"+ Tudo no carrinho"** adiciona o intervalo inteiro (respeita quantidade × qtd_trocas).
6. **"Gerar proposta"** abre o fluxo já existente em `SalesPage` com itens pré-carregados.
7. **CRUD inline** (admin): editar descrição, código, substitutos, quantidade; adicionar/remover linha; clonar modelo (para variantes).
8. **Importar/Reimportar** botão admin com upload XLSX → chama edge function.

## Componentes (frontend)

```
src/pages/MaintenancePage.tsx                    — shell + roteamento por modelo (?model=)
src/components/maintenance/MachineSidebar.tsx    — árvore categoria > modelo, busca
src/components/maintenance/PlanTable.tsx         — tabela editável com tabs de intervalo
src/components/maintenance/StockChip.tsx         — pill com qty + preço
src/components/maintenance/AddAllButton.tsx      — bulk add ao carrinho
src/components/maintenance/ImportPlanDialog.tsx  — upload XLSX (admin)
src/components/maintenance/MachineEditDialog.tsx — CRUD modelo
src/components/maintenance/PlanItemEditor.tsx    — CRUD linha
src/hooks/use-maintenance.ts                     — react-query: máquinas, plano, mutations
```

Reaproveitamentos:
- `CartContext` para "adicionar ao carrinho" → mesma sacola usada em `/cotacao`.
- `useAuth` + `useRole('admin')` para mostrar botões CRUD.
- `search_parts` RPC para a busca global no header.
- `generate-proposal-pdf` para "Gerar proposta" direto da tabela.

## Integrações com o que já existe

- **Carrinho**: o botão `+` empurra `{ material, description, quantity }` no mesmo `CartContext`. Vendedor abre `/cotacao` e finaliza, ou usa `/pedidos/novo`.
- **Vendas**: ao gerar proposta, cria registro em `sales` + `sale_items` (caminho atual de `NewOrderPage`).
- **Estoque**: join lateral por `material` mostra estoque, preço, última entrada — nada duplicado, fonte única é `parts`.
- **Categoria**: itens importados que ainda não têm SKU em `parts` ficam num "buffer" — botão `[criar SKU]` abre dialog que insere em `parts` (já há permissão para `authenticated`), pré-preenchendo `material`, `description`, `subcategory='Filtros'`, `machine_model`.

## Critérios de aceitação

1. Após import, `/manutencao` mostra **161 modelos** em 18 categorias, navegáveis.
2. Selecionar **XE150BR-I → tab 1000h** mostra exatamente os filtros que a planilha marca em 1000h, com estoque atual ao lado.
3. Clicar **"+ Tudo no carrinho"** num intervalo enche o `CartContext` na quantidade certa; abrir `/cotacao` exibe os itens.
4. **Vendedor logado** vê estoque + preço; **admin** vê também botões editar/excluir/importar.
5. **CRUD funcional**: criar modelo novo, editar item, deletar item — refletido imediatamente.
6. **Reimportar a planilha** não duplica linhas (idempotente por `model+material+interval_hours`).
7. Códigos sem SKU aparecem com chip "❗ sem cadastro" + botão para criar; uma vez criado, o estoque aparece sem refresh manual.

## Etapas de implementação

1. **Migração** das 3 tabelas + RLS + índices (`material`, `(model,material,interval)` único).
2. **Edge function** `import-maintenance-plan` (parse XLSX → upsert).
3. **Seed inicial**: rodar a função uma vez com a planilha enviada (vai para Storage). Snapshot do relatório aparece no admin.
4. **UI** em `/manutencao` — readonly primeiro (sidebar + tabela + tabs + estoque + add ao carrinho).
5. **CRUD admin** (editar/criar/excluir) + upload de planilha futura.
6. **Polimento**: busca por código no header, atalho `/`, badge de estoque baixo, link "ver na ficha do produto".

Sem mudança nas telas existentes — é um módulo novo que se pluga no carrinho e propostas atuais.
