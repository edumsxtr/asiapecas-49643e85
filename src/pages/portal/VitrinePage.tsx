import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import QuoteFooter from "@/components/quote/QuoteFooter";
import QuotePartCard from "@/components/quote/QuotePartCard";
import QuoteCart from "@/components/quote/QuoteCart";
import { useCartSession } from "@/hooks/use-cart-session";
import { SEO } from "@/lib/seo";
import asiaLogo from "@/assets/asia-logo.png";
import { toast } from "sonner";
import { track } from "@/lib/analytics";

export default function VitrinePage() {
  const navigate = useNavigate();
  const { items, addToCart, updateQty, removeItem, clearCart } = useCartSession();

  const { data: featured, isLoading } = useQuery({
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
    <div className="min-h-screen flex flex-col bg-black text-white">
      <SEO title="Vitrine — Peças em destaque | Ásia Peças" description="Peças XCMG selecionadas em destaque pela Ásia Peças & Máquinas." canonical="/cotacao/vitrine" />
      <header className="border-b border-white/10 bg-black">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/cotacao" className="flex items-center gap-3">
            <img src={asiaLogo} alt="Ásia Peças" className="h-10 w-auto" />
            <span className="font-display font-bold">Ásia Peças & Máquinas</span>
          </Link>
          <Link to="/cotacao">
            <Button variant="outline" size="sm" className="gap-1 border-white/20 text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" /> Voltar à loja
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl md:text-4xl font-display font-bold">Vitrine de destaques</h1>
        </div>
        <p className="text-white/70 mb-8 max-w-2xl">Peças selecionadas pela nossa equipe — pronta entrega e oportunidades especiais.</p>

        {isLoading ? (
          <p className="text-white/60">Carregando...</p>
        ) : !featured || featured.length === 0 ? (
          <div className="border border-dashed border-white/20 rounded-2xl p-16 text-center">
            <p className="text-white/70">Nenhuma peça em destaque no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {featured.map((f: any) => f.part && (
              <div key={f.id} className="bg-white text-foreground rounded-xl overflow-hidden">
                <QuotePartCard
                  part={f.part}
                  inCart={items.some(i => i.material === f.part.material)}
                  hasAiData={false}
                  onAdd={() => { addToCart(f.part); track.addToCart(f.part); toast.success("Adicionado à cotação"); }}
                  onViewDetail={() => navigate(`/cotacao/p/${encodeURIComponent(f.part.material)}`)}
                  lang="pt"
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <QuoteFooter lang="pt" />
      <QuoteCart items={items.map(i => ({ material: i.material, description: i.description, quantity: i.quantity }))} onUpdateQty={updateQty} onRemove={removeItem} onClear={clearCart} lang="pt" />
    </div>
  );
}
