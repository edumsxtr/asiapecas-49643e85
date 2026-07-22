import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Package, AlertCircle, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { lookupPN, fetchHistoricoPN } from "@/hooks/use-cotacoes";
import { useNavigate } from "react-router-dom";

export function BuscaGlobalPN({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [pn, setPn] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!open) { setPn(""); setResult(null); }
  }, [open]);

  useEffect(() => {
    if (pn.length < 2) { setResult(null); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      const [part, hist] = await Promise.all([lookupPN(pn), fetchHistoricoPN(pn)]);
      setResult({ part, hist });
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [pn]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Busca rápida por PN</DialogTitle></DialogHeader>
        <Input
          autoFocus
          placeholder="Digite o PN (ex: 250100234)"
          value={pn}
          onChange={(e) => setPn(e.target.value)}
          className="font-mono text-lg"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin mx-auto" />}
        {result && (
          <div className="space-y-3">
            <Card className="p-3">
              {result.part ? (
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-mono text-sm">{result.part.material}</p>
                    <p className="text-sm text-muted-foreground truncate">{result.part.description}</p>
                  </div>
                  {result.part.stock > 0 ? (
                    <Badge className="bg-green-600 hover:bg-green-600">EM ESTOQUE ({result.part.stock})</Badge>
                  ) : (
                    <Badge className="bg-yellow-500 text-black hover:bg-yellow-500">SEM ESTOQUE</Badge>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" /> PN não encontrado no cadastro
                </div>
              )}
            </Card>

            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <History className="h-4 w-4" /> Histórico de cotações ({result.hist.length})
              </h4>
              {result.hist.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nunca cotado antes.</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {result.hist.map((h: any) => (
                    <button
                      key={h.item_id}
                      onClick={() => { onOpenChange(false); nav(`/cotacoes/${h.cotacao_id}`); }}
                      className="w-full text-left border rounded p-2 text-xs hover:bg-muted/50"
                    >
                      <div className="flex justify-between">
                        <span className="font-mono">{h.numero}</span>
                        <span className="text-muted-foreground">{new Date(h.cotacao_data).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <div className="flex justify-between mt-1 text-muted-foreground">
                        <span>{h.cliente_nome}</span>
                        <span>
                          {h.disponibilidade_fabrica} · {h.preco_venda ? `R$ ${Number(h.preco_venda).toFixed(2)}` : "s/ preço"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
