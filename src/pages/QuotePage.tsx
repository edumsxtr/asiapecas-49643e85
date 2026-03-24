import { useState } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import QuoteHero from "@/components/quote/QuoteHero";
import QuoteCatalog from "@/components/quote/QuoteCatalog";
import QuoteCart from "@/components/quote/QuoteCart";
import QuoteFAQ from "@/components/quote/QuoteFAQ";
import QuoteFooter from "@/components/quote/QuoteFooter";
import QuoteChat from "@/components/quote/QuoteChat";
import { Search, ClipboardList, Send } from "lucide-react";

type CartItem = { material: string; description: string; quantity: number };

export default function QuotePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

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
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-bold text-primary-foreground text-sm">LL</span>
            </div>
            <div>
              <h1 className="font-bold text-sm font-['Space_Grotesk']">Lopes & Lopes</h1>
              <p className="text-[10px] text-secondary-foreground/60">Peças Originais XCMG</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-secondary-foreground/70">
            <a href="#pecas" className="hover:text-primary transition-colors">Peças</a>
            <a href="#como-funciona" className="hover:text-primary transition-colors">Como Funciona</a>
            <a href="#faq" className="hover:text-primary transition-colors">Dúvidas</a>
            <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity">
              Solicitar Atendimento
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
      />

      {/* How it works */}
      <section id="como-funciona" className="py-12 bg-card border-b">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-center text-foreground mb-8">Como Funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Search, title: "Busque a Peça", desc: "Pesquise por código, descrição ou modelo de máquina" },
              { icon: ClipboardList, title: "Monte seu Pedido", desc: "Adicione as peças desejadas ao carrinho de cotação" },
              { icon: Send, title: "Receba sua Cotação", desc: "Envie o pedido e nossa equipe responde em até 24h" },
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
        />
      </div>

      {/* FAQ */}
      <div id="faq">
        <QuoteFAQ />
      </div>

      {/* Footer */}
      <QuoteFooter />

      {/* Cart drawer */}
      <QuoteCart
        items={cartItems}
        onUpdateQty={updateQty}
        onRemove={removeItem}
        onClear={() => setCartItems([])}
      />

      {/* Chat */}
      <QuoteChat />
    </div>
  );
}
