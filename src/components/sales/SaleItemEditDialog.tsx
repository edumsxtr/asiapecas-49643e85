import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUpdateSaleItem } from "@/hooks/use-sale-items";
import type { SaleItem } from "@/hooks/use-sales";

export default function SaleItemEditDialog({
  item,
  open,
  onOpenChange,
}: {
  item: SaleItem | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const update = useUpdateSaleItem();
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  useEffect(() => {
    if (item) {
      setQty(item.quantity);
      setPrice(Number(item.unit_price));
    }
  }, [item]);

  if (!item) return null;
  const subtotal = qty * price;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar item</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p className="font-mono text-xs text-muted-foreground">{item.parts?.material || "—"}</p>
            <p className="text-sm">{item.parts?.description || "—"}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantidade</Label>
              <Input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
            </div>
            <div>
              <Label>Preço unitário (R$)</Label>
              <Input type="number" step="0.01" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} />
            </div>
          </div>
          <div className="text-right text-sm">
            Subtotal: <span className="font-mono font-medium">R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={update.isPending}
            onClick={() =>
              update.mutate(
                { id: item.id, sale_id: item.sale_id, quantity: qty, unit_price: price },
                { onSuccess: () => onOpenChange(false) }
              )
            }
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
