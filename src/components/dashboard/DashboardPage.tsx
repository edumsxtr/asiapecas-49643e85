import { Package, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sampleParts, formatBRL, categoryLabels } from "@/data/sample-parts";
import { StockByCategoryChart } from "./StockByCategoryChart";
import { StockByTimeChart } from "./StockByTimeChart";

export function DashboardPage() {
  const totalParts = sampleParts.length;
  const totalStock = sampleParts.reduce((acc, p) => acc + p.stock, 0);
  const totalValue = sampleParts.reduce((acc, p) => acc + p.stock * p.estimatedPrice, 0);
  const staleStock = sampleParts.filter((p) => p.lastEntryTime === "mais de 2 anos").length;

  const kpis = [
    { label: "Total de Peças", value: totalParts.toString(), icon: Package, color: "text-primary" },
    { label: "Unidades em Estoque", value: totalStock.toLocaleString("pt-BR"), icon: TrendingUp, color: "text-success" },
    { label: "Valor Total Estoque", value: formatBRL(totalValue), icon: DollarSign, color: "text-info" },
    { label: "Estoque Parado (>2 anos)", value: staleStock.toString(), icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão geral do estoque de peças XCMG — Lopes & Lopes
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-none shadow-sm bg-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                    {kpi.label}
                  </p>
                  <p className="text-xl font-display font-bold mt-1 text-foreground">
                    {kpi.value}
                  </p>
                </div>
                <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Peças por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <StockByCategoryChart />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Tempo de Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <StockByTimeChart />
          </CardContent>
        </Card>
      </div>

      {/* Recent stale parts alert */}
      {staleStock > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-foreground">Atenção: Estoque Parado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {staleStock} peça(s) com mais de 2 anos sem movimentação. Considere promoções ou
                  prospecção ativa para esses itens.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
