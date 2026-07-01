import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useModelParts, useModelDisplayName } from "@/hooks/use-model-parts";
import { useCartSession } from "@/hooks/use-cart-session";
import { SEO, organizationLd, breadcrumbLd, itemListLd } from "@/lib/seo";
import { getMachineType } from "@/lib/machine-data";
import { track, trackServerConversion } from "@/lib/analytics";
import { faqLd } from "@/components/quote/CategoryFAQ";
import QuotePartCard from "@/components/quote/QuotePartCard";
import QuoteCart from "@/components/quote/QuoteCart";
import QuoteFooter from "@/components/quote/QuoteFooter";
import SiteHeader from "@/components/quote/site/SiteHeader";
import B2BLeadDialog from "@/components/quote/B2BLeadDialog";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ChevronRight, ChevronDown, ChevronUp,
  Package, ShieldCheck, Truck, Clock,
  LayoutGrid, List,
} from "lucide-react";

/* ─── Part grouped by subcategory ─── */
function groupBySubcategory(parts: any[]): Record<string, any[]> {
  const map: Record<string, any[]> = {};
  for (const p of parts) {
    const key = p.subcategory || p.part_category || "Outras peças";
    if (!map[key]) map[key] = [];
    map[key].push(p);
  }
  return map;
}

/* ─── Accordion category section ─── */
function CategorySection({
  title, parts, inCartMaterials, onAdd, onViewDetail, defaultOpen,
}: {
  title: string;
  parts: any[];
  inCartMaterials: Set<string>;
  onAdd: (p: any) => void;
  onViewDetail: (p: any) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? parts : parts.slice(0, 4);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <LayoutGrid className="h-3.5 w-3.5" />
          </span>
          <span className="font-bold text-sm text-foreground">{title}</span>
          <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
            {parts.length} peças
          </span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {visible.map((part: any) => (
              <QuotePartCard
                key={part.id}
                part={part}
                inCart={inCartMaterials.has(part.material)}
                onAdd={() => onAdd(part)}
                onViewDetail={() => onViewDetail(part)}
                lang="pt"
              />
            ))}
          </div>
          {parts.length > 4 && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="mt-3 w-full text-xs text-primary font-semibold hover:underline py-2 flex items-center justify-center gap-1"
            >
              {showAll ? <><ChevronUp className="h-3.5 w-3.5" /> Mostrar menos</> : <><ChevronDown className="h-3.5 w-3.5" /> Ver todas as {parts.length} peças nesta categoria</>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── FAQ section ─── */
function FaqSection({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-muted/50 rounded-lg border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-bold text-base text-foreground">Perguntas frequentes</h2>
      </div>
      <div className="divide-y divide-border">
        {items.map((faq, i) => (
          <div key={i}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-muted/40 transition-colors"
            >
              <span className="text-sm font-semibold text-foreground pr-4">{faq.q}</span>
              {open === i ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
            </button>
            {open === i && (
              <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Main page ─── */
export default function ModelPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [b2bKey, setB2bKey] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef(false);

  const { data: parts = [], isLoading } = useModelParts(slug || null);
  const { data: modelName = slug?.toUpperCase() || "" } = useModelDisplayName(slug || null);
  const { items, addToCart, updateQty, removeItem, clearCart } = useCartSession();

  const { data: seoOverride } = useQuery({
    queryKey: ["seo-override", "model", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await supabase.from("vitrine_seo_overrides")
        .select("*").eq("kind", "model").eq("slug", slug!).maybeSingle();
      return data;
    },
  });

  const machine = useMemo(() => getMachineType(modelName), [modelName]);

  useEffect(() => {
    if (!isLoading && parts.length > 0) track.viewItemList(parts.slice(0, 30), `model:${slug}`);
  }, [isLoading, parts.length, slug]);

  useEffect(() => {
    const onScroll = () => {
      if (scrolledRef.current) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max > 0.75) {
        scrolledRef.current = true;
        track.scroll75Category(`model:${slug}`);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [slug]);

  const grouped = useMemo(() => groupBySubcategory(parts), [parts]);
  const categoryKeys = Object.keys(grouped).sort((a, b) => grouped[b].length - grouped[a].length);
  const total = parts.length;
  const categoriesCount = categoryKeys.length;
  const inCartMaterials = new Set(items.map(i => i.material));
  const top4 = parts.slice(0, 4);

  const wppText = `Olá! Preciso de peças para ${modelName}.`;
  const wppUrl = `https://wa.me/5531995165511?text=${encodeURIComponent(wppText)}`;
  const noindex = total === 0 || !!seoOverride?.noindex;

  const handleAdd = (part: any) => {
    addToCart(part);
    track.addToCart(part);
    toast.success("Adicionado à cotação!");
  };

  const handleWppClick = () => {
    track.contact("whatsapp_model", { slug });
    trackServerConversion({ event: "whatsapp_click" });
  };

  const faqItems = [
    { q: `Vocês têm peças para ${modelName} em estoque?`, a: `Sim! Temos ${total > 0 ? `${total} itens compatíveis` : "itens"} com ${modelName} disponíveis. Navegue pelas categorias acima ou entre em contato pelo WhatsApp para orientação especializada.` },
    { q: `As peças são originais XCMG?`, a: `Trabalhamos com peças originais XCMG e alternativas compatíveis de alta qualidade. Todos os itens passam por verificação de especificação técnica antes da expedição. Consulte nosso time para indicar a opção ideal para sua operação.` },
    { q: `Atendem pedidos para frota inteira?`, a: `Sim. Temos tabela corporativa exclusiva para frotas e distribuidores. Clique em "Tabela para frota" ou fale diretamente com nosso consultor pelo WhatsApp.` },
    { q: `Qual é o prazo de entrega?`, a: `Peças em estoque são expedidas em até 2 dias úteis após confirmação. O prazo de entrega varia de 7 a 15 dias úteis dependendo da região. Para Venezuela e Guiana, consulte prazos específicos.` },
    { q: `Como funciona a garantia?`, a: `Todos os itens têm garantia de 3 meses contra defeitos de fabricação. Peças originais XCMG contam com cobertura da garantia de fábrica integral.` },
  ];

  const defaultTitle = `Peças ${modelName} XCMG | ${total > 0 ? `${total} em estoque` : "Catálogo"} | Ásia Peças`;
  const defaultDesc = `${total > 0 ? `${total} peças` : "Catálogo completo"} compatíveis com ${modelName} XCMG — ${machine.application}. Filtros, motor, hidráulico, transmissão e muito mais. Pronta entrega e cotação em 24h.`;

  const lds: any[] = [
    organizationLd(),
    breadcrumbLd([
      { name: "Início", url: "/" },
      { name: "Catálogo XCMG", url: "/cotacao" },
      { name: machine.label, url: `/cotacao` },
      { name: modelName, url: `/cotacao/m/${slug}` },
    ]),
  ];
  if (top4.length) lds.push(itemListLd(top4 as any));
  lds.push(faqLd(faqItems));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={seoOverride?.title || defaultTitle}
        description={seoOverride?.description || defaultDesc}
        canonical={`/cotacao/m/${slug}`}
        image={seoOverride?.og_image || machine.photo}
        noindex={noindex}
        jsonLd={lds}
      />

      <SiteHeader
        lang="pt"
        search={search}
        onSearchChange={setSearch}
        cartCount={items.length}
        onOpenCart={() => window.dispatchEvent(new Event("open-quote-cart"))}
      />

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-secondary text-secondary-foreground">
        <div className="absolute inset-0">
          <img
            src={machine.photo}
            alt={`${machine.label} XCMG ${modelName}`}
            className="w-full h-full object-cover object-center"
            loading="eager"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${machine.accentColor} to-transparent`} />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary/50 via-transparent to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-14 md:py-20 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent text-accent-foreground rounded-full text-[11px] font-bold uppercase tracking-wider">
              <Package className="h-3 w-3" /> {machine.label}
            </span>
            <span className="px-2.5 py-1 bg-primary-foreground/15 text-primary-foreground rounded-full text-[11px] font-semibold backdrop-blur-sm">XCMG Oficial</span>
            {total > 0 && (
              <span className="px-2.5 py-1 bg-success text-success-foreground rounded-full text-[11px] font-bold">
                {total} peças em estoque
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold font-display tracking-tight leading-[1.07] max-w-2xl">
            Peças para <span className="text-accent">{modelName}</span>
          </h1>

          <p className="text-sm md:text-base text-secondary-foreground/80 max-w-xl leading-relaxed">
            {machine.application} · Distribuidora autorizada XCMG no Brasil, Venezuela e Guiana. Cotação em até 24h.
          </p>

          <div className="flex flex-wrap gap-3 text-xs text-secondary-foreground/70">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-accent shrink-0" /> Garantia de fábrica</span>
            <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-accent shrink-0" /> Entrega nacional</span>
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-accent shrink-0" /> Cotação em 24h</span>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:brightness-95 gap-2 font-bold"
              onClick={() => listRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              <ChevronDown className="h-4 w-4" /> Ver peças disponíveis
            </Button>
            <a href={wppUrl} target="_blank" rel="noopener noreferrer" onClick={handleWppClick}>
              <Button size="lg" variant="outline" className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur gap-2 font-bold">
                <WhatsAppIcon className="h-4 w-4" /> WhatsApp
              </Button>
            </a>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur gap-2" onClick={() => setB2bKey(k => k + 1)}>
              Tabela para frota
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Main content ─── */}
      <main className="flex-1 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">

          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-5 flex items-center gap-1 flex-wrap">
            <Link to="/" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link to="/cotacao" className="hover:text-primary transition-colors">Catálogo XCMG</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-foreground font-medium">{modelName}</span>
          </nav>

          {/* Stats strip */}
          {total > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { value: total.toLocaleString("pt-BR"), label: "peças disponíveis" },
                { value: categoriesCount.toString(), label: "categorias" },
                { value: parts.filter(p => p.stock > 10).length.toLocaleString("pt-BR"), label: "pronta entrega" },
              ].map(s => (
                <div key={s.label} className="bg-card border border-border rounded-lg p-4 text-center shadow-sm">
                  <p className="text-2xl font-bold text-primary">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Machine description */}
          <div className="bg-card border border-border rounded-lg p-5 mb-6 shadow-sm">
            <h2 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
              <List className="h-4 w-4 text-primary" /> Sobre o {modelName}
            </h2>
            <p className="text-sm text-foreground/70 leading-relaxed">{machine.description}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {machine.keywords.map(kw => (
                <span key={kw} className="px-2.5 py-1 bg-muted text-muted-foreground rounded-full text-[10px] font-semibold border border-border">
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Parts by category */}
          <div ref={listRef} id="lista" className="space-y-3 mb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">
                Peças compatíveis com {modelName}
              </h2>
              {total > 0 && (
                <span className="text-[11px] text-muted-foreground">{total} itens em {categoriesCount} categorias</span>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : parts.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-lg">
                <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">Sem peças em estoque para {modelName}</p>
                <p className="text-xs text-muted-foreground mb-4">Entre em contato — podemos localizar as peças que você precisa.</p>
                <a href={wppUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="gap-2 bg-[#25D366] hover:bg-[#22c55e] text-white">
                    <WhatsAppIcon className="h-4 w-4" /> Consultar disponibilidade
                  </Button>
                </a>
              </div>
            ) : (
              categoryKeys.map((cat, i) => (
                <CategorySection
                  key={cat}
                  title={cat}
                  parts={grouped[cat]}
                  inCartMaterials={inCartMaterials}
                  onAdd={handleAdd}
                  onViewDetail={(p) => navigate(`/cotacao/p/${encodeURIComponent(p.material)}`)}
                  defaultOpen={i < 2}
                />
              ))
            )}
          </div>

          {/* WhatsApp CTA */}
          <div className="bg-primary text-primary-foreground rounded-lg p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-base">Não encontrou a peça que precisa?</p>
              <p className="text-sm text-primary-foreground/75 mt-0.5">Nossa equipe localiza qualquer peça para {modelName} em até 24h.</p>
            </div>
            <a href={wppUrl} target="_blank" rel="noopener noreferrer" onClick={handleWppClick} className="shrink-0">
              <Button className="bg-accent text-accent-foreground hover:brightness-95 gap-2 font-bold">
                <WhatsAppIcon className="h-4 w-4" /> Consultar pelo WhatsApp
              </Button>
            </a>
          </div>

          {/* FAQ */}
          <div className="mb-6">
            <FaqSection items={faqItems} />
          </div>

          {/* SEO keyword paragraph */}
          <div className="text-xs text-muted-foreground leading-relaxed pb-4">
            Peças para {modelName} XCMG — {machine.keywords.join(", ")}. Distribuidora autorizada XCMG: Brasil, Venezuela e Guiana. Cotação em até 24h, nota fiscal emitida, entrega nacional.
          </div>
        </div>
      </main>

      <QuoteFooter lang="pt" />
      <QuoteCart items={items.map(i => ({ material: i.material, description: i.description, quantity: i.quantity }))} onUpdateQty={updateQty} onRemove={removeItem} onClear={clearCart} lang="pt" showTrigger={false} />
      <B2BLeadDialog key={b2bKey} lang="pt" />
    </div>
  );
}
