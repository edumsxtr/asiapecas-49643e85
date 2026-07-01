import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import SiteHeader from "@/components/quote/site/SiteHeader";
import QuoteCatalog from "@/components/quote/QuoteCatalog";
import QuoteCart from "@/components/quote/QuoteCart";
import QuoteFooter from "@/components/quote/QuoteFooter";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { type Lang } from "@/components/quote/translations";
import { SEO, breadcrumbLd, itemListLd } from "@/lib/seo";
import { useCartSession } from "@/hooks/use-cart-session";

export default function PartsPage() {
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState<string | null>(params.get("maq"));
  const [partCategory, setPartCategory] = useState<string | null>(params.get("cat"));
  const [subcategory, setSubcategory] = useState<string | null>(params.get("sub"));
  const [model, setModel] = useState<string>("all");
  const [lang] = useState<Lang>("pt");

  const { items: cartItems, addToCart, updateQty, removeItem, clearCart } = useCartSession();

  // Amostra de produtos para o ItemList (dados estruturados / SEO)
  const { data: topParts = [] } = useQuery({
    queryKey: ["parts-seo-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("parts")
        .select("material, description, manufacturer, stock, estimated_price, image_url")
        .gt("stock", 0)
        .order("stock", { ascending: false })
        .limit(30);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sonner />

      <SiteHeader
        lang={lang}
        search={search}
        onSearchChange={setSearch}
        cartCount={cartItems.length}
        onOpenCart={() => window.dispatchEvent(new Event("open-quote-cart"))}
      />

      <SEO
        title="Catálogo de Peças XCMG — originais e compatíveis | Ásia Peças"
        description="Catálogo completo de peças XCMG com estoque real. Filtre por categoria, modelo de máquina e subcategoria, ou busque pelo código. Cotação em até 24h."
        canonical="/pecas"
        lang={lang}
        jsonLd={[
          breadcrumbLd([
            { name: "Início", url: "/" },
            { name: "Peças", url: "/pecas" },
          ]),
          itemListLd(topParts),
        ]}
      />

      {/* Herói — gradiente suave, compacto (padrão do site) */}
      <div className="border-b border-border bg-gradient-to-br from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-3">
            <ol className="flex gap-1">
              <li><Link to="/" className="hover:text-primary">Início</Link></li>
              <li>/</li>
              <li className="text-foreground">Peças</li>
            </ol>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight mb-2">Catálogo de Peças</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
            Filtre por categoria, modelo de máquina ou busque pelo código da peça.
          </p>
        </div>
      </div>

      <main className="flex-1">
        <QuoteCatalog
          search={search}
          category={category}
          partCategory={partCategory}
          subcategory={subcategory}
          modelFilter={model}
          onSubcategoryChange={setSubcategory}
          onPartCategoryChange={(key) => setPartCategory((prev) => (prev === key ? null : key))}
          onModelChange={setModel}
          cartItems={cartItems}
          onAddToCart={addToCart}
          lang={lang}
        />
      </main>

      <QuoteFooter lang={lang} />

      {/* Flutuantes */}
      <QuoteCart items={cartItems} onUpdateQty={updateQty} onRemove={removeItem} onClear={clearCart} lang={lang} showTrigger={false} />

      <a
        href="https://wa.me/5531995165511?text=Ol%C3%A1%2C%20gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20pe%C3%A7as%20XCMG"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white h-14 w-14 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
        title="WhatsApp"
      >
        <WhatsAppIcon className="h-7 w-7" />
      </a>
    </div>
  );
}
