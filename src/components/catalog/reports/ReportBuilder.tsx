import { useMemo, useState } from "react";
import type { CatalogIntelligence } from "@/hooks/use-catalog-intelligence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { FileSpreadsheet, FileText } from "lucide-react";
import { fmtBRL } from "@/lib/subcategory-rules";
import * as XLSX from "xlsx";

interface Props {
  data: CatalogIntelligence;
}

type GroupKey = "subcategory" | "model";
type Viz = "table" | "bar" | "pie";

const COLORS = ["hsl(var(--primary))", "#1f8af6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#a3a3a3"];

export function ReportBuilder({ data }: Props) {
  const [groupBy, setGroupBy] = useState<GroupKey>("subcategory");
  const [staleOnly, setStaleOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [viz, setViz] = useState<Viz>("table");

  const rows = useMemo(() => {
    const map = new Map<string, { key: string; skus: number; units: number; value: number; stale: number }>();
    for (const r of data.subcategoryByModel) {
      const k = groupBy === "subcategory" ? r.subcategory : r.model;
      if (search && !k.toLowerCase().includes(search.toLowerCase())) continue;
      if (staleOnly && r.stale_value === 0) continue;
      const e = map.get(k) ?? { key: k, skus: 0, units: 0, value: 0, stale: 0 };
      e.skus += r.skus; e.units += r.units; e.value += r.value; e.stale += r.stale_value;
      map.set(k, e);
    }
    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [data, groupBy, staleOnly, search]);

  const totalValue = rows.reduce((a, r) => a + r.value, 0);

  function exportXlsx() {
    const wb = XLSX.utils.book_new();
    const aoa = [
      [groupBy === "subcategory" ? "Subcategoria" : "Modelo", "SKUs", "Unidades", "Valor (R$)", "% do total", "Parado +2a (R$)"],
      ...rows.map((r) => [r.key, r.skus, r.units, Number(r.value.toFixed(2)), Number(((r.value / Math.max(1, totalValue)) * 100).toFixed(2)), Number(r.stale.toFixed(2))]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    XLSX.writeFile(wb, `relatorio-customizado-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  const top10 = rows.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Construtor de relatório</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Agrupar por</label>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupKey)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="subcategory">Subcategoria</SelectItem>
                <SelectItem value="model">Modelo de máquina</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Filtrar nome</label>
            <Input className="h-8 text-xs" placeholder="contém..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Filtros</label>
            <Button size="sm" variant={staleOnly ? "default" : "outline"} className="h-8 text-xs w-full" onClick={() => setStaleOnly(!staleOnly)}>
              {staleOnly ? "Apenas com capital parado" : "Todos os itens"}
            </Button>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Visualização</label>
            <Select value={viz} onValueChange={(v) => setViz(v as Viz)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="table">Tabela</SelectItem>
                <SelectItem value="bar">Barras</SelectItem>
                <SelectItem value="pie">Pizza</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1" onClick={exportXlsx}>
            <FileSpreadsheet className="h-4 w-4" /> XLSX
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => window.print()}>
            <FileText className="h-4 w-4" /> Imprimir/PDF
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            {rows.length} grupos · {fmtBRL(totalValue)} total
          </span>
        </div>

        {viz === "bar" && (
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={top10}>
                <XAxis dataKey="key" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmtBRL(v as number)} width={90} />
                <Tooltip formatter={(v) => fmtBRL(v as number)} />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {viz === "pie" && (
          <div className="h-80">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={top10} dataKey="value" nameKey="key" outerRadius={120} label={(d) => d.key}>
                  {top10.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtBRL(v as number)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {viz === "table" && (
          <div className="overflow-auto max-h-[55vh] border rounded">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{groupBy === "subcategory" ? "Subcategoria" : "Modelo"}</TableHead>
                  <TableHead className="text-right">SKUs</TableHead>
                  <TableHead className="text-right">Unidades</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">% total</TableHead>
                  <TableHead className="text-right">Parado +2a</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell className="font-medium">{r.key}</TableCell>
                    <TableCell className="text-right">{r.skus}</TableCell>
                    <TableCell className="text-right">{r.units}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">{fmtBRL(r.value)}</TableCell>
                    <TableCell className="text-right text-xs">{((r.value / Math.max(1, totalValue)) * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right text-xs text-destructive">{r.stale > 0 ? fmtBRL(r.stale) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
