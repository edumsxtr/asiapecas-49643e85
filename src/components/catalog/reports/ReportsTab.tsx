import { useState, useMemo } from "react";
import { useCatalogIntelligence } from "@/hooks/use-catalog-intelligence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtBRL, SUBCATEGORY_ICONS } from "@/lib/subcategory-rules";
import { ArrowDown, ArrowUp, FileSpreadsheet, FileText, Sparkles } from "lucide-react";
import { exportIntelligenceXlsx } from "@/lib/export-xlsx";
import { exportExecutivePdf } from "@/lib/export-pdf-report";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SubcategoryDetail } from "./SubcategoryDetail";
import { SubcategoryMachineMatrix } from "./SubcategoryMachineMatrix";
import { ReportBuilder } from "./ReportBuilder";

type SortKey = "value" | "skus" | "stale";

export function ReportsTab() {
  const { data, isLoading, refetch } = useCatalogIntelligence();
  const [sort, setSort] = useState<SortKey>("value");
  const [openSub, setOpenSub] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  const sorted = useMemo(() => {
    if (!data) return [];
    const list = [...data.bySubcategory];
    list.sort((a, b) => {
      if (sort === "skus") return b.skus - a.skus;
      if (sort === "stale") return b.stale_value - a.stale_value;
      return b.value - a.value;
    });
    return list;
  }, [data, sort]);

  async function runAISubcategorize() {
    setAiBusy(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("subcategorize-parts", {
        body: { mode: "auto", limit: 100 },
      });
      if (error) throw error;
      toast.success(`IA classificou ${(res as any)?.updated ?? 0} peças`);
      await refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao classificar com IA");
    } finally {
      setAiBusy(false);
    }
  }

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    );
  }

  const classifiedPct = Math.round(
    (data.overall.classifiedSkus / Math.max(1, data.overall.totalSkus)) * 100,
  );

  return (
    <div className="space-y-5">
      {/* KPIs topo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Total SKUs" value={data.overall.totalSkus.toLocaleString("pt-BR")} />
        <KpiCard label="Unidades" value={data.overall.totalUnits.toLocaleString("pt-BR")} />
        <KpiCard label="Valor em Estoque" value={fmtBRL(data.overall.totalValue)} highlight />
        <KpiCard label="Classificados" value={`${classifiedPct}%`} sub={`${data.overall.classifiedSkus.toLocaleString("pt-BR")} SKUs`} />
        <KpiCard label="Sem subcategoria" value={data.overall.unclassifiedSkus.toLocaleString("pt-BR")} sub="precisam IA" />
      </div>

      {/* Ações topo */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="default" onClick={runAISubcategorize} disabled={aiBusy} className="gap-1">
          <Sparkles className="h-4 w-4" />
          {aiBusy ? "Classificando com IA..." : "Refinar com IA (100)"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={() => {
            exportIntelligenceXlsx(data, `catalogo-inteligencia-${ymd()}.xlsx`);
            logExport("xlsx", "intelligence");
          }}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Exportar XLSX
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={() => {
            exportExecutivePdf(data, `relatorio-executivo-${ymd()}.pdf`);
            logExport("pdf", "executive");
          }}
        >
          <FileText className="h-4 w-4" />
          PDF Executivo
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão por subcategoria</TabsTrigger>
          <TabsTrigger value="matrix">Subcategoria × Máquina</TabsTrigger>
          <TabsTrigger value="builder">Construtor de relatório</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Ordenar por:</span>
            <SortBtn current={sort} value="value" set={setSort}>Valor</SortBtn>
            <SortBtn current={sort} value="skus" set={setSort}>SKUs</SortBtn>
            <SortBtn current={sort} value="stale" set={setSort}>Capital parado</SortBtn>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sorted.map((s) => {
              const stalePct = s.value > 0 ? (s.stale_value / s.value) * 100 : 0;
              const icon = SUBCATEGORY_ICONS[s.subcategory] ?? "📦";
              return (
                <Card key={s.subcategory} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span className="flex items-center gap-2">
                        <span className="text-xl" aria-hidden>{icon}</span>
                        {s.subcategory}
                      </span>
                      {stalePct > 30 && (
                        <Badge variant="destructive" className="text-[10px]">
                          {stalePct.toFixed(0)}% parado
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <Stat label="SKUs" value={s.skus.toLocaleString("pt-BR")} />
                      <Stat label="Unidades" value={s.units.toLocaleString("pt-BR")} />
                      <Stat label="Valor" value={fmtBRL(s.value)} highlight />
                    </div>
                    {s.top_attributes && s.top_attributes.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Principais atributos:</p>
                        <div className="flex flex-wrap gap-1">
                          {s.top_attributes.slice(0, 5).map((a, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">
                              {a.attr}: {a.val} ({a.cnt})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {s.top_models && s.top_models.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Top máquinas:</p>
                        <div className="flex flex-wrap gap-1">
                          {s.top_models.slice(0, 4).map((m, i) => (
                            <Badge key={i} variant="outline" className="text-[10px]">
                              {m.model} · {m.cnt}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {s.stale_value > 0 && (
                      <p className="text-xs text-destructive">
                        ⚠ {s.stale_skus} SKUs parados há +2 anos · {fmtBRL(s.stale_value)}
                      </p>
                    )}
                    <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => setOpenSub(s.subcategory)}>
                      Ver lista completa
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="matrix">
          <SubcategoryMachineMatrix data={data.subcategoryByModel} onCell={(sub, model) => setOpenSub(`${sub}|||${model}`)} />
        </TabsContent>

        <TabsContent value="builder">
          <ReportBuilder data={data} />
        </TabsContent>
      </Tabs>

      <SubcategoryDetail openKey={openSub} onClose={() => setOpenSub(null)} />
    </div>
  );
}

function KpiCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`mt-1 font-bold ${highlight ? "text-primary text-xl" : "text-lg"}`}>{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded bg-muted/40 p-1.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-xs font-semibold ${highlight ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}

function SortBtn({
  current, value, set, children,
}: { current: SortKey; value: SortKey; set: (v: SortKey) => void; children: React.ReactNode }) {
  const active = current === value;
  return (
    <Button size="sm" variant={active ? "default" : "outline"} className="h-7 text-xs" onClick={() => set(value)}>
      {children}
      {active && <ArrowDown className="ml-1 h-3 w-3" />}
    </Button>
  );
}

function ymd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function logExport(format: string, scope: string) {
  try {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("catalog_reports_log" as never).insert({
      user_id: u.user.id, format, scope,
    } as never);
  } catch { /* ignore */ }
}
