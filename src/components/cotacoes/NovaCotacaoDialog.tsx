import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CheckCircle2, AlertTriangle, History, Loader2 } from "lucide-react";
import {
  useCreateCotacao,
  lookupPN,
  fetchHistoricoPN,
  ItemFonte,
  CotacaoOrigem,
} from "@/hooks/use-cotacoes";

type Row = {
  pn: string;
  descricao: string;
  quantidade: number;
  fonte: ItemFonte;
  lookupStatus: "idle" | "loading" | "stock" | "no-stock";
  stockQty?: number;
  historyCount?: number;
  lastPrice?: number | null;
  lastDate?: string;
};

const emptyRow = (): Row => ({ pn: "", descricao: "", quantidade: 1, fonte: "sem_fonte", lookupStatus: "idle" });

export function NovaCotacaoDialog({
  open, onOpenChange, onCreated,
}: { open: boolean; onOpenChange: (v: boolean) => void; onCreated?: (id: string) => void }) {
  const create = useCreateCotacao();
  const [cliente, setCliente] = useState({ nome: "", whatsapp: "", email: "" });
  const [origem, setOrigem] = useState<CotacaoOrigem>("whatsapp");
  const [responsavel, setResponsavel] = useState("");
  const [observacoes, setObs] = useState("");
  const [rows, setRows] = useState<Row[]>([emptyRow()]);

  useEffect(() => {
    if (!open) {
      setCliente({ nome: "", whatsapp: "", email: "" });
      setOrigem("whatsapp"); setResponsavel(""); setObs("");
      setRows([emptyRow()]);
    }
  }, [open]);

  const updateRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const doLookup = async (i: number, pn: string) => {
    if (!pn.trim()) return;
    updateRow(i, { lookupStatus: "loading" });
    const [part, hist] = await Promise.all([lookupPN(pn), fetchHistoricoPN(pn)]);
    const last = hist[0];
    if (part && part.stock > 0) {
      updateRow(i, {
        lookupStatus: "stock",
        stockQty: part.stock,
        descricao: part.description || "",
        fonte: "estoque",
        historyCount: hist.length,
        lastPrice: last?.preco_venda ?? null,
        lastDate: last?.cotacao_data,
      });
    } else {
      updateRow(i, {
        lookupStatus: "no-stock",
        stockQty: part?.stock ?? 0,
        descricao: part?.description || "",
        fonte: "fabrica",
        historyCount: hist.length,
        lastPrice: last?.preco_venda ?? null,
        lastDate: last?.cotacao_data,
      });
    }
  };

  const canSubmit = cliente.nome.trim() && rows.some((r) => r.pn.trim());

  const submit = async () => {
    const valid = rows.filter((r) => r.pn.trim());
    const c = await create.mutateAsync({
      cliente_nome: cliente.nome.trim(),
      cliente_whatsapp: cliente.whatsapp || undefined,
      cliente_email: cliente.email || undefined,
      origem,
      responsavel: responsavel || undefined,
      observacoes: observacoes || undefined,
      itens: valid.map((r) => ({
        pn: r.pn.trim(),
        descricao: r.descricao || undefined,
        quantidade: r.quantidade || 1,
        fonte: r.fonte,
      })),
    });
    onOpenChange(false);
    onCreated?.(c.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nova Cotação</DialogTitle></DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Cliente *</Label>
            <Input value={cliente.nome} onChange={(e) => setCliente({ ...cliente, nome: e.target.value })} placeholder="Nome / empresa" />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input value={cliente.whatsapp} onChange={(e) => setCliente({ ...cliente, whatsapp: e.target.value })} placeholder="(31) 99999-9999" />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input value={cliente.email} onChange={(e) => setCliente({ ...cliente, email: e.target.value })} />
          </div>
          <div>
            <Label>Origem</Label>
            <Select value={origem} onValueChange={(v) => setOrigem(v as CotacaoOrigem)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="trafego_pago">Tráfego Pago</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="indicacao">Indicação</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Responsável</Label>
            <Select value={responsavel} onValueChange={setResponsavel}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Eduardo">Eduardo</SelectItem>
                <SelectItem value="Pedro">Pedro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <Label>Itens</Label>
            <Button variant="outline" size="sm" onClick={() => setRows((rs) => [...rs, emptyRow()])}>
              <Plus className="h-3 w-3 mr-1" /> Adicionar item
            </Button>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="border rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-4">
                  <Input
                    placeholder="PN"
                    value={r.pn}
                    onChange={(e) => updateRow(i, { pn: e.target.value, lookupStatus: "idle" })}
                    onBlur={(e) => doLookup(i, e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="col-span-6">
                  <Input placeholder="Descrição" value={r.descricao} onChange={(e) => updateRow(i, { descricao: e.target.value })} />
                </div>
                <div className="col-span-1">
                  <Input type="number" min={1} value={r.quantidade} onChange={(e) => updateRow(i, { quantidade: parseFloat(e.target.value) || 1 })} />
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button variant="ghost" size="icon" onClick={() => setRows((rs) => rs.filter((_, x) => x !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs items-center">
                {r.lookupStatus === "loading" && <Loader2 className="h-3 w-3 animate-spin" />}
                {r.lookupStatus === "stock" && (
                  <Badge className="gap-1 bg-green-600 hover:bg-green-600">
                    <CheckCircle2 className="h-3 w-3" /> EM ESTOQUE ({r.stockQty})
                  </Badge>
                )}
                {r.lookupStatus === "no-stock" && (
                  <Badge className="gap-1 bg-yellow-500 hover:bg-yellow-500 text-black">
                    <AlertTriangle className="h-3 w-3" /> COTAR FÁBRICA
                  </Badge>
                )}
                {(r.historyCount ?? 0) > 0 && (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <History className="h-3 w-3" />
                    Já cotado {r.historyCount}x
                    {r.lastPrice ? ` · último preço R$ ${r.lastPrice.toFixed(2)}` : ""}
                    {r.lastDate ? ` · ${new Date(r.lastDate).toLocaleDateString("pt-BR")}` : ""}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div>
          <Label>Observações</Label>
          <Textarea value={observacoes} onChange={(e) => setObs(e.target.value)} />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!canSubmit || create.isPending}>
            {create.isPending ? "Criando..." : "Criar Cotação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
