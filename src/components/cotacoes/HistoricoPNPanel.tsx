import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";
import { useHistoricoPN } from "@/hooks/use-cotacoes";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export function HistoricoPNPanel() {
  const [q, setQ] = useState("");
  const { data = [], isLoading } = useHistoricoPN(q);

  const grouped = useMemo(() => {
    const m = new Map<string, typeof data>();
    data.forEach((r) => {
      const arr = m.get(r.pn) || [];
      arr.push(r);
      m.set(r.pn, arr);
    });
    return Array.from(m.entries());
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Digite o PN para ver o histórico completo" className="pl-9 font-mono" />
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Buscando...</p>}
      {!isLoading && q.length >= 2 && grouped.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma cotação encontrada para este PN.</p>
      )}
      {grouped.map(([pn, rows]) => (
        <Card key={pn} className="p-4">
          <h4 className="font-mono font-semibold mb-2">{pn} · {rows.length} cotações</h4>
          <div className="space-y-1">
            {rows.map((r) => (
              <Link key={r.item_id} to={`/cotacoes/${r.cotacao_id}`}
                className="flex justify-between border-b py-2 text-sm hover:bg-muted/40 px-2 rounded">
                <div className="flex gap-3">
                  <span className="font-mono">{r.numero}</span>
                  <span className="text-muted-foreground">{r.cliente_nome}</span>
                </div>
                <div className="flex gap-3 items-center">
                  <Badge variant="outline">{r.disponibilidade_fabrica}</Badge>
                  <span className="text-muted-foreground">
                    {r.preco_venda ? `R$ ${Number(r.preco_venda).toFixed(2)}` : "—"}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(r.cotacao_data).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
