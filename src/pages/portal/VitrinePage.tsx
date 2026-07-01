import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Layers, Cpu } from "lucide-react";
import SiteHeader from "@/components/quote/site/SiteHeader";
import QuoteFooter from "@/components/quote/QuoteFooter";
import QuotePartCard from "@/components/quote/QuotePartCard";
import QuoteCart from "@/components/quote/QuoteCart";
import MachineShowcase from "@/components/quote/MachineShowcase";
import { useCartSession } from "@/hooks/use-cart-session";
import { SEO, breadcrumbLd } from "@/lib/seo";
import { toast } from "sonner";
import { track } from "@/lib/analytics";

export default function VitrinePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { items, addToCart, updateQty, removeItem, clearCart } = useCartSession();

  const { data: featured = [], isLoading } = useQuery({
    queryKey: ["public-vitrine-featured"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vitrine_featured_parts")
        .select("id, badge_label, sort_order, part:parts(*)")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      return data || [];
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Catálogos XCMG — Máquinas e Peças | Ásia Peças"
        description="Catálogos de máquinas XCMG por modelo e catálogo de peças em destaque. Escavadeiras, guindastes, carregadeiras e muito mais."
        canonical="/catalogos"
        lang="pt"
        jsonLd={breadcrumbLd([
          { name: "Início", url: "/" },
          { name: "Catálogos", url: "/catalogos" },
        ])}
      />

      <SiteHeader
        lang="pt"
        search={search}
        onSearchChange={setSearch}
        cartCount={items.length}
        onOpenCart={() => window.dispatchEvent(new Event("open-quote-cart"))}
      />

      <main className="flex-1">

        {/* Herói — gradiente suave (sem faixa azul), padrão do site */}
        <div className="border-b border-border bg-gradient-to-br from-primary/5 to-background">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-7 md:py-9">
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-3">
              <ol className="flex gap-1">
                <li><Link to="/" className="hover:text-primary">Início</Link></li>
                <li>/</li>
                <li className="text-foreground">Catálogos</li>
              </ol>
            </nav>
            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight mb-2">Catálogos</h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
              Navegue pelo catálogo de máquinas XCMG por modelo ou explore as peças em destaque.
            </p>
          </div>
        </div>

        {/* Seção 1 — Catálogo por Máquina */}
        <section className="bg-background">
          <div className="max-w-7xl mx-auto px-4 md:px-6 pt-10 md:pt-12 pb-1">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
                Catálogo por Máquina
              </h2>
            </div>
          </div>
          <div className="pb-6"><MachineShowcase /></div>
        </section>

        {/* Seção 2 — Peças em destaque (superfície e borda diferenciam a seção) */}
        <section className="border-t border-border bg-muted/40">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-12">
            <div className="flex items-center gap-2 mb-5">
              <Layers className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
                Catálogo de Peças em Destaque
              </h2>
            </div>

            {isLoading ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : featured.length === 0 ? (
              <div className="border border-dashed border-border rounded-lg p-12 text-center">
                <p className="text-muted-foreground text-sm">Nenhuma peça em destaque no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {featured.map((f: any) => f.part && (
                  <QuotePartCard
                    key={f.id}
                    part={f.part}
                    inCart={items.some(i => i.material === f.part.material)}
                    hasAiData={false}
                    onAdd={() => { addToCart(f.part); track.addToCart(f.part); toast.success("Adicionado à cotação"); }}
                    onViewDetail={() => navigate(`/cotacao/p/${encodeURIComponent(f.part.material)}`)}
                    lang="pt"
                  />
                ))}
              </div>
            )}
          </div>
        </section>

      </main>

      <QuoteFooter lang="pt" />
      <QuoteCart
        items={items.map(i => ({ material: i.material, description: i.description, quantity: i.quantity }))}
        onUpdateQty={updateQty}
        onRemove={removeItem}
        onClear={clearCart}
        lang="pt"
        showTrigger={false}
      />
    </div>
  );
}
