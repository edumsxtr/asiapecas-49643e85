import { Search, Pickaxe, Construction, Drill, Container, Truck, Package, Filter, Cog, Zap, Wrench, Droplets, Disc, Snowflake, CircleDot, Box } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type Lang, tr } from "./translations";

const machineCategories = [
  { icon: Pickaxe, key: "mineracao" },
  { icon: Construction, key: "linha_amarela" },
  { icon: Drill, key: "perfuratriz" },
  { icon: Container, key: "guindaste" },
  { icon: Truck, key: "caminhao_eletrico" },
] as const;

const partCategories = [
  { icon: Filter, key: "Filtros" },
  { icon: Disc, key: "Vedações e Retentores" },
  { icon: Cog, key: "Motor e Componentes" },
  { icon: Droplets, key: "Sistema Hidráulico" },
  { icon: Zap, key: "Sistema Elétrico" },
  { icon: Box, key: "Estrutural e Chassi" },
  { icon: Wrench, key: "Transmissão" },
  { icon: CircleDot, key: "Rolamentos e Buchas" },
  { icon: Snowflake, key: "Refrigeração" },
] as const;

interface QuoteHeroProps {
  search: string;
  onSearchChange: (val: string) => void;
  onCategoryClick: (key: string) => void;
  activeCategory: string | null;
  onPartCategoryClick?: (key: string) => void;
  activePartCategory?: string | null;
  lang: Lang;
}

export default function QuoteHero({ search, onSearchChange, onCategoryClick, activeCategory, onPartCategoryClick, activePartCategory, lang }: QuoteHeroProps) {
  const { data: stats } = useQuery({
    queryKey: ["hero-stats"],
    queryFn: async () => {
      const { count } = await supabase.from("parts").select("id", { count: "exact", head: true }).gt("stock", 0);
      return { totalParts: count || 0 };
    },
    staleTime: 60_000,
  });

  return (
    <section className="relative bg-secondary text-secondary-foreground overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary to-primary/20" />
      <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24 text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold font-['Space_Grotesk'] tracking-tight">
            {tr("hero.title", lang)} <span className="text-primary">XCMG</span>
          </h1>
          <p className="text-lg md:text-xl text-secondary-foreground/70 max-w-2xl mx-auto">
            {tr("hero.subtitle", lang)}
          </p>
          {stats && stats.totalParts > 0 && (
            <div className="flex items-center justify-center gap-2 text-primary font-semibold">
              <Package className="h-5 w-5" />
              <span className="text-lg">{stats.totalParts.toLocaleString("pt-BR")}+ {tr("hero.stats", lang)}</span>
            </div>
          )}
        </div>

        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={tr("hero.search", lang)}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 h-14 text-base rounded-xl bg-background text-foreground border-none shadow-lg"
          />
        </div>

        {/* Machine categories */}
        <div className="space-y-2">
          <p className="text-xs text-secondary-foreground/50 uppercase tracking-wider font-medium">
            {lang === "pt" ? "Por tipo de máquina" : lang === "en" ? "By machine type" : "Por tipo de máquina"}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {machineCategories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => onCategoryClick(cat.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.key
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary-foreground/10 text-secondary-foreground/80 hover:bg-primary/20 hover:text-primary"
                }`}
              >
                <cat.icon className="h-4 w-4" />
                {tr(`cat.${cat.key}` as any, lang)}
              </button>
            ))}
          </div>
        </div>

        {/* Part type categories */}
        {onPartCategoryClick && (
          <div className="space-y-2">
            <p className="text-xs text-secondary-foreground/50 uppercase tracking-wider font-medium">
              {lang === "pt" ? "Por tipo de peça" : lang === "en" ? "By part type" : "Por tipo de repuesto"}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {partCategories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => onPartCategoryClick(cat.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    activePartCategory === cat.key
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary-foreground/10 text-secondary-foreground/70 hover:bg-primary/20 hover:text-primary"
                  }`}
                >
                  <cat.icon className="h-3.5 w-3.5" />
                  {tr(`pcat.${cat.key}` as any, lang)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}