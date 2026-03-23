import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSales, useCreateSale, useUpdateSaleStatus, type SaleInsert } from "@/hooks/use-sales";
import { useCustomers } from "@/hooks/use-customers";
import { Plus, ShoppingCart, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  orcamento: { label: "Orçamento", variant: "outline" },
  confirmado: { label: "Confirmado", variant: "default" },
  faturado: { label: "Faturado", variant: "secondary" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

type ItemRow = { part_id: string; material: string; description: string; quantity: number; unit_price: number };

export default function SalesPage() {
  const [statusFilter, setStatusFilter] = useState("todos");
  const [open, setOpen] = useState(false);
  const { data: sales = [], isLoading } = useSales(statusFilter);
  const { data: customers = [] } = useCustomers();
  const createMut = useCreateSale();
  const updateStatus = useUpdateSaleStatus();

  const [customerId, setCustomerId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [partSearch, setPartSearch] = useState("");
  const [partResults, setPartResults] = useState<any[]>([]);

  const searchParts = async (q: string) => {
    setPartSearch(q);
    if (q.length < 2) { setPartResults([]); return; }
    const { data } = await supabase.from("parts").select("id,material,description,estimated_price,stock")
      .or(`material.ilike.%${q}%,description.ilike.%${q}%`).limit(10);
    setPartResults(data || []);
  };

  const addItem = (part: any) => {
    if (items.find(i => i.part_id === part.id)) return;
    setItems(prev => [...prev, { part_id: part.id, material: part.material, description: part.description, quantity: 1, unit_price: part.estimated_price }]);
    setPartSearch(""); setPartResults([]);
  };

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: number) => setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const total = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  const handleCreate = () => {
    if (!customerId || items.length === 0) return;
    createMut.mutate(
      { customer_id: customerId, notes: notes || null, items: items.map(({ part_id, quantity, unit_price }) => ({ part_id, quantity, unit_price })) },
      { onSuccess: () => { setOpen(false); setItems([]); setCustomerId(""); setNotes(""); } }
    );
  };

  const totalMonth = sales.reduce((s, v) => s + v.total_amount, 0);
  const avgTicket = sales.length ? totalMonth / sales.length : 0;

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">Vendas</h1>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Nova Venda</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Vendas</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{sales.length}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Valor Total</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-primary">R$ {totalMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Ticket Médio</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">R$ {avgTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Orçamentos</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{sales.filter(s => s.status === "orcamento").length}</p></CardContent></Card>
        </div>

        <div className="flex gap-2">
          {["todos", "orcamento", "confirmado", "faturado", "cancelado"].map(s => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">
              {s === "todos" ? "Todos" : STATUS_MAP[s]?.label || s}
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
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : sales.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma venda encontrada</TableCell></TableRow>
                ) : sales.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell>{new Date(sale.sale_date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="font-medium">{sale.customers?.name || "—"}</TableCell>
                    <TableCell>{sale.sale_items?.length || 0} itens</TableCell>
                    <TableCell className="font-mono">R$ {sale.total_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_MAP[sale.status]?.variant || "outline"}>
                        {STATUS_MAP[sale.status]?.label || sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select value={sale.status} onValueChange={v => updateStatus.mutate({ id: sale.id, status: v })}>
                        <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* New Sale Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Venda</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Cliente *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div>
              <Label>Adicionar Peças</Label>
              <Input placeholder="Buscar por material ou descrição..." value={partSearch} onChange={e => searchParts(e.target.value)} />
              {partResults.length > 0 && (
                <div className="border rounded-md mt-1 max-h-40 overflow-y-auto bg-background">
                  {partResults.map(p => (
                    <div key={p.id} className="px-3 py-2 hover:bg-muted cursor-pointer text-sm flex justify-between" onClick={() => addItem(p)}>
                      <span className="font-mono">{p.material}</span>
                      <span className="text-muted-foreground truncate ml-2 flex-1">{p.description}</span>
                      <span className="ml-2 font-medium">R$ {p.estimated_price.toLocaleString("pt-BR")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Preço Unit.</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs">{item.material}</TableCell>
                      <TableCell className="text-xs truncate max-w-[150px]">{item.description}</TableCell>
                      <TableCell><Input type="number" min={1} className="w-16 h-8" value={item.quantity} onChange={e => updateItem(idx, "quantity", +e.target.value)} /></TableCell>
                      <TableCell><Input type="number" min={0} step={0.01} className="w-24 h-8" value={item.unit_price} onChange={e => updateItem(idx, "unit_price", +e.target.value)} /></TableCell>
                      <TableCell className="font-mono">R$ {(item.quantity * item.unit_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => removeItem(idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-bold">Total:</TableCell>
                    <TableCell className="font-mono font-bold text-primary">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            )}

            <div><Label>Observações</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createMut.isPending || !customerId || items.length === 0}>
              {createMut.isPending ? "Salvando..." : `Criar Venda — R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
