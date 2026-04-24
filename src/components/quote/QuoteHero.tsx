import { Search, Pickaxe, Construction, Drill, Container, Truck, Package, ShieldCheck, Zap, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type Lang, tr } from "./translations";
import heroMachine from "@/assets/hero-xcmg-machine.jpg";

const machineCategories = [
  { icon: Pickaxe, key: "mineracao", flag: "is_mineracao" },
  { icon: Construction, key: "linha_amarela", flag: "is_linha_amarela" },
  { icon: Drill, key: "perfuratriz", flag: "is_perfuratriz" },
  { icon: Container, key: "guindaste", flag: "is_guindaste" },
  { icon: Truck, key: "caminhao_eletrico", flag: "is_caminhao_eletrico" },
] as const;

interface QuoteHeroProps {
  search: string;
  onSearchChange: (val: string) => void;
  onCategoryClick: (key: string) => void;
  activeCategory: string | null;
  /** Kept for API compat — no longer rendered here. */
  onPartCategoryClick?: (key: string) => void;
  activePartCategory?: string | null;
  lang: Lang;
}

const placeholderRotation: Record<Lang, string[]> = {
  pt: ["Filtro de óleo XE215", "Bomba hidráulica XCMG", "Rolamento da esteira", "Sapata 700mm"],
  en: ["XE215 oil filter", "XCMG hydraulic pump", "Track bearing", "700mm shoe"],
  es: ["Filtro de aceite XE215", "Bomba hidráulica XCMG", "Rodamiento de oruga", "Zapata 700mm"],
};

export default function QuoteHero({ search, onSearchChange, onCategoryClick, activeCategory, lang }: QuoteHeroProps) {
  const { data: stats } = useQuery({
    queryKey: ["hero-stats-v2"],
    queryFn: async () => {
      const [total, ...counts] = await Promise.all([
        supabase.from("parts").select("id", { count: "exact", head: true }).gt("stock", 0),
        ...machineCategories.map((c) =>
          supabase.from("parts").select("id", { count: "exact", head: true }).gt("stock", 0).eq(c.flag, true),
        ),
      ]);
      const byCategory: Record<string, number> = {};
      machineCategories.forEach((c, i) => { byCategory[c.key] = counts[i].count || 0; });
      return { totalParts: total.count || 0, byCategory };
    },
    staleTime: 60_000,
  });

  const placeholder = placeholderRotation[lang][Math.floor(Date.now() / 5000) % placeholderRotation[lang].length];
  const trustBadges = [
    { icon: ShieldCheck, label: lang === "en" ? "Real stock" : lang === "es" ? "Stock real" : "Estoque real" },
    { icon: Zap, label: lang === "en" ? "Fast quote" : lang === "es" ? "Cotización rápida" : "Cotação rápida" },
    { icon: MapPin, label: lang === "en" ? "Nationwide shipping" : lang === "es" ? "Envío nacional" : "Envio nacional" },
  ];

  return (
    <section className="relative bg-secondary text-secondary-foreground overflow-hidden">
      {/* Subtle ambient gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary to-primary/10 pointer-events-none" />
      <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-12 md:py-16 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
        {/* LEFT — Copy + search */}
        <div className="space-y-6 text-center lg:text-left">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold tracking-wide uppercase">
              <Package className="h-3 w-3" />
              {lang === "en" ? "Authorized XCMG distributor" : lang === "es" ? "Distribuidor XCMG autorizado" : "Distribuidor XCMG autorizado"}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-['Space_Grotesk'] tracking-tight leading-[1.05]">
              {tr("hero.title", lang)} <span className="text-primary">XCMG</span>
            </h1>
            <p className="text-base md:text-lg text-secondary-foreground/70 max-w-xl mx-auto lg:mx-0">
              {tr("hero.subtitle", lang)}
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-xl mx-auto lg:mx-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={`${tr("hero.search", lang)}  •  ${placeholder}`}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 h-14 text-base rounded-xl bg-background text-foreground border-none shadow-xl"
            />
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2">
            {trustBadges.map((b) => (
              <div key={b.label} className="flex items-center gap-1.5 text-xs text-secondary-foreground/80">
                <b.icon className="h-4 w-4 text-primary" />
                <span>{b.label}</span>
              </div>
            ))}
          </div>

          {stats && stats.totalParts > 0 && (
            <p className="text-sm text-secondary-foreground/60">
              <span className="font-semibold text-primary">{stats.totalParts.toLocaleString("pt-BR")}+</span>{" "}
              {tr("hero.stats", lang)}
            </p>
          )}
        </div>

        {/* RIGHT — Hero image */}
        <div className="relative hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent rounded-3xl blur-2xl" />
          <img
            src={heroMachine}
            alt="XCMG"
            width={1280}
            height={960}
            className="relative w-full h-auto rounded-3xl shadow-2xl object-cover"
          />
        </div>
      </div>

      {/* Machine category tiles */}
      <div className="relative max-w-7xl mx-auto px-6 pb-12 md:pb-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {machineCategories.map((cat) => {
            const isActive = activeCategory === cat.key;
            const count = stats?.byCategory[cat.key] || 0;
            return (
              <button
                key={cat.key}
                onClick={() => onCategoryClick(cat.key)}
                className={`group relative overflow-hidden rounded-2xl p-4 text-left transition-all border ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-lg scale-[1.02]"
                    : "bg-background/5 backdrop-blur border-secondary-foreground/10 hover:border-primary/50 hover:bg-background/10"
                }`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-2 ${isActive ? "bg-primary-foreground/20" : "bg-primary/15 text-primary group-hover:bg-primary/25"}`}>
                  <cat.icon className="h-5 w-5" />
                </div>
                <p className={`text-sm font-semibold ${isActive ? "" : "text-secondary-foreground"}`}>
                  {tr(`cat.${cat.key}` as any, lang)}
                </p>
                <p className={`text-[11px] mt-0.5 ${isActive ? "text-primary-foreground/80" : "text-secondary-foreground/50"}`}>
                  {count > 0
                    ? `${count.toLocaleString("pt-BR")} ${lang === "en" ? "parts" : lang === "es" ? "repuestos" : "peças"}`
                    : lang === "en" ? "Browse" : lang === "es" ? "Explorar" : "Explorar"}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
