import { useState } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import QuoteHero from "@/components/quote/QuoteHero";
import HeroCarousel from "@/components/quote/HeroCarousel";
import FeaturedStrip from "@/components/quote/FeaturedStrip";
import B2BLeadDialog from "@/components/quote/B2BLeadDialog";
import ConsentBanner from "@/components/quote/ConsentBanner";
import QuoteCatalog from "@/components/quote/QuoteCatalog";
import CategoryShowcase from "@/components/quote/CategoryShowcase";
import PromoBanner from "@/components/quote/PromoBanner";
import QuoteCart from "@/components/quote/QuoteCart";
import QuoteFAQ from "@/components/quote/QuoteFAQ";
import QuoteFooter from "@/components/quote/QuoteFooter";
import QuoteChat from "@/components/quote/QuoteChat";
import SiteHeader from "@/components/quote/site/SiteHeader";
import BenefitsStrip from "@/components/quote/site/BenefitsStrip";
import WhatsAppCTA from "@/components/quote/site/WhatsAppCTA";
import { BlogHighlightStrip } from "@/components/quote/BlogHighlightStrip";
import { Search, ClipboardList, Send, MessageCircle, Building2 } from "lucide-react";
import { type Lang, tr } from "@/components/quote/translations";
import { SEO, organizationLd } from "@/lib/seo";
import { useCartSession } from "@/hooks/use-cart-session";

export default function QuotePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [partCategory, setPartCategory] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [lang] = useState<Lang>("pt");
  const [b2bOpen, setB2bOpen] = useState(false);

  const { items: cartItems, addToCart, updateQty, removeItem, clearCart } = useCartSession();

  const handleCategoryClick = (key: string) => {
    setCategory(prev => (prev === key ? null : key));
  };

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
        title="Peças XCMG originais e compatíveis | Ásia Peças & Máquinas"
        description="Catálogo completo de peças XCMG para mineração, linha amarela, perfuratrizes, guindastes e caminhões. Cotação rápida em até 24h. Estoque real."
        canonical="/cotacao"
        lang={lang}
        jsonLd={organizationLd()}
      />

      <PromoBanner lang={lang} />

      <HeroCarousel
        lang={lang}
        fallback={
          <QuoteHero search={search} onSearchChange={setSearch} onCategoryClick={handleCategoryClick} activeCategory={category} onPartCategoryClick={(key) => setPartCategory(prev => prev === key ? null : key)} activePartCategory={partCategory} lang={lang} />
        }
      />

      <BenefitsStrip />

      <CategoryShowcase
        lang={lang}
        onSubcategoryClick={(sub) => {
          setSubcategory(sub);
          setTimeout(() => document.getElementById("pecas")?.scrollIntoView({ behavior: "smooth" }), 50);
        }}
      />

      <FeaturedStrip lang={lang} onAddToCart={addToCart} />

      {/* B2B inline strip */}
      <section className="bg-foreground text-background border-y border-foreground">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-display font-semibold text-background">
                Compra para frota ou revenda?
              </p>
              <p className="text-xs text-background/60">
                Receba tabela exclusiva corporativa.
              </p>
            </div>
          </div>
          <button onClick={() => setB2bOpen(true)} className="bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity">
            Falar com consultor
          </button>
        </div>
      </section>

      <section id="como-funciona" className="py-14 bg-background border-b border-foreground/10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.25em] text-primary font-bold">Como funciona</p>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-foreground mt-2">
              {tr("how.title", lang)}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Search, title: tr("how.step1.title", lang), desc: tr("how.step1.desc", lang) },
              { icon: ClipboardList, title: tr("how.step2.title", lang), desc: tr("how.step2.desc", lang) },
              { icon: Send, title: tr("how.step3.title", lang), desc: tr("how.step3.desc", lang) },
            ].map((step, i) => (
              <div key={i} className="text-center space-y-3 p-6 rounded-2xl border border-foreground/10 hover:border-primary/60 transition-colors">
                <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto">
                  <step.icon className="h-7 w-7" />
                </div>
                <h3 className="font-display font-bold text-foreground">{step.title}</h3>
                <p className="text-sm text-foreground/60">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div id="pecas">
        <QuoteCatalog search={search} category={category} partCategory={partCategory} subcategory={subcategory} onSubcategoryChange={setSubcategory} onPartCategoryChange={(key) => setPartCategory(prev => prev === key ? null : key)} cartItems={cartItems} onAddToCart={addToCart} lang={lang} />
      </div>

      <BlogHighlightStrip />

      <WhatsAppCTA />

      <div id="faq"><QuoteFAQ lang={lang} /></div>
      <QuoteFooter lang={lang} />
      <QuoteCart items={cartItems} onUpdateQty={updateQty} onRemove={removeItem} onClear={clearCart} lang={lang} />
      <QuoteChat lang={lang} />

      <B2BLeadDialog lang={lang} open={b2bOpen} onOpenChange={setB2bOpen} />
      <ConsentBanner lang={lang} />

      <a href="https://wa.me/5531992293767?text=Ol%C3%A1%2C%20gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20pe%C3%A7as%20XCMG" target="_blank" rel="noopener noreferrer" className="fixed bottom-24 right-6 z-50 bg-primary text-primary-foreground h-14 w-14 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform" title="WhatsApp">
        <MessageCircle className="h-6 w-6" />
      </a>
    </div>
  );
}

