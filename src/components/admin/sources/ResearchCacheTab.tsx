import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, Loader2 } from "lucide-react";
import { useMarketResearchSummary, useAICompatSummary, useClearResearch, useDeleteResearchRow } from "@/hooks/use-admin-sources";
import { toast } from "sonner";

function CacheSection({ title, table, total, recent, refetchKey }: {
  title: string;
  table: "market_research" | "ai_compatibility_results";
  total: number;
  recent: any[];
  refetchKey: string;
}) {
  const [before, setBefore] = useState("");
  const [confirm, setConfirm] = useState<"all" | "before" | null>(null);
  const clear = useClearResearch();
  const delRow = useDeleteResearchRow();

  const handleClear = async () => {
    try {
      const n = await clear.mutateAsync(confirm === "all" ? { table, all: true } : { table, before: new Date(before).toISOString() });
      toast.success(`${n.toLocaleString("pt-BR")} registros removidos`);
      setConfirm(null);
    } catch (e: any) { toast.error("Erro: " + e.message); }
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{total.toLocaleString("pt-BR")} registros no cache</p>
        </div>
        <div className="flex gap-2 items-end">
          <div>
            <Label className="text-xs">Limpar anteriores a</Label>
            <Input type="date" value={before} onChange={(e) => setBefore(e.target.value)} className="h-9 w-44" />
          </div>
          <Button variant="outline" onClick={() => setConfirm("before")} disabled={!before}>Limpar antigos</Button>
          <Button variant="destructive" onClick={() => setConfirm("all")} disabled={!total}>Limpar tudo</Button>
        </div>
      </div>

      <div className="border rounded max-h-64 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referência</TableHead>
              <TableHead>Detalhe</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-xs">Nenhum registro recente.</TableCell></TableRow>}
            {recent.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs font-mono">
                  {table === "market_research" ? (r as any).parts?.material || r.part_id : r.material}
                </TableCell>
                <TableCell className="text-xs">
                  {table === "market_research" ? `${r.distributor_name} — R$ ${r.price_found}` : r.model_used}
                </TableCell>
                <TableCell className="text-xs">{new Date(r.researched_at).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => { await delRow.mutateAsync({ table, id: r.id }); toast.success("Removido"); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar limpeza?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "all" ? `Todos os ${total.toLocaleString("pt-BR")} registros de ${title} serão excluídos.` : `Registros anteriores a ${before} serão excluídos.`} Não há como desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {clear.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export function ResearchCacheTab() {
  const mr = useMarketResearchSummary();
  const ai = useAICompatSummary();

  if (mr.isLoading || ai.isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <CacheSection title="Pesquisa de Mercado" table="market_research" total={mr.data?.total || 0} recent={mr.data?.recent || []} refetchKey="market-research-summary" />
      <CacheSection title="IA — Compatibilidade" table="ai_compatibility_results" total={ai.data?.total || 0} recent={ai.data?.recent || []} refetchKey="ai-compat-summary" />
    </div>
  );
}
