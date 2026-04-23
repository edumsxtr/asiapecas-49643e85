import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { StockAnalytics } from "@/hooks/use-stock-analytics";

interface Props {
  data: StockAnalytics;
}

export function DataHealthTab({ data }: Props) {
  const h = data.dataHealth;
  const items = [
    { label: "Sem fabricante", value: h.noManufacturer, severity: h.noManufacturer > 100 ? "high" : "low" },
    { label: "Sem modelo de máquina", value: h.noModel, severity: h.noModel > 100 ? "high" : "low" },
    { label: "Sem categoria", value: h.noCategory, severity: h.noCategory > 0 ? "high" : "ok" },
    { label: "Descrição muito curta (<10 chars)", value: h.shortDescription, severity: h.shortDescription > 50 ? "med" : "low" },
    { label: "Grupos de duplicados", value: h.duplicateGroups, severity: h.duplicateGroups > 100 ? "high" : "med" },
    { label: "Preço zerado", value: h.zeroPrice, severity: h.zeroPrice > 0 ? "med" : "ok" },
    { label: "Estoque zerado", value: h.zeroStock, severity: h.zeroStock > 0 ? "low" : "ok" },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Saúde do catálogo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((it) => (
            <div
              key={it.label}
              className={`flex items-center justify-between rounded border p-3 text-sm ${
                it.severity === "high"
                  ? "border-destructive/50 bg-destructive/5"
                  : it.severity === "med"
                  ? "border-amber-500/50 bg-amber-500/5"
                  : ""
              }`}
            >
              <div className="flex items-center gap-2">
                {it.severity === "ok" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle
                    className={`h-4 w-4 ${
                      it.severity === "high" ? "text-destructive" : "text-amber-600"
                    }`}
                  />
                )}
                <span>{it.label}</span>
              </div>
              <span className="font-bold tabular-nums">{it.value.toLocaleString("pt-BR")}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Use a Aba <strong>Subcategorizar IA</strong> para resolver "sem categoria" em massa. Duplicados podem ser
          analisados pela função SQL <code>find_duplicate_parts</code>.
        </p>
      </CardContent>
    </Card>
  );
}
