import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer, useEnrichCustomer, useProspectFromCustomer, type Customer, type CustomerInsert } from "@/hooks/use-customers";
import { Plus, Search, Trash2, Pencil, Upload, Sparkles, Eye, Target } from "lucide-react";
import { ImportXlsxWizard } from "@/components/customers/ImportXlsxWizard";
import { customerDedupKey } from "@/lib/normalize";

const SEGMENTS = ["mineração", "construção", "logística", "energia", "agronegócio", "geral"];
const STATUSES = ["ativo", "prospect", "dormente", "sem_contato"];

const emptyCustomer: CustomerInsert = {
  name: "", company: null, cnpj_cpf: null, email: null, phone: null,
  address: null, city: null, state: null, segment: "geral", notes: null,
};

export default function CustomersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [enrichmentFilter, setEnrichmentFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerInsert>(emptyCustomer);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: customers = [], isLoading } = useCustomers(search);
  const createMut = useCreateCustomer();
  const updateMut = useUpdateCustomer();
  const deleteMut = useDeleteCustomer();
  const enrichMut = useEnrichCustomer();
  const prospectMut = useProspectFromCustomer();

  const isEmptyCustomer = (c: Customer) => !c.email && !c.phone && !c.cnpj_cpf;

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (stateFilter !== "all" && c.state !== stateFilter) return false;
      if (segmentFilter !== "all" && c.segment !== segmentFilter) return false;
      if (enrichmentFilter === "enriched" && c.enrichment_status !== "enriched") return false;
      if (enrichmentFilter === "pending" && c.enrichment_status === "enriched") return false;
      if (enrichmentFilter === "empty" && !isEmptyCustomer(c)) return false;
      return true;
    });
  }, [customers, stateFilter, segmentFilter, enrichmentFilter]);

  const emptyCount = useMemo(() => customers.filter(isEmptyCustomer).length, [customers]);
  const emptyFilteredCount = useMemo(() => filtered.filter(isEmptyCustomer).length, [filtered]);

  const states = useMemo(() => {
    const s = new Set(customers.map((c) => c.state).filter(Boolean) as string[]);
    return Array.from(s).sort();
  }, [customers]);

  const existingKeys = useMemo(() => {
    const set = new Set<string>();
    for (const c of customers) set.add(customerDedupKey(c));
    return set;
  }, [customers]);

  const pendingCount = useMemo(() => customers.filter((c) => c.enrichment_status !== "enriched").length, [customers]);

  const openCreate = () => { setEditingId(null); setForm(emptyCustomer); setOpen(true); };
  const openEdit = (c: Customer) => {
    setEditingId(c.id);
    setForm({ name: c.name, company: c.company, cnpj_cpf: c.cnpj_cpf, email: c.email, phone: c.phone, address: c.address, city: c.city, state: c.state, segment: c.segment, notes: c.notes });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name?.trim()) return;
    if (editingId) {
      updateMut.mutate({ id: editingId, ...form }, { onSuccess: () => { setOpen(false); setEditingId(null); } });
    } else {
      createMut.mutate(form, { onSuccess: () => { setOpen(false); setForm(emptyCustomer); } });
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMut.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  };

  const handleBulkEnrich = async () => {
    const pending = customers.filter((c) => c.enrichment_status !== "enriched").slice(0, 10);
    for (const c of pending) {
      try { await enrichMut.mutateAsync(c.id); } catch (_) { /* ignore */ }
    }
  };

  const totalInvoiced = customers.reduce((s, c) => s + (c.total_invoiced || 0), 0);
  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="font-display text-2xl font-bold text-foreground">CRM - Clientes</h1>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" /> Importar XLSX
            </Button>
            <Button variant="outline" onClick={handleBulkEnrich} disabled={enrichMut.isPending || pendingCount === 0}>
              <Sparkles className="h-4 w-4 mr-2" />
              Enriquecer pendentes ({Math.min(pendingCount, 10)})
            </Button>
            {emptyFilteredCount > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  const ids = filtered.filter(isEmptyCustomer).slice(0, 20).map((c) => c.id);
                  prospectMut.mutate(ids);
                }}
                disabled={prospectMut.isPending}
              >
                <Target className="h-4 w-4 mr-2" />
                Prospectar vazios ({Math.min(emptyFilteredCount, 20)})
              </Button>
            )}
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Cliente</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Clientes</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{customers.length}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Enriquecidos por IA</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-primary">{customers.length - pendingCount}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Faturado total</CardTitle></CardHeader>
            <CardContent><p className="text-xl font-bold">R$ {totalInvoiced.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Estados cobertos</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{states.length}</p></CardContent></Card>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome, empresa ou CNPJ..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="UF" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas UFs</SelectItem>
              {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={segmentFilter} onValueChange={setSegmentFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Segmento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos segmentos</SelectItem>
              {SEGMENTS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={enrichmentFilter} onValueChange={setEnrichmentFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Enriquecimento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="enriched">✨ Enriquecidos</SelectItem>
              <SelectItem value="pending">⏳ Pendentes</SelectItem>
              <SelectItem value="empty">📭 Vazios ({emptyCount})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>UF / Cidade</TableHead>
                  <TableHead>CNPJ/CPF</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Faturado</TableHead>
                  <TableHead>IA</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado</TableCell></TableRow>
                ) : filtered.map(c => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/clientes/${c.id}`)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {c.name}
                        {isEmptyCustomer(c) && <Badge variant="destructive" className="text-[10px] px-1">📭</Badge>}
                      </div>
                      {c.company && <p className="text-xs text-muted-foreground truncate max-w-xs">{c.company}</p>}
                    </TableCell>
                    <TableCell className="text-sm">{[c.state, c.city].filter(Boolean).join(" / ") || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{c.cnpj_cpf || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{c.segment || "geral"}</Badge></TableCell>
                    <TableCell className="text-sm">{c.total_invoiced ? `R$ ${(c.total_invoiced as number).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}` : "—"}</TableCell>
                    <TableCell>
                      {c.enrichment_status === "enriched" ? (
                        <Badge className="gap-1"><Sparkles className="h-3 w-3" /> IA</Badge>
                      ) : c.enrichment_status === "failed" ? (
                        <Badge variant="destructive">falhou</Badge>
                      ) : (
                        <Badge variant="outline">⏳</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/clientes/${c.id}`)} title="Ver detalhe">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => enrichMut.mutate(c.id)} disabled={enrichMut.isPending} title="Enriquecer com IA">
                          <Sparkles className="h-4 w-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <ImportXlsxWizard open={importOpen} onOpenChange={setImportOpen} existingKeys={existingKeys} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nome *</Label><Input value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>Empresa</Label><Input value={form.company || ""} onChange={e => setForm(f => ({ ...f, company: e.target.value || null }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>CNPJ/CPF</Label><Input value={form.cnpj_cpf || ""} onChange={e => setForm(f => ({ ...f, cnpj_cpf: e.target.value || null }))} /></div>
              <div><Label>Segmento</Label>
                <Select value={form.segment || "geral"} onValueChange={v => setForm(f => ({ ...f, segment: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SEGMENTS.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Telefone</Label><Input value={form.phone || ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value || null }))} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value || null }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Cidade</Label><Input value={form.city || ""} onChange={e => setForm(f => ({ ...f, city: e.target.value || null }))} /></div>
              <div><Label>Estado</Label><Input value={form.state || ""} onChange={e => setForm(f => ({ ...f, state: e.target.value || null }))} /></div>
              <div><Label>Status</Label>
                <Select value={form.relationship_status || "prospect"} onValueChange={v => setForm(f => ({ ...f, relationship_status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Endereço</Label><Input value={form.address || ""} onChange={e => setForm(f => ({ ...f, address: e.target.value || null }))} /></div>
            <div><Label>Observações</Label><Textarea value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value || null }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isPending}>{isPending ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
