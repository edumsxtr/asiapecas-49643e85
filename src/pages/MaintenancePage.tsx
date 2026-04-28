import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useMachines, usePlanItems, useStockMap, useDeleteItem, useUpdateItem, useCreateItem, runSeedMaintenance, type Machine } from "@/hooks/use-maintenance";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, Trash2, Pencil, Download, RefreshCw, Wrench, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const INTERVALS = [100, 500, 1000, 1500, 2000];

export default function MaintenancePage() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { data: machines, isLoading: lm } = useMachines();
  const [machineId, setMachineId] = useState<string | null>(null);
  const [interval, setInterval] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [seeding, setSeeding] = useState(false);
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const createItem = useCreateItem();

  const grouped = useMemo(() => {
    const g = new Map<string, Machine[]>();
    for (const m of machines || []) {
      if (search && !m.model.toLowerCase().includes(search.toLowerCase()) && !m.category.toLowerCase().includes(search.toLowerCase())) continue;
      if (!g.has(m.category)) g.set(m.category, []);
      g.get(m.category)!.push(m);
    }
    return Array.from(g.entries());
  }, [machines, search]);

  const current = machines?.find(m => m.id === machineId) || null;
  const { data: items, isLoading: li } = usePlanItems(machineId);
  const filteredItems = useMemo(() => {
    if (!items) return [];
    return interval === "all" ? items : items.filter(i => i.interval_hours === interval);
  }, [items, interval]);

  const materials = useMemo(() => Array.from(new Set(filteredItems.map(i => i.material))), [filteredItems]);
  const { data: stock } = useStockMap(materials);

  const summary = useMemo(() => {
    let skus = 0, total = 0, available = 0;
    const seen = new Set<string>();
    for (const it of filteredItems) {
      if (seen.has(it.material)) continue;
      seen.add(it.material);
      skus++;
      const s = stock?.get(it.material);
      if (s && s.stock > 0) available++;
      if (s) total += s.price * it.quantity;
    }
    return { skus, total, available };
  }, [filteredItems, stock]);

  const handleAddAll = () => {
    let added = 0;
    const seen = new Set<string>();
    for (const it of filteredItems) {
      if (seen.has(it.material)) continue;
      seen.add(it.material);
      const s = stock?.get(it.material);
      if (!s || s.stock <= 0) continue;
      addItem({
        part_id: s.id,
        material: it.material,
        description: it.description,
        unit_price: s.price,
        stock: s.stock,
        quantity: it.quantity,
      });
      added++;
    }
    toast.success(`${added} itens adicionados ao carrinho`);
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const r = await runSeedMaintenance();
      toast.success(`Importado: ${r.machinesUpserted} máquinas, ${r.itemsUpserted} itens`);
    } catch (e: any) {
      toast.error("Falha ao importar: " + (e?.message || e));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r border-border bg-muted/30 flex flex-col">
          <div className="p-3 border-b space-y-2">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-sm">Plano de Manutenção</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar máquina..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            {user && (
              <Button variant="outline" size="sm" className="w-full gap-1" onClick={handleSeed} disabled={seeding}>
                <RefreshCw className={`h-3 w-3 ${seeding ? "animate-spin" : ""}`} />
                {seeding ? "Importando..." : "Reimportar planilha"}
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-3">
            {lm && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            {grouped.map(([cat, items]) => (
              <div key={cat}>
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {cat} <span className="opacity-60">({items.length})</span>
                </div>
                {items.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMachineId(m.id)}
                    className={`w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent transition-colors ${machineId === m.id ? "bg-primary text-primary-foreground font-semibold" : ""}`}
                  >
                    {m.model}
                  </button>
                ))}
              </div>
            ))}
            {!lm && grouped.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhuma máquina cadastrada.
                {user && <Button variant="link" onClick={handleSeed}>Importar planilha</Button>}
              </div>
            )}
          </div>
        </aside>

        {/* Conteúdo */}
        <main className="flex-1 overflow-auto">
          {!current ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Selecione uma máquina para ver o plano de manutenção.
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div>
                <h1 className="text-2xl font-bold">{current.model}</h1>
                <p className="text-sm text-muted-foreground">
                  {current.category} {current.serial && `· Série: ${current.serial}`}
                </p>
              </div>

              <Tabs value={String(interval)} onValueChange={v => setInterval(v === "all" ? "all" : Number(v))}>
                <TabsList>
                  <TabsTrigger value="all">Tudo</TabsTrigger>
                  {INTERVALS.map(h => (
                    <TabsTrigger key={h} value={String(h)}>{h}h</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="flex flex-wrap gap-3 items-center justify-between p-3 bg-muted/50 rounded">
                <div className="text-sm">
                  <span className="font-bold">{summary.skus}</span> SKUs · 
                  <span className="text-green-600 font-semibold ml-1">{summary.available} em estoque</span> · 
                  <span className="ml-1">Estimado: <span className="font-bold">R$ {summary.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddAll} disabled={summary.available === 0}>
                    <ShoppingCart className="h-4 w-4 mr-1" /> Adicionar disponíveis ao carrinho
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate("/cotacao")}>
                    Ver carrinho
                  </Button>
                </div>
              </div>

              {li ? (
                <Skeleton className="h-64" />
              ) : (
                <div className="border rounded">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Grupo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="w-[120px]">Código</TableHead>
                        <TableHead className="w-[140px]">Substitutos</TableHead>
                        <TableHead className="w-[60px]">Qtd</TableHead>
                        <TableHead className="w-[60px]">Int.</TableHead>
                        <TableHead className="w-[160px]">Estoque</TableHead>
                        <TableHead className="w-[120px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map(it => {
                        const s = stock?.get(it.material);
                        const inStock = s && s.stock > 0;
                        return (
                          <TableRow key={it.id}>
                            <TableCell className="text-xs">{it.group_name}</TableCell>
                            <TableCell className="text-sm">{it.description}</TableCell>
                            <TableCell className="font-mono text-xs">{it.material}</TableCell>
                            <TableCell className="font-mono text-[10px] text-muted-foreground">
                              {it.substitute_codes.join(", ") || "—"}
                            </TableCell>
                            <TableCell>{it.quantity}</TableCell>
                            <TableCell>{it.interval_hours}h</TableCell>
                            <TableCell>
                              {!s ? (
                                <Badge variant="outline" className="text-[10px]">Sem cadastro</Badge>
                              ) : inStock ? (
                                <Badge className="bg-green-600 hover:bg-green-700">
                                  {s.stock}un · R$ {s.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </Badge>
                              ) : (
                                <Badge variant="destructive">Zerado</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {inStock && (
                                  <Button size="sm" variant="ghost" onClick={() => {
                                    addItem({
                                      part_id: s!.id, material: it.material, description: it.description,
                                      unit_price: s!.price, stock: s!.stock, quantity: it.quantity,
                                    });
                                    toast.success("Adicionado");
                                  }}>
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                )}
                                {user && (
                                  <>
                                    <Button size="sm" variant="ghost" onClick={() => setEditing(it)}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => {
                                      if (confirm("Excluir este item?")) deleteItem.mutate(it.id);
                                    }}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredItems.length === 0 && (
                        <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Nenhum filtro neste intervalo.
                        </TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {user && (
                <Button variant="outline" size="sm" onClick={() => setEditing({
                  machine_id: machineId, group_name: "Geral", description: "", material: "",
                  substitute_codes: [], quantity: 1, interval_hours: 1000, sort_order: (items?.length ?? 0),
                })}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar item
                </Button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Dialog editar/criar */}
      {editing && (
        <Dialog open onOpenChange={() => setEditing(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing.id ? "Editar item" : "Novo item"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Grupo</label>
                <Input value={editing.group_name} onChange={e => setEditing({ ...editing, group_name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold">Descrição</label>
                <Input value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold">Código</label>
                  <Input value={editing.material} onChange={e => setEditing({ ...editing, material: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold">Quantidade</label>
                  <Input type="number" value={editing.quantity} onChange={e => setEditing({ ...editing, quantity: Number(e.target.value) || 1 })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold">Intervalo (horas)</label>
                <Input type="number" value={editing.interval_hours} onChange={e => setEditing({ ...editing, interval_hours: Number(e.target.value) || 1000 })} />
              </div>
              <div>
                <label className="text-xs font-semibold">Substitutos (separe por vírgula)</label>
                <Input value={(editing.substitute_codes || []).join(", ")} onChange={e => setEditing({ ...editing, substitute_codes: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={async () => {
                try {
                  if (editing.id) {
                    await updateItem.mutateAsync(editing);
                  } else {
                    await createItem.mutateAsync(editing);
                  }
                  toast.success("Salvo");
                  setEditing(null);
                } catch (e: any) {
                  toast.error(e?.message || "Erro");
                }
              }}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
