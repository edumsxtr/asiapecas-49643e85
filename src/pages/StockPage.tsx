import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useDashboardStats, formatBRL, formatCompact } from "@/hooks/use-parts";
import { useStockImports, useDeleteStockImport } from "@/hooks/use-stock-imports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowDown, Package, TrendingUp, FileSpreadsheet, Trash2, Upload } from "lucide-react";
import { StockByTimeChart } from "@/components/dashboard/StockByTimeChart";
import { ImportCatalogDialog } from "@/components/catalog/ImportCatalogDialog";
import { toast } from "sonner";

const StockPage = () => {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: imports, isLoading: importsLoading } = useStockImports();
  const deleteMutation = useDeleteStockImport();
  const [showImport, setShowImport] = useState(false);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!stats) return <AppLayout><div className="p-6">Erro ao carregar dados</div></AppLayout>;

  const timeData = stats.byTime || [];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Análise de Estoque</h1>
            <p className="text-sm text-muted-foreground mt-1">Controle detalhado de estoque e alertas</p>
          </div>
          <Button onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-1" /> Importar Planilha
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Unidades</p>
                  <p className="text-xl font-display font-bold mt-1">{stats.totalStock.toLocaleString("pt-BR")}</p>
                </div>
                <Package className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Valor Total</p>
                  <p className="text-xl font-display font-bold mt-1">{formatCompact(stats.totalValue)}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Parado (&gt;2 anos)</p>
                  <p className="text-xl font-display font-bold mt-1 text-destructive">{stats.staleStock.toLocaleString("pt-BR")}</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Capital Parado</p>
                  <p className="text-xl font-display font-bold mt-1 text-orange-500">{formatCompact(stats.staleValue)}</p>
                  <p className="text-[10px] text-muted-foreground">{((stats.staleValue / stats.totalValue) * 100).toFixed(1)}% do total</p>
                </div>
                <ArrowDown className="h-5 w-5 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="font-display text-base">Distribuição por Tempo</CardTitle></CardHeader>
            <CardContent><StockByTimeChart data={timeData} /></CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="font-display text-base">Detalhes por Período</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Peças</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeData.map((t) => (
                    <TableRow key={t.name}>
                      <TableCell><Badge variant={t.name === "mais de 2 anos" ? "destructive" : "secondary"}>{t.name}</Badge></TableCell>
                      <TableCell className="text-right">{t.quantidade.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right">{t.units.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right font-medium">{formatCompact(t.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Stock Imports History */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" /> Planilhas Importadas
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {importsLoading ? (
              <Skeleton className="h-20" />
            ) : !imports || imports.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma planilha importada ainda</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead className="text-right">Linhas</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {imports.map((imp) => (
                    <TableRow key={imp.id}>
                      <TableCell className="text-xs font-medium">{imp.file_name}</TableCell>
                      <TableCell className="text-xs">{imp.source_label}</TableCell>
                      <TableCell className="text-right text-xs">{imp.total_rows.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right text-xs">{imp.total_stock.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right text-xs font-medium">{formatCompact(imp.total_value)}</TableCell>
                      <TableCell>
                        <Badge variant={imp.status === "completo" ? "default" : imp.status === "erro" ? "destructive" : "secondary"}>
                          {imp.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(imp.imported_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => {
                            deleteMutation.mutate(imp.id, { onSuccess: () => toast.success("Removido") });
                          }}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Critical items */}
        {stats.criticalParts && stats.criticalParts.length > 0 && (
          <Card className="border-destructive/30 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="font-display text-base">Peças Críticas — Alto Valor, Baixo Estoque</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.criticalParts.map((p) => (
                    <TableRow key={p.material}>
                      <TableCell className="font-mono text-xs">{p.material}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{p.description}</TableCell>
                      <TableCell className="text-xs">{p.machine_model}</TableCell>
                      <TableCell className="text-right"><Badge variant="destructive">{p.stock}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{formatBRL(p.estimated_price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <ImportCatalogDialog open={showImport} onClose={() => setShowImport(false)} />
    </AppLayout>
  );
};

export default StockPage;
