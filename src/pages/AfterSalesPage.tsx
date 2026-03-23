import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAfterSales, useCreateAfterSale, useUpdateAfterSale } from "@/hooks/use-after-sales";
import { useCustomers } from "@/hooks/use-customers";
import { Plus, TicketCheck } from "lucide-react";

const TYPES = ["garantia", "devolução", "reclamação", "suporte"];
const PRIORITIES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  baixa: { label: "Baixa", variant: "outline" },
  media: { label: "Média", variant: "secondary" },
  alta: { label: "Alta", variant: "default" },
  urgente: { label: "Urgente", variant: "destructive" },
};
const STATUSES: Record<string, string> = {
  aberto: "Aberto",
  "em andamento": "Em Andamento",
  resolvido: "Resolvido",
  fechado: "Fechado",
};

export default function AfterSalesPage() {
  const [statusFilter, setStatusFilter] = useState("todos");
  const [open, setOpen] = useState(false);
  const { data: tickets = [], isLoading } = useAfterSales(statusFilter);
  const { data: customers = [] } = useCustomers();
  const createMut = useCreateAfterSale();
  const updateMut = useUpdateAfterSale();

  const [customerId, setCustomerId] = useState("");
  const [type, setType] = useState("suporte");
  const [priority, setPriority] = useState("media");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    if (!customerId || !description.trim()) return;
    createMut.mutate(
      { customer_id: customerId, type, priority, description },
      { onSuccess: () => { setOpen(false); setCustomerId(""); setDescription(""); setType("suporte"); setPriority("media"); } }
    );
  };

  const openCount = tickets.filter(t => t.status === "aberto" || t.status === "em andamento").length;
  const resolvedCount = tickets.filter(t => t.status === "resolvido" || t.status === "fechado").length;
  const byType = tickets.reduce<Record<string, number>>((acc, t) => { acc[t.type] = (acc[t.type] || 0) + 1; return acc; }, {});

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">Pós-Venda</h1>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Novo Ticket</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tickets Abertos</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-destructive">{openCount}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Resolvidos</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-primary">{resolvedCount}</p></CardContent></Card>
          {Object.entries(byType).slice(0, 2).map(([t, c]) => (
            <Card key={t}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground capitalize">{t}</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{c}</p></CardContent></Card>
          ))}
        </div>

        <div className="flex gap-2">
          {["todos", "aberto", "em andamento", "resolvido", "fechado"].map(s => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">
              {s === "todos" ? "Todos" : STATUSES[s] || s}
            </Button>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : tickets.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum ticket encontrado</TableCell></TableRow>
                ) : tickets.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>{new Date(t.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="font-medium">{t.customers?.name || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{t.type}</Badge></TableCell>
                    <TableCell><Badge variant={PRIORITIES[t.priority]?.variant || "outline"}>{PRIORITIES[t.priority]?.label || t.priority}</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate">{t.description}</TableCell>
                    <TableCell><Badge variant={t.status === "aberto" ? "destructive" : t.status === "resolvido" ? "secondary" : "outline"}>{STATUSES[t.status] || t.status}</Badge></TableCell>
                    <TableCell>
                      <Select value={t.status} onValueChange={v => updateMut.mutate({ id: t.id, status: v, resolved_at: v === "resolvido" || v === "fechado" ? new Date().toISOString() : null })}>
                        <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Ticket</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Cliente *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tipo</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Prioridade</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(PRIORITIES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Descrição *</Label><Textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createMut.isPending || !customerId || !description.trim()}>
              {createMut.isPending ? "Salvando..." : "Criar Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
