import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useMarketResearchOverview, useAddMarketResearch, useUpdateMarketResearch, useDeleteMarketResearch } from "@/hooks/use-market-research";
import { useParts, formatBRL } from "@/hooks/use-parts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, TrendingDown, TrendingUp, Minus, Plus, Pencil, Trash2, Loader2, AlertTriangle, Brain } from "lucide-react";
import { toast } from "sonner";
import { useAutoMarketResearch } from "@/hooks/use-auto-market-research";

type ResearchEntry = NonNullable<ReturnType<typeof useMarketResearchOverview>["data"]>[number];

export default function MarketResearchPage() {
  const { data: research = [], isLoading } = useMarketResearchOverview();
  const addMutation = useAddMarketResearch();
  const updateMutation = useUpdateMarketResearch();
  const deleteMutation = useDeleteMarketResearch();

  const [search, setSearch] = useState("");
  const [filterDistributor, setFilterDistributor] = useState<string>("all");
  const [filterAvailability, setFilterAvailability] = useState<string>("all");
  const [editEntry, setEditEntry] = useState<ResearchEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<ResearchEntry | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);

  // Filters
  const distributors = [...new Set(research.map(r => r.distributor_name))].sort();

  const filtered = research.filter(r => {
    if (filterDistributor !== "all" && r.distributor_name !== filterDistributor) return false;
    if (filterAvailability !== "all" && r.availability !== filterAvailability) return false;
    if (search) {
      const s = search.toLowerCase();
      const partName = r.parts?.material || "";
      const partDesc = r.parts?.description || "";
      if (!r.distributor_name.toLowerCase().includes(s) && !partName.toLowerCase().includes(s) && !partDesc.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  // KPIs
  const uniqueParts = new Set(research.map(r => r.part_id)).size;
  const totalEntries = research.length;
  const uniqueDistributors = new Set(research.map(r => r.distributor_name)).size;

  // Competitiveness: avg market price vs avg our price
  const partsWithPrices = research.reduce((acc, r) => {
    if (!acc[r.part_id]) acc[r.part_id] = { market: [], ourPrice: r.parts?.estimated_price || 0 };
    acc[r.part_id].market.push(Number(r.price_found));
    return acc;
  }, {} as Record<string, { market: number[]; ourPrice: number }>);

  let competitiveCount = 0, totalCompared = 0;
  Object.values(partsWithPrices).forEach(({ market, ourPrice }) => {
    if (ourPrice > 0 && market.length > 0) {
      const avgMarket = market.reduce((a, b) => a + b, 0) / market.length;
      if (ourPrice <= avgMarket) competitiveCount++;
      totalCompared++;
    }
  });

  const handleDelete = async () => {
    if (!deleteEntry) return;
    await deleteMutation.mutateAsync({ id: deleteEntry.id, part_id: deleteEntry.part_id });
    toast.success("Pesquisa excluída");
    setDeleteEntry(null);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Pesquisa de Mercado</h1>
            <p className="text-sm text-muted-foreground mt-1">Acompanhe preços de concorrentes e competitividade</p>
          </div>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nova Pesquisa
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Peças Pesquisadas</CardTitle></CardHeader><CardContent><p className="text-3xl font-display font-bold">{uniqueParts}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total de Registros</CardTitle></CardHeader><CardContent><p className="text-3xl font-display font-bold">{totalEntries}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Distribuidores</CardTitle></CardHeader><CardContent><p className="text-3xl font-display font-bold">{uniqueDistributors}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Competitividade</CardTitle></CardHeader><CardContent>
            <p className="text-3xl font-display font-bold text-primary">{totalCompared > 0 ? `${Math.round((competitiveCount/totalCompared)*100)}%` : "—"}</p>
            <p className="text-xs text-muted-foreground">peças com preço competitivo</p>
          </CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por peça ou distribuidor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterDistributor} onValueChange={setFilterDistributor}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Distribuidor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos distribuidores</SelectItem>
              {distributors.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterAvailability} onValueChange={setFilterAvailability}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Disponibilidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="em estoque">Em estoque</SelectItem>
              <SelectItem value="sob encomenda">Sob encomenda</SelectItem>
              <SelectItem value="indisponível">Indisponível</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma pesquisa encontrada.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Peça</TableHead>
                    <TableHead>Distribuidor</TableHead>
                    <TableHead>Preço Encontrado</TableHead>
                    <TableHead>Nosso Preço</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Disp.</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 100).map((r) => {
                    const ourPrice = r.parts?.estimated_price || 0;
                    const diff = ourPrice > 0 ? ((Number(r.price_found) - ourPrice) / ourPrice) * 100 : 0;
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="font-medium text-xs">{r.parts?.material || "—"}</div>
                          <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">{r.parts?.description || "—"}</div>
                        </TableCell>
                        <TableCell className="font-medium">{r.distributor_name}</TableCell>
                        <TableCell>
                          <span className={diff < -2 ? "text-red-600" : diff > 2 ? "text-green-600 font-semibold" : ""}>
                            {formatBRL(Number(r.price_found))}
                          </span>
                        </TableCell>
                        <TableCell>{ourPrice > 0 ? formatBRL(ourPrice) : "—"}</TableCell>
                        <TableCell>{r.delivery_days ? `${r.delivery_days}d` : "—"}</TableCell>
                        <TableCell>
                          <Badge variant={r.availability === "em estoque" ? "default" : "secondary"} className="text-[10px]">{r.availability}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(r.researched_at).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditEntry(r)}><Pencil className="h-3 w-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteEntry(r)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <ResearchFormDialog
        open={!!editEntry}
        entry={editEntry}
        onClose={() => setEditEntry(null)}
        onSave={async (data) => {
          if (editEntry) {
            await updateMutation.mutateAsync({ id: editEntry.id, ...data });
            toast.success("Pesquisa atualizada");
            setEditEntry(null);
          }
        }}
        isPending={updateMutation.isPending}
      />

      {/* New Dialog */}
      <ResearchFormDialog
        open={showNewDialog}
        entry={null}
        onClose={() => setShowNewDialog(false)}
        onSave={async (data) => {
          if (!data.part_id) { toast.error("Selecione uma peça"); return; }
          await addMutation.mutateAsync({
            part_id: data.part_id!,
            distributor_name: data.distributor_name,
            price_found: data.price_found,
            delivery_days: data.delivery_days,
            payment_terms: data.payment_terms,
            availability: data.availability,
            source_url: data.source_url,
            notes: data.notes,
            researched_at: new Date().toISOString(),
            researched_by: null,
          });
          toast.success("Pesquisa registrada!");
          setShowNewDialog(false);
        }}
        isPending={addMutation.isPending}
        showPartSearch
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEntry} onOpenChange={(open) => !open && setDeleteEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pesquisa?</AlertDialogTitle>
            <AlertDialogDescription>
              Pesquisa de "{deleteEntry?.distributor_name}" será excluída permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

// --- Reusable form dialog ---
function ResearchFormDialog({ open, entry, onClose, onSave, isPending, showPartSearch }: {
  open: boolean;
  entry: ResearchEntry | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  isPending: boolean;
  showPartSearch?: boolean;
}) {
  const [form, setForm] = useState({
    part_id: "",
    distributor_name: "",
    price_found: "",
    delivery_days: "",
    payment_terms: "",
    availability: "em estoque",
    source_url: "",
    notes: "",
  });
  const [partSearch, setPartSearch] = useState("");
  const { data: partsData } = useParts({ search: partSearch, page: 0, pageSize: 10, category: null });
  const parts = partsData?.parts || [];

  // Reset form when entry changes
  const resetKey = entry?.id || (open ? "new" : "closed");
  useState(() => {
    if (entry) {
      setForm({
        part_id: entry.part_id,
        distributor_name: entry.distributor_name,
        price_found: String(entry.price_found),
        delivery_days: entry.delivery_days ? String(entry.delivery_days) : "",
        payment_terms: entry.payment_terms || "",
        availability: entry.availability || "em estoque",
        source_url: entry.source_url || "",
        notes: entry.notes || "",
      });
    } else {
      setForm({ part_id: "", distributor_name: "", price_found: "", delivery_days: "", payment_terms: "", availability: "em estoque", source_url: "", notes: "" });
    }
  });

  // Sync form with entry on open
  if (open && entry && form.distributor_name !== entry.distributor_name && form.price_found !== String(entry.price_found)) {
    setForm({
      part_id: entry.part_id,
      distributor_name: entry.distributor_name,
      price_found: String(entry.price_found),
      delivery_days: entry.delivery_days ? String(entry.delivery_days) : "",
      payment_terms: entry.payment_terms || "",
      availability: entry.availability || "em estoque",
      source_url: entry.source_url || "",
      notes: entry.notes || "",
    });
  }

  const handleSubmit = async () => {
    if (!form.distributor_name || !form.price_found) {
      toast.error("Preencha o distribuidor e o preço");
      return;
    }
    await onSave({
      part_id: form.part_id || undefined,
      distributor_name: form.distributor_name,
      price_found: parseFloat(form.price_found),
      delivery_days: form.delivery_days ? parseInt(form.delivery_days) : null,
      payment_terms: form.payment_terms || null,
      availability: form.availability,
      source_url: form.source_url || null,
      notes: form.notes || null,
    });
    setForm({ part_id: "", distributor_name: "", price_found: "", delivery_days: "", payment_terms: "", availability: "em estoque", source_url: "", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{entry ? "Editar Pesquisa" : "Nova Pesquisa de Mercado"}</DialogTitle>
          <DialogDescription>{entry ? "Atualize os dados desta pesquisa." : "Registre uma nova pesquisa de preço."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {showPartSearch && (
            <div>
              <Label className="text-xs">Peça *</Label>
              <Input placeholder="Buscar peça por código..." value={partSearch} onChange={e => setPartSearch(e.target.value)} />
              {partSearch && parts.length > 0 && (
                <div className="border rounded mt-1 max-h-32 overflow-auto">
                  {parts.map(p => (
                    <button key={p.id} className="w-full text-left text-xs px-3 py-2 hover:bg-accent" onClick={() => { setForm(f => ({ ...f, part_id: p.id })); setPartSearch(`${p.material} - ${p.description}`); }}>
                      <span className="font-mono">{p.material}</span> — {p.description}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Distribuidor *</Label>
              <Input value={form.distributor_name} onChange={e => setForm(f => ({ ...f, distributor_name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Preço encontrado *</Label>
              <Input type="number" value={form.price_found} onChange={e => setForm(f => ({ ...f, price_found: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Prazo (dias)</Label>
              <Input type="number" value={form.delivery_days} onChange={e => setForm(f => ({ ...f, delivery_days: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Disponibilidade</Label>
              <Select value={form.availability} onValueChange={v => setForm(f => ({ ...f, availability: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="em estoque">Em estoque</SelectItem>
                  <SelectItem value="sob encomenda">Sob encomenda</SelectItem>
                  <SelectItem value="indisponível">Indisponível</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Condições de pagamento</Label>
            <Input value={form.payment_terms} onChange={e => setForm(f => ({ ...f, payment_terms: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">URL fonte</Label>
            <Input value={form.source_url} onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Notas</Label>
            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSubmit} disabled={isPending} className="flex-1">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : entry ? "Salvar" : "Registrar"}
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
