import { useState } from "react";
import { Package, DollarSign, AlertTriangle, TrendingUp, BarChart3, Boxes, Factory, Cpu, ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDashboardStats, formatBRL, formatCompact } from "@/hooks/use-parts";
import { StockByCategoryChart } from "./StockByCategoryChart";
import { StockByTimeChart } from "./StockByTimeChart";
import { ManufacturerChart } from "./ManufacturerChart";
import { TopModelsChart } from "./TopModelsChart";
import { ValueDistributionChart } from "./ValueDistributionChart";

export function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
        <Skeleton className="h-[300px] rounded-lg" />
      </div>
    );
  }

  if (!stats) return null;

  const kpis = [
    { label: "Peças Cadastradas", value: stats.totalParts.toLocaleString("pt-BR"), icon: Package, color: "text-primary", bg: "bg-primary/10" },
    { label: "Unidades em Estoque", value: stats.totalStock.toLocaleString("pt-BR"), icon: Boxes, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Valor Total Estoque", value: formatCompact(stats.totalValue), icon: DollarSign, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Preço Médio/Peça", value: formatBRL(stats.avgPrice), icon: BarChart3, color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "Peça Mais Cara", value: formatBRL(stats.maxPrice), icon: ArrowUp, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Estoque Parado (>2a)", value: `${stats.staleStock.toLocaleString("pt-BR")} peças`, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Valor Parado (>2a)", value: formatCompact(stats.staleValue), icon: ArrowDown, color: "text-red-400", bg: "bg-red-400/10" },
    { label: "Críticos (baixo estoque)", value: stats.lowStockHighValue.toString(), icon: Cpu, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard de Gestão</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão completa do estoque de peças XCMG — Lopes & Lopes
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-none shadow-sm bg-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{kpi.label}</p>
                  <p className="text-xl font-display font-bold mt-1 text-foreground">{kpi.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg ${kpi.bg} flex items-center justify-center ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="manufacturers">Fabricantes</TabsTrigger>
          <TabsTrigger value="models">Modelos</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base">Peças por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <StockByCategoryChart data={stats.byCategory} />
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base">Tempo de Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <StockByTimeChart data={stats.byTime} />
              </CardContent>
            </Card>
          </div>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Distribuição de Valor por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ValueDistributionChart data={stats.byCategory} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Análise Detalhada por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Peças</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">% do Estoque</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.byCategory.map((cat) => (
                    <TableRow key={cat.name}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-right">{cat.quantidade.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right">{cat.units.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right font-medium">{formatCompact(cat.value)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{((cat.value / stats.totalValue) * 100).toFixed(1)}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manufacturers" className="mt-4 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Valor por Fabricante</CardTitle>
            </CardHeader>
            <CardContent>
              <ManufacturerChart data={stats.byManufacturer} />
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Detalhamento por Fabricante</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fabricante</TableHead>
                    <TableHead className="text-right">Peças</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">% Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.byManufacturer.map((m) => (
                    <TableRow key={m.name}>
                      <TableCell className="font-medium text-xs">{m.name}</TableCell>
                      <TableCell className="text-right">{m.quantidade.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right">{m.units.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right font-medium">{formatCompact(m.value)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{((m.value / stats.totalValue) * 100).toFixed(1)}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="mt-4 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Top 15 Modelos por Valor em Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <TopModelsChart data={stats.topModels} />
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Detalhamento dos Modelos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead className="text-right">Peças</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topModels.map((m) => (
                    <TableRow key={m.name}>
                      <TableCell className="font-medium font-mono text-xs">{m.name}</TableCell>
                      <TableCell className="text-right">{m.quantidade.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right">{m.units.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right font-medium">{formatBRL(m.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4 space-y-6">
          {/* Critical low stock */}
          <Card className="border-destructive/30 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="font-display text-base">Estoque Crítico — Peças de Alto Valor com Baixo Estoque</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.lowStockHighValue} peças com menos de 5 unidades e valor acima de R$ 50.000
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead className="text-right">Preço Unit.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.criticalParts?.map((p) => (
                    <TableRow key={p.material}>
                      <TableCell className="font-mono text-xs">{p.material}</TableCell>
                      <TableCell className="text-xs max-w-[250px] truncate">{p.description}</TableCell>
                      <TableCell className="text-xs">{p.machine_model}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">{p.stock}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">{formatBRL(p.estimated_price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Stale stock */}
          <Card className="border-orange-500/30 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <ArrowDown className="h-5 w-5 text-orange-500" />
                <CardTitle className="font-display text-base">Estoque Parado — Mais de 2 Anos sem Movimentação</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.staleStock.toLocaleString("pt-BR")} peças representando {formatCompact(stats.staleValue)} em capital parado ({((stats.staleValue / stats.totalValue) * 100).toFixed(1)}% do estoque)
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.staleParts?.map((p) => (
                    <TableRow key={p.material}>
                      <TableCell className="font-mono text-xs">{p.material}</TableCell>
                      <TableCell className="text-xs max-w-[250px] truncate">{p.description}</TableCell>
                      <TableCell className="text-xs">{p.machine_model}</TableCell>
                      <TableCell className="text-right">{p.stock.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right font-medium text-sm text-orange-500">{formatBRL(p.total_value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
