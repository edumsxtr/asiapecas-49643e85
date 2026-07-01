import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getMachineType } from "@/lib/machine-data";
import { modelSlug } from "@/lib/slugs";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MachineRow {
  model: string;
  slug: string;
  count: number;
  subcategories: string[];
  readyCount: number;
}

export default function MachineShowcase() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["machine-showcase-v2"],
    queryFn: async () => {
      const { data } = await supabase
        .from("parts")
        .select("machine_model, subcategory, stock")
        .gt("stock", 0)
        .not("machine_model", "is", null)
        .limit(12000);

      const map = new Map<string, { count: number; readyCount: number; subs: Map<string, number> }>();
      for (const p of data ?? []) {
        if (!p.machine_model) continue;
        const entry = map.get(p.machine_model) ?? { count: 0, readyCount: 0, subs: new Map() };
        entry.count++;
        if ((p.stock ?? 0) > 10) entry.readyCount++;
        if (p.subcategory) entry.subs.set(p.subcategory, (entry.subs.get(p.subcategory) ?? 0) + 1);
        map.set(p.machine_model, entry);
      }

      return Array.from(map.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([model, { count, readyCount, subs }]): MachineRow => ({
          model,
          slug: modelSlug(model),
          count,
          readyCount,
          subcategories: Array.from(subs.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([s]) => s),
        }));
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return (
    <section className="bg-background border-y border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-5">
        <Skeleton className="h-4 w-44 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      </div>
    </section>
  );

  if (!rows.length) return null;

  return (
    <section className="bg-background border-y border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-display font-bold text-foreground uppercase tracking-wide">
            Catálogo por Máquina
          </h2>
          <span className="text-[11px] text-muted-foreground">
            Clique para ver peças compatíveis
          </span>
        </div>

        {/* 2-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {rows.map((row) => {
            const machine = getMachineType(row.model);
            const extra = row.subcategories.length === 4;
            return (
              <Link
                key={row.model}
                to={`/cotacao/m/${row.slug}`}
                className="group flex items-center gap-3 bg-card border border-border hover:border-primary/50 hover:shadow-sm rounded-lg px-3 py-2.5 transition-all duration-150"
              >
                {/* Thumbnail */}
                <div className="relative h-14 w-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                  <img
                    src={machine.photo}
                    alt={`XCMG ${row.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/10" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-primary/80 truncate">
                      {machine.label}
                    </span>
                    <span className="text-[9px] text-muted-foreground shrink-0">
                      · {row.count} peças
                    </span>
                  </div>
                  <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                    XCMG {row.model}
                  </p>
                  {/* Category chips — max 3 inline */}
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {row.subcategories.slice(0, 3).map(sub => (
                      <span
                        key={sub}
                        className="px-1.5 py-px bg-muted rounded text-[9px] font-medium text-foreground/60 truncate max-w-[80px]"
                      >
                        {sub}
                      </span>
                    ))}
                    {extra && (
                      <span className="text-[9px] text-primary font-bold">+</span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
