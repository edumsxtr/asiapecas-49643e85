import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getSubcategoryIcon } from "@/lib/subcategory-rules";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Truck, MessageCircle, FileCheck } from "lucide-react";
import { useAllCategoryMedia } from "@/hooks/use-category-media";
import { categorySlug } from "@/lib/slugs";
import { type Lang } from "./translations";

interface Props {
  lang: Lang;
  onSubcategoryClick: (sub: string) => void;
}

const TRUST = {
  pt: [
    { icon: FileCheck, label: "Nota fiscal emitida" },
    { icon: Truck, label: "Entrega nacional" },
    { icon: MessageCircle, label: "Cotação via WhatsApp" },
    { icon: ShieldCheck, label: "Garantia 3 meses" },
  ],
  en: [
    { icon: FileCheck, label: "Invoice issued" },
    { icon: Truck, label: "Nationwide delivery" },
    { icon: MessageCircle, label: "Quote via WhatsApp" },
    { icon: ShieldCheck, label: "3-month warranty" },
  ],
  es: [
    { icon: FileCheck, label: "Factura emitida" },
    { icon: Truck, label: "Envío nacional" },
    { icon: MessageCircle, label: "Cotización vía WhatsApp" },
    { icon: ShieldCheck, label: "Garantía 3 meses" },
  ],
};

export default function CategoryShowcase({ lang, onSubcategoryClick }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["category-showcase"],
    queryFn: async () => {
      const { data: parts } = await supabase
        .from("parts")
        .select("subcategory, manufacturer")
        .gt("stock", 0)
        .not("subcategory", "is", null)
        .limit(10000);

      const subCount = new Map<string, number>();
      const mfrCount = new Map<string, number>();
      for (const p of parts ?? []) {
        if (p.subcategory) subCount.set(p.subcategory, (subCount.get(p.subcategory) ?? 0) + 1);
        if (p.manufacturer) mfrCount.set(p.manufacturer, (mfrCount.get(p.manufacturer) ?? 0) + 1);
      }
      const topSubs = Array.from(subCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([sub]) => ({ sub }));
      const topMfrs = Array.from(mfrCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([m]) => m);
      return { topSubs, topMfrs };
    },
    staleTime: 5 * 60 * 1000,
  });

  const heading = lang === "en" ? "Parts you'll find here" : lang === "es" ? "Repuestos que encuentras aquí" : "Peças que você encontra aqui";
  const mfrHeading = lang === "en" ? "Compatible brands" : lang === "es" ? "Marcas compatibles" : "Marcas compatíveis";

  return (
    <section className="bg-background border-y border-foreground/10">
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
        {/* Trust strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TRUST[lang].map((t) => (
            <div key={t.label} className="flex items-center gap-3 bg-white border border-foreground/10 rounded-lg px-3 py-2.5">
              <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                <t.icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-foreground">{t.label}</span>
            </div>
          ))}
        </div>

        {/* Custom category images (admin-configured) */}
        <CategoryImageStrip lang={lang} />



        {/* Subcategory tiles */}
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-5">
            {heading}
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {data?.topSubs.map(({ sub }) => {
                const Icon = getSubcategoryIcon(sub);
                return (
                  <button
                    key={sub}
                    onClick={() => onSubcategoryClick(sub)}
                    className="group relative bg-white hover:bg-foreground hover:text-background border border-foreground/10 rounded-xl p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center mb-3 group-hover:bg-primary">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <p className="text-sm font-display font-semibold leading-tight line-clamp-2">{sub}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Compatible manufacturers strip */}
        {data && data.topMfrs.length > 0 && (
          <div>
            <p className="text-[11px] font-display font-semibold uppercase tracking-[0.2em] text-foreground/70 mb-3">
              {mfrHeading}
            </p>
            <div className="flex flex-wrap gap-2">
              {data.topMfrs.map((m) => (
                <div
                  key={m}
                  className="px-4 py-2 bg-white border border-foreground/15 rounded-full text-sm font-display font-semibold tracking-wide text-foreground hover:border-primary transition-colors"
                >
                  {m}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
