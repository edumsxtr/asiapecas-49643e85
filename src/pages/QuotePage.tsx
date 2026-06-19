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
import { BlogHighlightStrip } from "@/components/quote/BlogHighlightStrip";
import { Search, ClipboardList, Send, MessageCircle, Menu, Building2, User, LogIn } from "lucide-react";
import { type Lang, tr } from "@/components/quote/translations";
import { SEO, organizationLd } from "@/lib/seo";
import asiaLogo from "@/assets/asia-logo.png";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCartSession } from "@/hooks/use-cart-session";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const LANG_FLAGS: { lang: Lang; label: string }[] = [
  { lang: "pt", label: "PT" },
  { lang: "en", label: "EN" },
  { lang: "es", label: "ES" },
];

export default function QuotePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [partCategory, setPartCategory] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("pt");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [b2bOpen, setB2bOpen] = useState(false);

  const { items: cartItems, addToCart, updateQty, removeItem, clearCart } = useCartSession();
  const { user } = useAuth();

  const handleCategoryClick = (key: string) => {
    setCategory(prev => (prev === key ? null : key));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sonner />

      {/* Institutional top bar */}
      <div className="hidden md:block bg-[hsl(0,0%,8%)] text-secondary-foreground/70 text-[11px] border-b border-secondary-foreground/10">
        <div className="max-w-6xl mx-auto px-6 py-1.5 flex items-center justify-between">
          <span className="uppercase tracking-widest">Distribuidor Autorizado XCMG — Brasil, Venezuela e Guiana</span>
          <div className="flex items-center gap-4">
            <a href="mailto:vendas@asiapecas.com" className="hover:text-primary">vendas@asiapecas.com</a>
            <span className="text-secondary-foreground/30">|</span>
            <a href="tel:+5531992293767" className="hover:text-primary">(31) 99229-3767</a>
            <span className="text-secondary-foreground/30">|</span>
            <a href="tel:+5531987334504" className="hover:text-primary">(31) 98733-4504</a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-secondary text-secondary-foreground border-b border-secondary-foreground/10">

        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={asiaLogo} alt="Ásia Peças & Máquinas" className="h-11 w-auto" />
            <div>
              <h1 className="font-bold text-sm font-display">Ásia Peças & Máquinas</h1>
              <p className="text-[10px] text-secondary-foreground/60">{tr("header.subtitle", lang)}</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-secondary-foreground/70">
            <Link to="/cotacao/banners" className="hover:text-primary transition-colors">Campanhas</Link>
            <Link to="/cotacao/vitrine" className="hover:text-primary transition-colors">Vitrine</Link>
            <a href="#pecas" className="hover:text-primary transition-colors">{tr("header.parts", lang)}</a>
            <a href="#como-funciona" className="hover:text-primary transition-colors">{tr("header.howItWorks", lang)}</a>
            <a href="#faq" className="hover:text-primary transition-colors">{tr("header.faq", lang)}</a>
            <a href="/blog" className="hover:text-primary transition-colors">Blog</a>
            <div className="flex items-center gap-1 border border-secondary-foreground/20 rounded-lg px-1">
              {LANG_FLAGS.map(({ lang: l, label }) => (
                <button key={l} onClick={() => setLang(l)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${lang === l ? "bg-primary text-primary-foreground" : "hover:bg-secondary-foreground/10"}`}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={() => setB2bOpen(true)} className="text-xs text-secondary-foreground/80 hover:text-primary transition-colors border border-secondary-foreground/20 rounded-lg px-3 py-2 inline-flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {lang === "en" ? "I'm a business" : lang === "es" ? "Soy empresa" : "Sou empresa"}
            </button>
            {user ? (
              <Link to="/minhas-cotacoes" className="text-xs text-secondary-foreground/80 hover:text-primary transition-colors border border-secondary-foreground/20 rounded-lg px-3 py-2 inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Minhas cotações
              </Link>
            ) : (
              <Link to="/portal/login" className="text-xs text-secondary-foreground/80 hover:text-primary transition-colors border border-secondary-foreground/20 rounded-lg px-3 py-2 inline-flex items-center gap-1.5">
                <LogIn className="h-3.5 w-3.5" />
                Entrar
              </Link>
            )}
            <a href="https://wa.me/5531992293767?text=Ol%C3%A1%2C%20gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20pe%C3%A7as%20XCMG" target="_blank" rel="noopener noreferrer" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity">
              {tr("header.contact", lang)}
            </a>
          </nav>

          {/* Mobile hamburger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden p-2 rounded-lg hover:bg-secondary-foreground/10 transition-colors">
                <Menu className="h-6 w-6 text-secondary-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-secondary text-secondary-foreground">
              <SheetHeader>
                <SheetTitle className="text-secondary-foreground flex items-center gap-2">
                  <img src={asiaLogo} alt="Ásia Peças" className="h-8 w-auto rounded-lg" />
                  Ásia Peças & Máquinas
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                <a href="#pecas" onClick={() => setMobileMenuOpen(false)} className="text-sm hover:text-primary transition-colors py-2 border-b border-secondary-foreground/10">{tr("header.parts", lang)}</a>
                <a href="#como-funciona" onClick={() => setMobileMenuOpen(false)} className="text-sm hover:text-primary transition-colors py-2 border-b border-secondary-foreground/10">{tr("header.howItWorks", lang)}</a>
                <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-sm hover:text-primary transition-colors py-2 border-b border-secondary-foreground/10">{tr("header.faq", lang)}</a>
                <div className="pt-2">
                  <p className="text-xs text-secondary-foreground/50 uppercase tracking-wider mb-2">
                    {lang === "pt" ? "Idioma" : lang === "en" ? "Language" : "Idioma"}
                  </p>
                  <div className="flex gap-2">
                    {LANG_FLAGS.map(({ lang: l, label }) => (
                      <button key={l} onClick={() => setLang(l)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${lang === l ? "bg-primary text-primary-foreground" : "bg-secondary-foreground/10 hover:bg-secondary-foreground/20"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <a href="https://wa.me/5531992293767?text=Ol%C3%A1%2C%20gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20pe%C3%A7as%20XCMG" target="_blank" rel="noopener noreferrer" className="mt-4 bg-primary text-primary-foreground px-4 py-3 rounded-lg text-sm font-medium text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  <MessageCircle className="h-4 w-4" />WhatsApp
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

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
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-display font-semibold text-background">
                {lang === "en" ? "Buying for fleet or reselling?" : lang === "es" ? "¿Compra para flota o reventa?" : "Compra para frota ou revenda?"}
              </p>
              <p className="text-xs text-background/60">
                {lang === "en" ? "Get an exclusive corporate price list." : lang === "es" ? "Reciba tabla exclusiva corporativa." : "Receba tabela exclusiva corporativa."}
              </p>
            </div>
          </div>
          <button onClick={() => setB2bOpen(true)} className="bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
            {lang === "en" ? "Talk to a consultant" : lang === "es" ? "Hablar con un consultor" : "Falar com consultor"}
          </button>
        </div>
      </section>

      <section id="como-funciona" className="py-12 bg-black text-white border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold font-display text-center text-white mb-8">{tr("how.title", lang)}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Search, title: tr("how.step1.title", lang), desc: tr("how.step1.desc", lang) },
              { icon: ClipboardList, title: tr("how.step2.title", lang), desc: tr("how.step2.desc", lang) },
              { icon: Send, title: tr("how.step3.title", lang), desc: tr("how.step3.desc", lang) },
            ].map((step, i) => (
              <div key={i} className="text-center space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto">
                  <step.icon className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-white">{step.title}</h3>
                <p className="text-sm text-white/70">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div id="pecas">
        <QuoteCatalog search={search} category={category} partCategory={partCategory} subcategory={subcategory} onSubcategoryChange={setSubcategory} onPartCategoryChange={(key) => setPartCategory(prev => prev === key ? null : key)} cartItems={cartItems} onAddToCart={addToCart} lang={lang} />
      </div>

      <BlogHighlightStrip />

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
