import { useQuery } from "@tanstack/react-query";
import { partImage } from "@/lib/default-part-image";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Sparkles } from "lucide-react";
import { type Lang, tr } from "./translations";
import { Button } from "@/components/ui/button";

interface Featured {
  id: string;
  badge_label: string | null;
  badge_color: string | null;
  part: {
    id: string; material: string; description: string; manufacturer: string | null;
    machine_model: string | null; stock: number; image_url: string | null;
  };
}

export default function FeaturedStrip({ lang, onAddToCart }: { lang: Lang; onAddToCart: (p: any) => void }) {
  const { data } = useQuery({
    queryKey: ["vitrine-featured"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vitrine_featured_parts")
        .select("id, badge_label, badge_color, part:parts(id, material, description, manufacturer, machine_model, stock, image_url)")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .limit(12);
      return (data || []).filter((d: any) => d.part) as unknown as Featured[];
    },
    staleTime: 60_000,
  });

  if (!data || data.length === 0) return null;

  const title = lang === "en" ? "Featured parts" : lang === "es" ? "Repuestos destacados" : "Peças em destaque";

  return (
    <section className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold font-display text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> {title}
          </h2>
          <span className="text-[11px] text-muted-foreground hidden sm:block">
            {lang === "en" ? "Selected by our team" : "Selecionados pelo nosso time"}
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
          {data.map(({ id, badge_label, part }) => (
            <div key={id} className="flex-shrink-0 w-[190px] snap-start bg-background rounded-lg border border-border hover:border-primary/35 hover:shadow-md transition-all overflow-hidden">
              <Link to={`/cotacao/p/${encodeURIComponent(part.material)}`} className="block">
                <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                  <img src={partImage(part.image_url)} alt={part.description} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async" />
                  {badge_label && (
                    <Badge className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5">{badge_label}</Badge>
                  )}
                  {part.stock > 0 && part.stock <= 5 && (
                    <Badge className="absolute top-1.5 right-1.5 bg-warning text-warning-foreground text-[10px] px-1.5 py-0.5">Últimas {part.stock}</Badge>
                  )}
                </div>
                <div className="p-2.5 space-y-0.5">
                  <p className="font-mono text-[9px] text-primary font-bold tracking-wide">{part.material}</p>
                  <p className="text-xs font-medium line-clamp-2 text-foreground leading-snug">{part.description}</p>
                  {part.machine_model && <p className="text-[10px] text-muted-foreground truncate">{part.machine_model}</p>}
                </div>
              </Link>
              <div className="px-2.5 pb-2.5">
                <Button size="sm" className="w-full gap-1 h-7 text-xs" onClick={() => onAddToCart(part)} disabled={part.stock <= 0}>
                  <ShoppingCart className="h-3 w-3" />
                  {tr("part.quote", lang)}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
