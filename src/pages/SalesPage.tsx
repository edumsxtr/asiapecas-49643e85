import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSales, useUpdateSaleStatus, useDeleteSale, type Sale } from "@/hooks/use-sales";
import { Plus, Eye, Trash2, ClipboardList, FileDown, Settings } from "lucide-react";
import QuoteRequestsTab from "@/components/quote/QuoteRequestsTab";
import ProposalGeneratorDialog from "@/components/sales/ProposalGeneratorDialog";
import ProposalConfigTab from "@/components/sales/ProposalConfigTab";
import SaleItemsTable from "@/components/sales/SaleItemsTable";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  orcamento: { label: "Orçamento", variant: "outline" },
  confirmado: { label: "Confirmado", variant: "default" },
  faturado: { label: "Faturado", variant: "secondary" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

export default function SalesPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("todos");
  const [detailSale, setDetailSale] = useState<Sale | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [proposalSale, setProposalSale] = useState<Sale | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { data: sales = [], isLoading } = useSales(statusFilter);
  const updateStatus = useUpdateSaleStatus();
  const deleteMut = useDeleteSale();

  const totalPages = Math.max(1, Math.ceil(sales.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedSales = sales.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMut.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  };

  const totalMonth = sales.reduce((s, v) => s + v.total_amount, 0);
  const avgTicket = sales.length ? totalMonth / sales.length : 0;

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">Vendas</h1>
          <Button onClick={() => navigate("/pedidos/novo")}><Plus className="h-4 w-4 mr-2" />Novo Pedido</Button>
        </div>

        <Tabs defaultValue="vendas">
          <TabsList>
            <TabsTrigger value="vendas">Vendas</TabsTrigger>
            <TabsTrigger value="cotacoes" className="gap-1">
              <ClipboardList className="h-4 w-4" /> Cotações Recebidas
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-1">
              <Settings className="h-4 w-4" /> Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vendas" className="space-y-6 mt-4">
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
                      <TableHead>#</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Itens</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                    ) : sales.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma venda encontrada</TableCell></TableRow>
                    ) : pagedSales.map(sale => (
                      <TableRow key={sale.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailSale(sale)}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {(sale as any).order_number ? `#${(sale as any).order_number}` : sale.id.slice(0, 6)}
                        </TableCell>
                        <TableCell>{new Date(sale.sale_date).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="font-medium">{sale.customers?.name || "—"}</TableCell>
                        <TableCell>{sale.sale_items?.length || 0} itens</TableCell>
                        <TableCell className="font-mono">R$ {sale.total_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_MAP[sale.status]?.variant || "outline"}>
                            {STATUS_MAP[sale.status]?.label || sale.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" onClick={() => setDetailSale(sale)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Select value={sale.status} onValueChange={v => updateStatus.mutate({ id: sale.id, status: v })}>
                              <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(sale.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {sales.length > pageSize && (
                  <div className="flex items-center justify-between gap-3 p-3 border-t text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Por página</span>
                      <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                        <SelectTrigger className="h-7 w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground">· {sales.length} venda(s)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-7" disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</Button>
                      <span className="text-muted-foreground tabular-nums">Pág. {currentPage} de {totalPages}</span>
                      <Button variant="outline" size="sm" className="h-7" disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Próxima</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cotacoes" className="mt-4">
            <QuoteRequestsTab />
          </TabsContent>

          <TabsContent value="config" className="mt-4">
            <ProposalConfigTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Sale Detail Dialog */}
      <Dialog open={!!detailSale} onOpenChange={(o) => !o && setDetailSale(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes da Venda {(detailSale as any)?.order_number ? `#${(detailSale as any).order_number}` : ""}
            </DialogTitle>
          </DialogHeader>
          {detailSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{detailSale.customers?.name || "—"}</p>
                  {detailSale.customers?.company && <p className="text-sm">{detailSale.customers.company}</p>}
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={STATUS_MAP[detailSale.status]?.variant || "outline"} className="mt-1">
                    {STATUS_MAP[detailSale.status]?.label || detailSale.status}
                  </Badge>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">{new Date(detailSale.sale_date).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-primary">R$ {detailSale.total_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {detailSale.payment_method && (
                <p className="text-sm"><span className="text-muted-foreground">Pagamento:</span> {detailSale.payment_method} {detailSale.payment_terms ? `— ${detailSale.payment_terms}` : ""}</p>
              )}
              {detailSale.notes && <p className="text-sm"><span className="text-muted-foreground">Notas:</span> {detailSale.notes}</p>}

              <SaleItemsTable saleId={detailSale.id} items={detailSale.sale_items || []} />


              <div className="flex justify-end pt-2">
                <Button onClick={() => { setDetailSale(null); setProposalSale(detailSale); }} className="gap-2">
                  <FileDown className="h-4 w-4" />
                  Gerar Proposta Comercial (PDF)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Proposal Generator Dialog (institutional, with live preview) */}
      <ProposalGeneratorDialog
        sale={proposalSale}
        open={!!proposalSale}
        onOpenChange={(o) => !o && setProposalSale(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.</AlertDialogDescription>
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
