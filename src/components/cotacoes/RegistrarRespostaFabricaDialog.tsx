import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CotacaoItem, ItemDisp, useUpdateCotacaoItem, useUpdateCotacao } from "@/hooks/use-cotacoes";
import { toast } from "sonner";

export function RegistrarRespostaFabricaDialog({
  open, onOpenChange, cotacaoId, itens,
}: { open: boolean; onOpenChange: (v: boolean) => void; cotacaoId: string; itens: CotacaoItem[] }) {
  const updateItem = useUpdateCotacaoItem();
  const updateCot = useUpdateCotacao();
  const [rows, setRows] = useState<Record<string, Partial<CotacaoItem>>>({});

  useEffect(() => {
    if (open) {
      const init: Record<string, Partial<CotacaoItem>> = {};
      itens.forEach((i) => {
        init[i.id] = {
          disponibilidade_fabrica: i.disponibilidade_fabrica,
          preco_custo: i.preco_custo,
          desconto_fabrica: i.desconto_fabrica,
          prazo: i.prazo,
          parceiro_nome: i.parceiro_nome,
          fonte: i.fonte,
        };
      });
      setRows(init);
    }
  }, [open, itens]);

  const setField = (id: string, k: keyof CotacaoItem, v: any) =>
    setRows((r) => ({ ...r, [id]: { ...r[id], [k]: v } }));

  const salvar = async () => {
    const now = new Date().toISOString();
    for (const [id, patch] of Object.entries(rows)) {
      const p: any = { ...patch, data_resposta_fabrica: now };
      if (patch.disponibilidade_fabrica === "nao_tem" && patch.parceiro_nome) p.fonte = "parceiro";
      await updateItem.mutateAsync({ id, patch: p });
    }
    await updateCot.mutateAsync({ id: cotacaoId, patch: { status: "fabrica_respondeu" } as any });
    toast.success("Resposta da fábrica registrada");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Registrar resposta da fábrica</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-1">
            <span className="col-span-3">PN</span>
            <span className="col-span-2">Disp.</span>
            <span className="col-span-2">Preço custo</span>
            <span className="col-span-1">Desc.%</span>
            <span className="col-span-2">Prazo</span>
            <span className="col-span-2">Parceiro (se s/ fábrica)</span>
          </div>
          {itens.map((i) => {
            const r = rows[i.id] || {};
            return (
              <div key={i.id} className="grid grid-cols-12 gap-2 items-center border-t pt-2">
                <div className="col-span-3">
                  <p className="font-mono text-sm">{i.pn}</p>
                  <p className="text-xs text-muted-foreground truncate">{i.descricao}</p>
                </div>
                <div className="col-span-2">
                  <Select value={r.disponibilidade_fabrica || "pendente"}
                    onValueChange={(v) => setField(i.id, "disponibilidade_fabrica", v as ItemDisp)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="tem">Tem</SelectItem>
                      <SelectItem value="nao_tem">Não tem</SelectItem>
                      <SelectItem value="parcial">Parcial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Input type="number" step="0.01" value={r.preco_custo ?? ""} onChange={(e) => setField(i.id, "preco_custo", parseFloat(e.target.value) || null)} />
                </div>
                <div className="col-span-1">
                  <Input type="number" step="0.01" value={r.desconto_fabrica ?? ""} onChange={(e) => setField(i.id, "desconto_fabrica", parseFloat(e.target.value) || null)} />
                </div>
                <div className="col-span-2">
                  <Input value={r.prazo || ""} onChange={(e) => setField(i.id, "prazo", e.target.value)} placeholder="15 dias" />
                </div>
                <div className="col-span-2">
                  <Input value={r.parceiro_nome || ""} onChange={(e) => setField(i.id, "parceiro_nome", e.target.value)} placeholder="Nome parceiro" />
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar}>Salvar respostas</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
