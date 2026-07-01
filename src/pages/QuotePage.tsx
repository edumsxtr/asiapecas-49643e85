import { useState } from "react";
import { Link } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import HeroCarousel from "@/components/quote/HeroCarousel";
import FeaturedStrip from "@/components/quote/FeaturedStrip";
import B2BLeadDialog from "@/components/quote/B2BLeadDialog";
import ConsentBanner from "@/components/quote/ConsentBanner";
import PromoBanner from "@/components/quote/PromoBanner";
import QuoteCart from "@/components/quote/QuoteCart";
import QuoteFAQ from "@/components/quote/QuoteFAQ";
import QuoteFooter from "@/components/quote/QuoteFooter";
import SiteHeader from "@/components/quote/site/SiteHeader";
import WhatsAppCTA from "@/components/quote/site/WhatsAppCTA";
import { BlogHighlightStrip } from "@/components/quote/BlogHighlightStrip";
import { Search, ClipboardList, Send, Building2 } from "lucide-react";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { type Lang, tr } from "@/components/quote/translations";
import { SEO, organizationLd, localBusinessLd } from "@/lib/seo";
import { useCartSession } from "@/hooks/use-cart-session";

export default function QuotePage() {
  const [search, setSearch] = useState("");
  const [lang] = useState<Lang>("pt");
  const [b2bOpen, setB2bOpen] = useState(false);

  const { items: cartItems, addToCart, updateQty, removeItem, clearCart } = useCartSession();

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
        description="Distribuidor de peças XCMG originais e compatíveis para máquinas pesadas: escavadeiras, carregadeiras, guindastes, perfuratrizes e mais. Estoque real e cotação em até 24h."
        canonical="/"
        lang={lang}
        jsonLd={[organizationLd(), localBusinessLd()]}
      />

      {/* 1 — Promo */}
      <PromoBanner lang={lang} />

      {/* 2 — Hero / Carrossel de slides 1920×600 */}
      <HeroCarousel lang={lang} />

      {/* 3 — Como funciona (strip compacta) */}
      <section className="bg-muted border-y border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {[
            { icon: Search,        step: "01", title: tr("how.step1.title", lang), desc: tr("how.step1.desc", lang) },
            { icon: ClipboardList, step: "02", title: tr("how.step2.title", lang), desc: tr("how.step2.desc", lang) },
            { icon: Send,          step: "03", title: tr("how.step3.title", lang), desc: tr("how.step3.desc", lang) },
          ].map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="flex items-center gap-3 py-3 md:py-2.5 px-4 md:px-5 first:pl-0 last:pr-0">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Passo {step}</p>
                <p className="text-xs font-display font-bold text-foreground leading-tight">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4 — Peças em destaque (horizontal scroll) */}
      <FeaturedStrip lang={lang} onAddToCart={addToCart} />

      {/* 5 — B2B corporativo */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary-foreground/15 text-primary-foreground flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-display font-semibold">Compra para frota ou revenda?</p>
              <p className="text-xs text-primary-foreground/65">Receba tabela exclusiva corporativa.</p>
            </div>
          </div>
          <button
            onClick={() => setB2bOpen(true)}
            className="bg-accent text-accent-foreground text-xs font-bold px-4 py-2 rounded-full hover:brightness-95 transition uppercase tracking-wide"
          >
            Falar com consultor
          </button>
        </div>
      </section>

      {/* 8 — CTA para o catálogo completo (agora em /pecas) */}
      <section className="bg-background border-y border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 flex flex-col items-center text-center gap-3">
          <h2 className="text-xl md:text-2xl font-display font-bold tracking-tight text-foreground">
            Explore o catálogo completo de peças
          </h2>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Milhares de itens XCMG com estoque real. Filtre por categoria, modelo de máquina ou busque pelo código.
          </p>
          <Link
            to="/pecas"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:brightness-95 transition"
          >
            Ver todas as peças
          </Link>
        </div>
      </section>

      {/* 9 — Blog */}
      <BlogHighlightStrip />

      {/* 10 — CTA WhatsApp */}
      <WhatsAppCTA />

      {/* 11 — FAQ */}
      <div id="faq"><QuoteFAQ lang={lang} /></div>

      {/* 12 — Rodapé */}
      <QuoteFooter lang={lang} />

      {/* Flutuantes */}
      <QuoteCart items={cartItems} onUpdateQty={updateQty} onRemove={removeItem} onClear={clearCart} lang={lang} showTrigger={false} />
      <B2BLeadDialog lang={lang} open={b2bOpen} onOpenChange={setB2bOpen} />
      <ConsentBanner lang={lang} />

      {/* WhatsApp fixo */}
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
