import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, RotateCcw, Loader2 } from "lucide-react";
import { PartsBulkFilter, usePartsBulkCount, usePartsBulkDelete, usePartsBulkZeroStock } from "@/hooks/use-admin-sources";
import { toast } from "sonner";

export function PartsBulkTab() {
  const [filter, setFilter] = useState<PartsBulkFilter>({});
  const [showCount, setShowCount] = useState(false);
  const [confirm, setConfirm] = useState<"delete" | "zero" | null>(null);

  const { data: count, isFetching } = usePartsBulkCount(filter, showCount);
  const delMut = usePartsBulkDelete();
  const zeroMut = usePartsBulkZeroStock();

  const set = (patch: Partial<PartsBulkFilter>) => { setFilter({ ...filter, ...patch }); setShowCount(false); };

  const hasAnyFilter = Object.values(filter).some(v => v !== undefined && v !== "" && v !== false);

  const handleAction = async (mode: "delete" | "zero") => {
    try {
      const n = mode === "delete" ? await delMut.mutateAsync(filter) : await zeroMut.mutateAsync(filter);
      toast.success(`${n.toLocaleString("pt-BR")} peças ${mode === "delete" ? "excluídas" : "zeradas"}`);
      setConfirm(null);
      setShowCount(false);
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="font-semibold mb-1">Limpeza em massa do catálogo</h3>
        <p className="text-xs text-muted-foreground">Combine filtros, visualize a quantidade afetada e aplique. Operações irreversíveis.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div><Label>Fabricante</Label><Input placeholder="Ex: XCMG" value={filter.manufacturer || ""} onChange={(e) => set({ manufacturer: e.target.value || undefined })} /></div>
        <div><Label>Modelo de máquina</Label><Input value={filter.machine_model || ""} onChange={(e) => set({ machine_model: e.target.value || undefined })} /></div>
        <div><Label>Categoria</Label><Input value={filter.part_category || ""} onChange={(e) => set({ part_category: e.target.value || undefined })} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Preço ≥</Label><Input type="number" value={filter.price_gte ?? ""} onChange={(e) => set({ price_gte: e.target.value ? +e.target.value : undefined })} /></div>
          <div><Label>Preço ≤</Label><Input type="number" value={filter.price_lte ?? ""} onChange={(e) => set({ price_lte: e.target.value ? +e.target.value : undefined })} /></div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={!!filter.no_manufacturer} onCheckedChange={(c) => set({ no_manufacturer: !!c })} /> Sem fabricante</label>
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={!!filter.no_category} onCheckedChange={(c) => set({ no_category: !!c })} /> Sem categoria</label>
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={!!filter.zero_stock} onCheckedChange={(c) => set({ zero_stock: !!c })} /> Estoque zero ou negativo</label>
      </div>

      <div className="flex gap-2 items-center flex-wrap pt-2 border-t">
        <Button variant="outline" onClick={() => setShowCount(true)} disabled={!hasAnyFilter}>
          Pré-visualizar {isFetching && <Loader2 className="h-3 w-3 animate-spin ml-2" />}
        </Button>
        {showCount && count !== undefined && (
          <span className="text-sm font-medium">{count.toLocaleString("pt-BR")} peças correspondem</span>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => setConfirm("zero")} disabled={!showCount || !count}>
            <RotateCcw className="h-4 w-4 mr-2" /> Zerar estoque
          </Button>
          <Button variant="destructive" onClick={() => setConfirm("delete")} disabled={!showCount || !count}>
            <Trash2 className="h-4 w-4 mr-2" /> Excluir
          </Button>
        </div>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar {confirm === "delete" ? "exclusão" : "zerar estoque"}?</AlertDialogTitle>
            <AlertDialogDescription>
              {count?.toLocaleString("pt-BR")} peças serão {confirm === "delete" ? "permanentemente excluídas" : "atualizadas com estoque 0"}. Não há como desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleAction(confirm!)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {(delMut.isPending || zeroMut.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
