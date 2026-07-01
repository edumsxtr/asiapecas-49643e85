import { useState } from "react";
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
import Reveal from "@/components/quote/Reveal";
import QualitiesBar from "@/components/quote/QualitiesBar";
import BestSellersCarousel from "@/components/quote/BestSellersCarousel";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { type Lang } from "@/components/quote/translations";
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

      {/* 3 — Faixa de qualidades (azul sólido, detalhes amarelos, texto branco) */}
      <Reveal>
        <QualitiesBar />
      </Reveal>

      {/* 4 — Peças em destaque (horizontal scroll) */}
      <Reveal>
        <FeaturedStrip lang={lang} onAddToCart={addToCart} />
      </Reveal>

      {/* 8 — Peças mais vendidas (slider + botão Comprar no WhatsApp) */}
      <Reveal>
        <BestSellersCarousel />
      </Reveal>

      {/* 9 — Blog */}
      <Reveal>
        <BlogHighlightStrip />
      </Reveal>

      {/* 10 — CTA WhatsApp */}
      <Reveal>
        <WhatsAppCTA />
      </Reveal>

      {/* 11 — FAQ */}
      <Reveal>
        <div id="faq"><QuoteFAQ lang={lang} /></div>
      </Reveal>

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
