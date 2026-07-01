import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SiteHeader from "@/components/quote/site/SiteHeader";
import QuoteFooter from "@/components/quote/QuoteFooter";
import QuoteCart from "@/components/quote/QuoteCart";
import { useCartSession } from "@/hooks/use-cart-session";
import { SEO, organizationLd, breadcrumbLd } from "@/lib/seo";
import { MACHINE_LIST, type Machine } from "@/data/machines";

// Rótulos amigáveis dos tipos de máquina (mesmo vocabulário do menu).
const TYPE_LABELS: Record<string, string> = {
  escavadeiras: "Escavadeiras",
  carregadeiras: "Pás-carregadeiras",
  guindastes: "Guindastes",
  motoniveladoras: "Motoniveladoras",
  rolos: "Rolos compactadores",
  retroescavadeiras: "Retroescavadeiras",
  perfuratrizes: "Perfuratrizes",
};

function MachineCard({ m }: { m: Machine }) {
  return (
    <Link
      to={`/maquinas/${m.categorySlug}/${m.slug}`}
      className="group flex flex-col bg-card border border-border rounded-lg overflow-hidden hover:border-primary hover:shadow-md transition-all"
    >
      <div className="aspect-[4/3] bg-gradient-to-br from-muted to-card flex items-center justify-center p-4">
        <img
          src={m.image}
          alt={m.name}
          loading="lazy"
          className="max-h-full w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
        />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{m.category}</p>
        <h3 className="font-display font-bold text-foreground leading-tight mt-0.5">{m.model}</h3>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-xs font-mono text-muted-foreground">
          {m.highlights.map((h) => (
            <span key={h.label}>{h.value}</span>
          ))}
        </div>
        <span className="mt-auto pt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">
          Ver máquina <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  );
}

export default function ModelsIndexPage() {
  const [searchParams] = useSearchParams();
  const tipoParam = searchParams.get("tipo");
  const [search, setSearch] = useState("");
  const { items, updateQty, removeItem, clearCart } = useCartSession();

  // Categorias que realmente têm máquinas (na ordem em que aparecem).
  const categories: { slug: string; label: string }[] = [];
  const seen = new Set<string>();
  for (const m of MACHINE_LIST) {
    if (!seen.has(m.categorySlug)) {
      seen.add(m.categorySlug);
      categories.push({ slug: m.categorySlug, label: m.category });
    }
  }

  const activeTipo = tipoParam && TYPE_LABELS[tipoParam] ? tipoParam : null;
  const visible = activeTipo ? MACHINE_LIST.filter((m) => m.categorySlug === activeTipo) : MACHINE_LIST;

  const groups = categories
    .filter((c) => !activeTipo || c.slug === activeTipo)
    .map((c) => ({ ...c, machines: visible.filter((m) => m.categorySlug === c.slug) }))
    .filter((g) => g.machines.length > 0);

  const lds = [
    organizationLd(),
    breadcrumbLd([
      { name: "Início", url: "/" },
      { name: "Máquinas", url: "/maquinas" },
    ]),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Máquinas XCMG · Escavadeiras e retroescavadeiras | Ásia Peças"
        description="Linha de máquinas pesadas XCMG: escavadeiras e retroescavadeiras. Veja especificações, fotos e solicite cotação de peças e equipamentos com a Ásia Peças."
        canonical="/maquinas"
        jsonLd={lds}
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
              <li className="text-foreground">Máquinas</li>
            </ol>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight mb-2">Máquinas XCMG</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
            Conheça a linha de máquinas pesadas XCMG. Veja especificações, fotos e solicite a cotação de peças e equipamentos.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 w-full flex-1">

        {/* Filtro por categoria */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mb-6">
          <Link
            to="/maquinas"
            className={`shrink-0 px-3.5 h-9 inline-flex items-center rounded-full border text-xs font-semibold transition-colors ${
              !activeTipo ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground hover:border-primary/50"
            }`}
          >
            Todas
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              to={`/maquinas?tipo=${c.slug}`}
              className={`shrink-0 px-3.5 h-9 inline-flex items-center rounded-full border text-xs font-semibold transition-colors ${
                activeTipo === c.slug ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground hover:border-primary/50"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>

        {groups.length > 0 ? (
          <div className="space-y-10">
            {groups.map((g) => (
              <section key={g.slug}>
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-display font-bold tracking-tight text-foreground">{g.label}</h2>
                  <span className="text-xs text-muted-foreground">{g.machines.length} {g.machines.length === 1 ? "modelo" : "modelos"}</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {g.machines.map((m) => <MachineCard key={m.slug} m={m} />)}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <p className="text-sm text-foreground font-semibold">
              {activeTipo ? `Em breve: ${TYPE_LABELS[activeTipo]}` : "Em breve novas máquinas."}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Fale com nosso time para disponibilidade e cotação desta linha.
            </p>
            <Link to="/maquinas" className="mt-3 inline-block text-xs font-bold text-primary hover:underline">
              Ver todas as máquinas
            </Link>
          </div>
        )}
      </main>

      <QuoteFooter lang="pt" />
      <QuoteCart items={items} onUpdateQty={updateQty} onRemove={removeItem} onClear={clearCart} lang="pt" showTrigger={false} />
    </div>
  );
}
