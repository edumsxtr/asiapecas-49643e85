import { Search, Pickaxe, Construction, Drill, Container, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";

const categories = [
  { label: "Mineração", icon: Pickaxe, key: "mineracao" },
  { label: "Linha Amarela", icon: Construction, key: "linha_amarela" },
  { label: "Perfuratriz", icon: Drill, key: "perfuratriz" },
  { label: "Guindaste", icon: Container, key: "guindaste" },
  { label: "Caminhão Elétrico", icon: Truck, key: "caminhao_eletrico" },
];

interface QuoteHeroProps {
  search: string;
  onSearchChange: (val: string) => void;
  onCategoryClick: (key: string) => void;
  activeCategory: string | null;
}

export default function QuoteHero({ search, onSearchChange, onCategoryClick, activeCategory }: QuoteHeroProps) {
  return (
    <section className="relative bg-secondary text-secondary-foreground overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary to-primary/20" />
      <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24 text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold font-['Space_Grotesk'] tracking-tight">
            Peças Originais <span className="text-primary">XCMG</span>
          </h1>
          <p className="text-lg md:text-xl text-secondary-foreground/70 max-w-2xl mx-auto">
            Distribuidor autorizado — Brasil, Venezuela, Guiana
          </p>
        </div>

        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar peça por código, descrição ou modelo de máquina..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 h-14 text-base rounded-xl bg-background text-foreground border-none shadow-lg"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {categories.map((cat) => (
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
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
