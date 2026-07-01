import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAllCategoryMedia } from "@/hooks/use-category-media";
import { categorySlug } from "@/lib/slugs";
import { type Lang } from "./translations";

interface Props {
  lang: Lang;
  onSubcategoryClick: (sub: string) => void;
}

export default function CategoryShowcase({ lang, onSubcategoryClick: _onSubcategoryClick }: Props) {
  const { data: mfrs = [] } = useQuery({
    queryKey: ["category-showcase-mfrs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("parts")
        .select("manufacturer")
        .gt("stock", 0)
        .not("manufacturer", "is", null)
        .limit(5000);
      const count = new Map<string, number>();
      for (const p of data ?? []) {
        if (p.manufacturer) count.set(p.manufacturer, (count.get(p.manufacturer) ?? 0) + 1);
      }
      return Array.from(count.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([m]) => m);
    },
    staleTime: 5 * 60 * 1000,
  });

  const mfrHeading = lang === "en" ? "Compatible brands" : lang === "es" ? "Marcas compatibles" : "Marcas compatíveis";

  const { data: media = [] } = useAllCategoryMedia();
  const withImage = media.filter(m => m.image_url);
  const hasContent = withImage.length > 0 || mfrs.length > 0;
  if (!hasContent) return null;

  return (
    <section className="bg-background border-y border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">

        {/* Admin-configured category images */}
        {withImage.length > 0 && (
          <div>
            <h2 className="text-base md:text-lg font-display font-bold text-foreground mb-3">
              {lang === "en" ? "Categories" : lang === "es" ? "Categorías" : "Categorias"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {withImage.map((m) => (
                <Link
                  key={m.category}
                  to={`/cotacao/c/${categorySlug(m.category)}`}
                  className="group relative aspect-[16/9] rounded-lg overflow-hidden border border-border bg-black"
                >
                  <img
                    src={m.image_url!}
                    alt={m.headline || m.category}
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white font-display font-semibold text-sm leading-tight">{m.headline || m.category}</h3>
                    {m.description && <p className="text-white/70 text-[10px] mt-0.5 line-clamp-1">{m.description}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Compatible manufacturers */}
        {mfrs.length > 0 && (
          <div className={withImage.length > 0 ? "border-t border-border pt-5" : ""}>
            <p className="text-[10px] font-display font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2.5">
              {mfrHeading}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {mfrs.map((m) => (
                <div
                  key={m}
                  className="px-3 py-1.5 bg-card border border-border rounded-full text-xs font-display font-semibold text-foreground/80 hover:border-primary hover:text-primary transition-colors cursor-default"
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
