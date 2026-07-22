import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useCotacoes } from "@/hooks/use-cotacoes";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { differenceInHours, startOfMonth } from "date-fns";

export function DashboardCotacoes() {
  const { data: cotacoes = [] } = useCotacoes();

  const kpis = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const abertas = cotacoes.filter((c) => !["fechada", "perdida"].includes(c.status));
    const aguardando = cotacoes.filter((c) => c.status === "aguardando_fabrica");
    const atrasadas = aguardando.filter(
      (c) => c.data_envio_fabrica && differenceInHours(now, new Date(c.data_envio_fabrica)) >= 24
    );
    const propostas = cotacoes.filter((c) => c.status === "proposta_enviada");
    const fechadasMes = cotacoes.filter((c) => c.status === "fechada" && new Date(c.updated_at) >= monthStart);
    const perdidasMes = cotacoes.filter((c) => c.status === "perdida" && new Date(c.updated_at) >= monthStart);
    const totalMes = fechadasMes.length + perdidasMes.length;
    const conv = totalMes > 0 ? (fechadasMes.length / totalMes) * 100 : 0;
    const valorNeg = abertas.reduce((s, c) => s + Number(c.valor_total || 0), 0);
    return { abertas: abertas.length, aguardando: aguardando.length, atrasadas: atrasadas.length,
      propostas: propostas.length, fechadasMes: fechadasMes.length, conv, valorNeg };
  }, [cotacoes]);

  const { data: topPNs = [] } = useQuery({
    queryKey: ["cotacoes-top-pns"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("cotacao_itens")
        .select("pn, quantidade, fonte")
        .in("fonte", ["fabrica", "parceiro", "sem_fonte"])
        .limit(500);
      const map = new Map<string, number>();
      (data || []).forEach((r: any) => map.set(r.pn, (map.get(r.pn) || 0) + Number(r.quantidade || 1)));
      return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
    },
  });

  const items: [string, string | number, string?][] = [
    ["Abertas", kpis.abertas],
    ["Aguardando Fábrica", kpis.aguardando],
    ["Atrasadas (>24h)", kpis.atrasadas, kpis.atrasadas > 0 ? "text-destructive" : ""],
    ["Propostas Enviadas", kpis.propostas],
    ["Fechadas no mês", kpis.fechadasMes],
    ["Taxa de conversão", `${kpis.conv.toFixed(1)}%`],
    ["Valor em negociação", kpis.valorNeg.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })],
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map(([label, val, cls]) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${cls || ""}`}>{val}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">PNs mais pedidos sem estoque</h3>
          {topPNs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <div className="space-y-1">
              {topPNs.map(([pn, qty]) => (
                <div key={pn} className="flex justify-between border-b py-2 text-sm">
                  <span className="font-mono">{pn}</span>
                  <span className="text-muted-foreground">{qty} un. solicitadas</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
