import { useState } from "react";
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
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer, type Customer, type CustomerInsert } from "@/hooks/use-customers";
import { Plus, Search, Trash2, Pencil } from "lucide-react";

const SEGMENTS = ["mineração", "construção", "logística", "energia", "geral"];

const emptyCustomer: CustomerInsert = {
  name: "", company: null, cnpj_cpf: null, email: null, phone: null,
  address: null, city: null, state: null, segment: "geral", notes: null,
};

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerInsert>(emptyCustomer);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: customers = [], isLoading } = useCustomers(search);
  const createMut = useCreateCustomer();
  const updateMut = useUpdateCustomer();
  const deleteMut = useDeleteCustomer();

  const openCreate = () => { setEditingId(null); setForm(emptyCustomer); setOpen(true); };
  const openEdit = (c: Customer) => {
    setEditingId(c.id);
    setForm({ name: c.name, company: c.company, cnpj_cpf: c.cnpj_cpf, email: c.email, phone: c.phone, address: c.address, city: c.city, state: c.state, segment: c.segment, notes: c.notes });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
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

  const segmentCounts = customers.reduce<Record<string, number>>((acc, c) => {
    const s = c.segment || "geral";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const thisMonth = customers.filter(c => {
    const d = new Date(c.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">CRM - Clientes</h1>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Cliente</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Clientes</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{customers.length}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Novos este mês</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-primary">{thisMonth}</p></CardContent></Card>
          {Object.entries(segmentCounts).slice(0, 2).map(([seg, count]) => (
            <Card key={seg}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground capitalize">{seg}</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{count}</p></CardContent></Card>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, empresa ou CNPJ..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ/CPF</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : customers.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado</TableCell></TableRow>
                ) : customers.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.company || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{c.cnpj_cpf || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{c.segment || "geral"}</Badge></TableCell>
                    <TableCell>{c.phone || "—"}</TableCell>
                    <TableCell>{c.email || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
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

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
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
              <div><Label>Endereço</Label><Input value={form.address || ""} onChange={e => setForm(f => ({ ...f, address: e.target.value || null }))} /></div>
            </div>
            <div><Label>Observações</Label><Textarea value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value || null }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isPending}>{isPending ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
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
