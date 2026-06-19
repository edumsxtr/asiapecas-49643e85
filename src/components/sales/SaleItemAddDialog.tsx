import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAddSaleItem } from "@/hooks/use-sale-items";

type Part = { id: string; material: string; description: string; estimated_price: number | null; consumer_price: number | null };

export default function SaleItemAddDialog({
  saleId,
  open,
  onOpenChange,
}: {
  saleId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const add = useAddSaleItem();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Part | null>(null);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  const { data: results = [] } = useQuery({
    queryKey: ["parts-search", search],
    queryFn: async () => {
      if (search.trim().length < 2) return [] as Part[];
      const { data, error } = await supabase
        .from("parts")
        .select("id, material, description, sell_price, cost_price")
        .or(`material.ilike.%${search}%,description.ilike.%${search}%`)
        .limit(15);
      if (error) throw error;
      return (data || []) as Part[];
    },
    enabled: open && search.trim().length >= 2,
  });

  const subtotal = useMemo(() => qty * price, [qty, price]);

  function pick(p: Part) {
    setSelected(p);
    setPrice(Number(p.sell_price || p.cost_price || 0));
  }

  function reset() {
    setSearch("");
    setSelected(null);
    setQty(1);
    setPrice(0);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar item à venda</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {!selected ? (
            <>
              <Input
                placeholder="Buscar por código ou descrição (mín. 2 letras)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              <div className="max-h-64 overflow-auto rounded-md border divide-y">
                {results.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">
                    {search.length < 2 ? "Digite para buscar peças." : "Nenhum resultado."}
                  </p>
                ) : (
                  results.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => pick(p)}
                      className="w-full text-left p-2 hover:bg-muted/50"
                    >
                      <p className="font-mono text-xs">{p.material}</p>
                      <p className="text-sm">{p.description}</p>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                <p className="font-mono text-xs text-muted-foreground">{selected.material}</p>
                <p>{selected.description}</p>
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
              <Button variant="link" size="sm" onClick={() => setSelected(null)} className="px-0">
                ← Escolher outra peça
              </Button>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={!selected || !saleId || add.isPending}
            onClick={() =>
              saleId && selected &&
              add.mutate(
                { sale_id: saleId, part_id: selected.id, quantity: qty, unit_price: price },
                { onSuccess: () => { reset(); onOpenChange(false); } }
              )
            }
          >
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
