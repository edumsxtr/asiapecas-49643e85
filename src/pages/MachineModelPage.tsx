import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SiteHeader from "@/components/quote/site/SiteHeader";
import QuoteFooter from "@/components/quote/QuoteFooter";
import QuoteCart from "@/components/quote/QuoteCart";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { useCartSession } from "@/hooks/use-cart-session";
import { SEO, organizationLd, breadcrumbLd } from "@/lib/seo";
import { getMachine } from "@/data/machines";

export default function MachineModelPage() {
  const { slug } = useParams<{ slug: string }>();
  const [search, setSearch] = useState("");
  const { items, updateQty, removeItem, clearCart } = useCartSession();

  const machine = getMachine(slug);
  if (!machine) return <Navigate to="/maquinas" replace />;

  const wppUrl = `https://wa.me/5531995165511?text=${encodeURIComponent(
    `Olá, tenho interesse na ${machine.name}. Pode me enviar uma cotação?`,
  )}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={`${machine.name} | Ásia Peças & Máquinas`}
        description={`${machine.model}: ${machine.tagline} Peso ${machine.highlights[0].value}, ${machine.highlights[1].value} de potência. Peças e cotação XCMG com a Ásia Peças.`}
        canonical={`/maquinas/${machine.categorySlug}/${machine.slug}`}
        jsonLd={[organizationLd(), breadcrumbLd([
          { name: "Início", url: "/" },
          { name: "Máquinas", url: "/maquinas" },
          { name: machine.category, url: `/maquinas?tipo=${machine.categorySlug}` },
          { name: machine.model, url: `/maquinas/${machine.categorySlug}/${machine.slug}` },
        ])]}
      />

      <SiteHeader
        lang="pt"
        search={search}
        onSearchChange={setSearch}
        cartCount={items.length}
        onOpenCart={() => window.dispatchEvent(new Event("open-quote-cart"))}
      />

      {/* Herói — título */}
      <div className="border-b border-border bg-gradient-to-br from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-7 md:py-9">
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-3">
            <ol className="flex flex-wrap gap-1">
              <li><Link to="/" className="hover:text-primary">Início</Link></li>
              <li>/</li>
              <li><Link to="/maquinas" className="hover:text-primary">Máquinas</Link></li>
              <li>/</li>
              <li><Link to={`/maquinas?tipo=${machine.categorySlug}`} className="hover:text-primary">{machine.category}</Link></li>
              <li>/</li>
              <li className="text-foreground">{machine.model}</li>
            </ol>
          </nav>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent text-accent-foreground rounded-full text-[11px] font-bold uppercase tracking-wider">
            XCMG · {machine.category.replace(/s$/, "")}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight mt-3">{machine.name}</h1>
          <p className="text-base text-muted-foreground max-w-2xl mt-2">{machine.tagline}</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 w-full flex-1 space-y-10">

        {/* Split: imagem (lateral, fixa) | características + descrição */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

          {/* Coluna da imagem */}
          <div className="lg:sticky lg:top-24 space-y-5">
            <div className="rounded-lg border border-border bg-gradient-to-br from-muted to-card p-6 md:p-8 flex items-center justify-center">
              <img src={machine.image} alt={`${machine.name}, vista lateral`} className="w-full max-w-md h-auto object-contain drop-shadow-md" />
            </div>

            {/* Destaques */}
            <div className="grid grid-cols-3 gap-2">
              {machine.highlights.map((h) => (
                <div key={h.label} className="bg-card border border-border rounded-lg px-3 py-2.5 text-center">
                  <p className="font-mono font-bold text-foreground text-base leading-tight">{h.value}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{h.label}</p>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-2.5">
              <a href={wppUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold text-sm px-5 py-2.5 rounded-full hover:brightness-95 transition">
                <WhatsAppIcon className="h-4 w-4" /> Solicitar cotação
              </a>
              <Link to={`/pecas?q=${encodeURIComponent(machine.model)}`}
                className="inline-flex items-center gap-2 border border-border text-foreground font-bold text-sm px-5 py-2.5 rounded-full hover:border-primary hover:text-primary transition">
                Ver peças <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Coluna de conteúdo: características + descrição + aplicações */}
          <div className="space-y-8">
            {/* Características */}
            <section>
              <h2 className="text-lg md:text-xl font-display font-bold tracking-tight mb-4">Especificações técnicas</h2>
              <div className="grid grid-cols-2 gap-3">
                {machine.specs.map((s) => (
                  <div key={s.label} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground leading-tight">{s.label}</p>
                      <p className="font-mono font-bold text-foreground text-sm leading-tight">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Descrição */}
            <section>
              <h2 className="text-lg md:text-xl font-display font-bold tracking-tight mb-3">Sobre a {machine.model}</h2>
              <div className="space-y-3">
                {machine.description.map((p, i) => (
                  <p key={i} className="text-sm text-muted-foreground leading-relaxed">{p}</p>
                ))}
              </div>
            </section>

            {/* Aplicações */}
            {machine.applications && machine.applications.length > 0 && (
              <section>
                <h2 className="text-lg md:text-xl font-display font-bold tracking-tight mb-3">Aplicações</h2>
                <ul className="grid grid-cols-2 gap-2">
                  {machine.applications.map((a) => (
                    <li key={a} className="flex items-center gap-2 text-sm text-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" /> {a}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>

        {/* CTA final */}
        <section className="bg-primary text-primary-foreground rounded-lg p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-extrabold text-xl md:text-2xl tracking-tight leading-tight">
              Peças e suporte para a {machine.model}
            </h2>
            <p className="text-sm text-primary-foreground/80 mt-1">
              Peças originais e compatíveis XCMG com estoque real e cotação em até 24h.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <a href={wppUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold text-sm px-5 py-2.5 rounded-full hover:brightness-95 transition">
              <WhatsAppIcon className="h-4 w-4" /> WhatsApp Vendas
            </a>
            <Link to={`/pecas?q=${encodeURIComponent(machine.model)}`}
              className="inline-flex items-center gap-2 bg-primary-foreground text-primary font-bold text-sm px-5 py-2.5 rounded-full hover:brightness-95 transition">
              Ver peças <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <QuoteFooter lang="pt" />
      <QuoteCart items={items} onUpdateQty={updateQty} onRemove={removeItem} onClear={clearCart} lang="pt" showTrigger={false} />
    </div>
  );
}
