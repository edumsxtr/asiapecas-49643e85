import { AppLayout } from "@/components/AppLayout";
import { useMarketResearchOverview } from "@/hooks/use-market-research";
import { useParts, formatBRL } from "@/hooks/use-parts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingDown, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";

export default function MarketResearchPage() {
  const { data: research = [], isLoading } = useMarketResearchOverview();

  // Group by part_id
  const byPart = research.reduce((acc, r) => {
    if (!acc[r.part_id]) acc[r.part_id] = [];
    acc[r.part_id].push(r);
    return acc;
  }, {} as Record<string, typeof research>);

  const uniqueParts = Object.keys(byPart).length;
  const totalEntries = research.length;
  const avgPrices = Object.values(byPart).map(entries => {
    const avg = entries.reduce((s, e) => s + Number(e.price_found), 0) / entries.length;
    return avg;
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Pesquisa de Mercado</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe preços de concorrentes e competitividade
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Peças Pesquisadas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-bold">{uniqueParts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total de Registros</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-bold">{totalEntries}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Distribuidores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-bold">
                {new Set(research.map(r => r.distributor_name)).size}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" /> Pesquisas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : research.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma pesquisa de mercado registrada ainda.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Abra uma peça no catálogo e use a aba "Pesquisa de Mercado" para começar.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Distribuidor</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Disponibilidade</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {research.slice(0, 50).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.distributor_name}</TableCell>
                      <TableCell>{formatBRL(Number(r.price_found))}</TableCell>
                      <TableCell>{r.delivery_days ? `${r.delivery_days} dias` : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={r.availability === "em estoque" ? "default" : "secondary"} className="text-xs">
                          {r.availability}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.researched_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
