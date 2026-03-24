import { useState } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import QuoteHero from "@/components/quote/QuoteHero";
import QuoteCatalog from "@/components/quote/QuoteCatalog";
import QuoteCart from "@/components/quote/QuoteCart";
import QuoteFAQ from "@/components/quote/QuoteFAQ";
import QuoteFooter from "@/components/quote/QuoteFooter";
import QuoteChat from "@/components/quote/QuoteChat";
import { Search, ClipboardList, Send, MessageCircle, Menu } from "lucide-react";
import { type Lang, tr } from "@/components/quote/translations";
import eliteLogo from "@/assets/elite-logo.png";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type CartItem = { material: string; description: string; quantity: number };

const LANG_FLAGS: { lang: Lang; label: string }[] = [
  { lang: "pt", label: "🇧🇷 PT" },
  { lang: "en", label: "🇺🇸 EN" },
  { lang: "es", label: "🇪🇸 ES" },
];

export default function QuotePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [lang, setLang] = useState<Lang>("pt");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCategoryClick = (key: string) => {
    setCategory(prev => (prev === key ? null : key));
  };

  const addToCart = (part: any) => {
    if (cartItems.find(i => i.material === part.material)) return;
    setCartItems(prev => [...prev, { material: part.material, description: part.description, quantity: 1 }]);
  };

  const updateQty = (material: string, qty: number) => {
    setCartItems(prev => prev.map(i => i.material === material ? { ...i, quantity: Math.max(1, qty) } : i));
  };

  const removeItem = (material: string) => {
    setCartItems(prev => prev.filter(i => i.material !== material));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sonner />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-secondary text-secondary-foreground border-b border-secondary-foreground/10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={eliteLogo} alt="Elite Peças XCMG" className="h-10 w-auto rounded-lg" />
            <div>
              <h1 className="font-bold text-sm font-['Space_Grotesk']">Elite Peças XCMG</h1>
              <p className="text-[10px] text-secondary-foreground/60">{tr("header.subtitle", lang)}</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-secondary-foreground/70">
            <a href="#pecas" className="hover:text-primary transition-colors">{tr("header.parts", lang)}</a>
            <a href="#como-funciona" className="hover:text-primary transition-colors">{tr("header.howItWorks", lang)}</a>
            <a href="#faq" className="hover:text-primary transition-colors">{tr("header.faq", lang)}</a>
            {/* Language selector */}
            <div className="flex items-center gap-1 border border-secondary-foreground/20 rounded-lg px-1">
              {LANG_FLAGS.map(({ lang: l, label }) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${lang === l ? "bg-primary text-primary-foreground" : "hover:bg-secondary-foreground/10"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <a href="https://wa.me/5595974009289?text=Ol%C3%A1%2C%20gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20pe%C3%A7as%20XCMG" target="_blank" rel="noopener noreferrer" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity">
              {tr("header.contact", lang)}
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <QuoteHero
        search={search}
        onSearchChange={setSearch}
        onCategoryClick={handleCategoryClick}
        activeCategory={category}
        lang={lang}
      />

      {/* How it works */}
      <section id="como-funciona" className="py-12 bg-card border-b">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-center text-foreground mb-8">{tr("how.title", lang)}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Search, title: tr("how.step1.title", lang), desc: tr("how.step1.desc", lang) },
              { icon: ClipboardList, title: tr("how.step2.title", lang), desc: tr("how.step2.desc", lang) },
              { icon: Send, title: tr("how.step3.title", lang), desc: tr("how.step3.desc", lang) },
            ].map((step, i) => (
              <div key={i} className="text-center space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catalog */}
      <div id="pecas">
        <QuoteCatalog
          search={search}
          category={category}
          cartItems={cartItems}
          onAddToCart={addToCart}
          lang={lang}
        />
      </div>

      {/* FAQ */}
      <div id="faq">
        <QuoteFAQ lang={lang} />
      </div>

      {/* Footer */}
      <QuoteFooter lang={lang} />

      {/* Cart drawer */}
      <QuoteCart
        items={cartItems}
        onUpdateQty={updateQty}
        onRemove={removeItem}
        onClear={() => setCartItems([])}
        lang={lang}
      />

      {/* Chat */}
      <QuoteChat lang={lang} />

      {/* WhatsApp flutuante */}
      <a
        href="https://wa.me/5595974009289?text=Ol%C3%A1%2C%20gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20pe%C3%A7as%20XCMG"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-6 z-50 bg-[hsl(142,71%,45%)] text-white h-14 w-14 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
        title="WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </div>
  );
}
