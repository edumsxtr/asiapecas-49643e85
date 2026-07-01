import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Clock4, MapPin, ArrowRight, ShieldCheck, RotateCcw } from "lucide-react";
import SiteHeader from "@/components/quote/site/SiteHeader";
import QuoteFooter from "@/components/quote/QuoteFooter";
import QuoteCart from "@/components/quote/QuoteCart";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { useCartSession } from "@/hooks/use-cart-session";
import { SEO, organizationLd, breadcrumbLd, localBusinessLd } from "@/lib/seo";

const WHATSAPP = [
  { label: "(31) 99516-5511", href: "https://wa.me/5531995165511?text=Ol%C3%A1%2C%20preciso%20de%20atendimento%20sobre%20pe%C3%A7as%20XCMG" },
  { label: "(31) 98733-4504", href: "https://wa.me/5531987334504?text=Ol%C3%A1%2C%20preciso%20de%20atendimento%20sobre%20pe%C3%A7as%20XCMG" },
];
const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Rua+%C3%81ustria%2C+86%2C+Hava%C3%AD%2C+Belo+Horizonte+MG";

export default function ContactPage() {
  const [search, setSearch] = useState("");
  const { items, updateQty, removeItem, clearCart } = useCartSession();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Fale conosco | Ásia Peças & Máquinas"
        description="Atendimento comercial e técnico para peças XCMG no Brasil, Venezuela e Guiana. WhatsApp, e-mail, telefone e endereço da Ásia Peças & Máquinas."
        canonical="/contato"
        jsonLd={[organizationLd(), localBusinessLd(), breadcrumbLd([
          { name: "Início", url: "/" },
          { name: "Fale conosco", url: "/contato" },
        ])]}
      />

      <SiteHeader
        lang="pt"
        search={search}
        onSearchChange={setSearch}
        cartCount={items.length}
        onOpenCart={() => window.dispatchEvent(new Event("open-quote-cart"))}
      />

      {/* Herói */}
      <div className="border-b border-border bg-gradient-to-br from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-7 md:py-9">
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-3">
            <ol className="flex gap-1">
              <li><Link to="/" className="hover:text-primary">Início</Link></li>
              <li>/</li>
              <li className="text-foreground">Fale conosco</li>
            </ol>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight mb-2">Fale conosco</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
            Atendimento comercial e técnico para peças XCMG no Brasil, Venezuela e Guiana. Escolha o canal mais rápido para você.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 w-full flex-1 space-y-10">

        {/* Canais de atendimento */}
        <section>
          <h2 className="text-lg md:text-xl font-display font-bold tracking-tight mb-4">Canais de atendimento</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* WhatsApp */}
            <div className="bg-card border border-border rounded-lg p-5 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0">
                  <WhatsAppIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground leading-tight">WhatsApp</h3>
                  <p className="text-xs text-muted-foreground">Resposta rápida no horário comercial</p>
                </div>
              </div>
              <div className="mt-auto flex flex-col gap-2">
                {WHATSAPP.map((w) => (
                  <a key={w.href} href={w.href} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold text-sm py-2.5 rounded-full hover:brightness-95 transition">
                    <WhatsAppIcon className="h-4 w-4" /> {w.label}
                  </a>
                ))}
              </div>
            </div>

            {/* E-mail */}
            <div className="bg-card border border-border rounded-lg p-5 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground leading-tight">E-mail</h3>
                  <p className="text-xs text-muted-foreground">Comercial e cotações</p>
                </div>
              </div>
              <p className="font-mono text-sm text-foreground mb-3 break-all">vendas@asiapecas.com</p>
              <a href="mailto:vendas@asiapecas.com"
                className="mt-auto inline-flex items-center justify-center gap-2 border border-border text-foreground font-bold text-sm py-2.5 rounded-full hover:border-primary hover:text-primary transition">
                Enviar e-mail
              </a>
            </div>

            {/* Horário */}
            <div className="bg-card border border-border rounded-lg p-5 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Clock4 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground leading-tight">Horário</h3>
                  <p className="text-xs text-muted-foreground">Atendimento multilíngue</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Segunda a sexta, das 8h às 18h (horário de Brasília). Suporte em português, inglês e espanhol.
              </p>
            </div>
          </div>
        </section>

        {/* Cotação + Endereço */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cotação */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-display font-bold tracking-tight mb-2">Precisa de uma cotação?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Envie o código da peça, o modelo da máquina e o número de série, quando disponível. Você também pode montar sua
              lista direto no catálogo e enviar de uma vez.
            </p>
            <Link to="/pecas"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:brightness-95 transition">
              Montar cotação <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Endereço */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-display font-bold tracking-tight mb-2">Endereço</h2>
            <p className="text-sm text-foreground leading-relaxed">
              Ásia Peças &amp; Máquinas<br />
              Rua Áustria, 86, Havaí<br />
              Belo Horizonte/MG, CEP 30575-030<br />
              Brasil
            </p>
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              <MapPin className="h-4 w-4" /> Ver no mapa
            </a>
          </div>
        </section>

        {/* Pós-venda, dados fiscais e parcerias */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-display font-bold tracking-tight mb-2">Pós-venda e garantia</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Para garantia, devoluções e suporte técnico, use o canal comercial informando o número do pedido e a nota fiscal.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to="/garantia"
                className="inline-flex items-center gap-1.5 text-xs font-semibold border border-border rounded-full px-3 py-1.5 hover:border-primary hover:text-primary transition">
                <ShieldCheck className="h-3.5 w-3.5" /> Garantia
              </Link>
              <Link to="/trocas-e-devolucoes"
                className="inline-flex items-center gap-1.5 text-xs font-semibold border border-border rounded-full px-3 py-1.5 hover:border-primary hover:text-primary transition">
                <RotateCcw className="h-3.5 w-3.5" /> Trocas e devoluções
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-display font-bold tracking-tight mb-2">Dados fiscais</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                CNPJ e dados fiscais são enviados sob solicitação pelo e-mail comercial, ajustando a documentação ao país e ao
                regime tributário do cliente.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-display font-bold tracking-tight mb-2">Imprensa e parcerias</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Propostas de parceria, fornecimento, mídia e patrocínio: escreva para{" "}
                <a href="mailto:vendas@asiapecas.com" className="text-primary font-semibold hover:underline">vendas@asiapecas.com</a>{" "}
                com o assunto e a empresa.
              </p>
            </div>
          </div>
        </section>
      </main>

      <QuoteFooter lang="pt" />
      <QuoteCart items={items} onUpdateQty={updateQty} onRemove={removeItem} onClear={clearCart} lang="pt" showTrigger={false} />
    </div>
  );
}
