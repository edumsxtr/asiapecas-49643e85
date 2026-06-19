import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ImageOff } from "lucide-react";
import QuoteFooter from "@/components/quote/QuoteFooter";
import { SEO } from "@/lib/seo";
import asiaLogo from "@/assets/asia-logo.png";

export default function BannersPage() {
  const { data: banners, isLoading } = useQuery({
    queryKey: ["public-banners-page"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("vitrine_banners")
        .select("id, image_url, title, subtitle, cta_label, cta_link")
        .eq("active", true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order("sort_order", { ascending: true });
      return data || [];
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <SEO title="Banners e campanhas — Ásia Peças" description="Veja as campanhas e ofertas ativas da Ásia Peças & Máquinas." canonical="/cotacao/banners" />
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
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Campanhas e banners</h1>
        <p className="text-white/70 mb-8 max-w-2xl">Ofertas, lançamentos e ações comerciais em destaque.</p>

        {isLoading ? (
          <p className="text-white/60">Carregando...</p>
        ) : !banners || banners.length === 0 ? (
          <div className="border border-dashed border-white/20 rounded-2xl p-16 text-center space-y-3">
            <ImageOff className="h-10 w-10 mx-auto text-white/40" />
            <p className="text-white/70">Nenhuma campanha ativa no momento.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {banners.map((b: any) => (
              <article key={b.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-950">
                {b.image_url && (
                  <img src={b.image_url} alt={b.title || "Banner"} className="w-full h-64 md:h-80 object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
                <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-center max-w-2xl gap-3">
                  {b.title && <h2 className="text-2xl md:text-3xl font-display font-bold text-white">{b.title}</h2>}
                  {b.subtitle && <p className="text-white/80">{b.subtitle}</p>}
                  {b.cta_label && b.cta_link && (
                    <a href={b.cta_link} className="inline-block w-fit">
                      <Button size="lg" className="rounded-full">{b.cta_label}</Button>
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <QuoteFooter lang="pt" />
    </div>
  );
}
