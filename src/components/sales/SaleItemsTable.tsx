import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import type { SaleItem } from "@/hooks/use-sales";
import { useDeleteSaleItem } from "@/hooks/use-sale-items";
import SaleItemEditDialog from "./SaleItemEditDialog";
import SaleItemAddDialog from "./SaleItemAddDialog";

export default function SaleItemsTable({
  saleId,
  items,
}: {
  saleId: string;
  items: SaleItem[];
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editItem, setEditItem] = useState<SaleItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<SaleItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const del = useDeleteSaleItem();

  const total = items.reduce((s, i) => s + Number(i.total_price || 0), 0);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const slice = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize]
  );

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-3 p-4 border-b">
        <div>
          <h3 className="font-semibold">Itens da venda</h3>
          <p className="text-xs text-muted-foreground">
            {items.length} item(s) · Total R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <Button size="sm" className="gap-1" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Adicionar item
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">Nenhum item nesta venda.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Material</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-center w-16">Qtd</TableHead>
              <TableHead className="text-right">Preço Unit.</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="text-right w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slice.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs py-3">{item.parts?.material || "—"}</TableCell>
                <TableCell className="text-sm py-3">{item.parts?.description || "—"}</TableCell>
                <TableCell className="text-center py-3 tabular-nums">{item.quantity}</TableCell>
                <TableCell className="text-right py-3 font-mono tabular-nums">
                  R$ {Number(item.unit_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right py-3 font-mono font-medium tabular-nums">
                  R$ {Number(item.total_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right py-3">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditItem(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteItem(item)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {items.length > pageSize && (
        <div className="flex items-center justify-between gap-3 p-3 border-t text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Por página</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="h-7 w-16"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 px-2" disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-muted-foreground tabular-nums">Pág. {currentPage} de {totalPages}</span>
            <Button variant="outline" size="sm" className="h-7 px-2" disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <SaleItemEditDialog item={editItem} open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)} />
      <SaleItemAddDialog saleId={saleId} open={addOpen} onOpenChange={setAddOpen} />

      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover item?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o item da venda e recalcula o total.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteItem) {
                  del.mutate(
                    { id: deleteItem.id, sale_id: deleteItem.sale_id },
                    { onSuccess: () => setDeleteItem(null) }
                  );
                }
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
