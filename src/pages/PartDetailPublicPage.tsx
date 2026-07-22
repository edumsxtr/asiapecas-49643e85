import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { partImage } from "@/lib/default-part-image";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEO, productLd, breadcrumbLd, organizationLd } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight, ShoppingCart, Tag, ShieldCheck, Truck,
  Clock, Star, Share2, Copy, Check, ChevronLeft, Zap,
  AlertTriangle, PackageSearch, Wrench, CheckCircle2,
} from "lucide-react";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { useCartSession } from "@/hooks/use-cart-session";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import { useEffect } from "react";
import { usePartImages } from "@/hooks/use-part-images";
import { PartImageCarousel } from "@/components/quote/PartImageCarousel";
import SiteHeader from "@/components/quote/site/SiteHeader";
import QuoteFooter from "@/components/quote/QuoteFooter";
import QuoteCart from "@/components/quote/QuoteCart";

const TRUST = [
  { icon: ShieldCheck, title: "Compra protegida",   desc: "Dados seguros em toda a transação" },
  { icon: Truck,       title: "Entrega nacional",    desc: "Brasil, Venezuela e Guiana" },
  { icon: Star,        title: "Garantia de fábrica", desc: "Cobertura oficial XCMG" },
  { icon: Clock,       title: "Cotação em 24h",      desc: "Resposta rápida do time comercial" },
];

export default function PartDetailPublicPage() {
  const { material } = useParams<{ material: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const { items: cartItems, addToCart, updateQty, removeItem, clearCart } = useCartSession();

  const { data: part, isLoading } = useQuery({
    queryKey: ["public-part", material],
    enabled: !!material,
    queryFn: async () => {
      const { data } = await supabase.from("parts")
        .select("id, material, description, manufacturer, machine_model, stock, estimated_price, image_url, part_category, subcategory, compatible_models")
        .eq("material", material!)
        .maybeSingle();
      return data;
    },
  });

  const { data: ai } = useQuery({
    queryKey: ["public-part-ai", part?.id],
    enabled: !!part?.id,
    queryFn: async () => {
      const { data } = await supabase.from("ai_compatibility_results")
        .select("technical_description, compatible_machines, technical_specs, related_parts, maintenance_tips")
        .eq("part_id", part!.id).maybeSingle();
      return data;
    },
  });

  const { data: hasPromo } = useQuery({
    queryKey: ["public-part-promo", part?.id],
    enabled: !!part?.id,
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { count } = await supabase.from("part_promotions")
        .select("id", { count: "exact", head: true })
        .eq("part_id", part!.id).eq("active", true)
        .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`);
      return (count ?? 0) > 0;
    },
  });

  const { data: related = [] } = useQuery({
    queryKey: ["related-parts", part?.id, part?.subcategory, part?.machine_model],
    enabled: !!part?.id,
    queryFn: async () => {
      const filters = [];
      if (part!.subcategory) filters.push(supabase.from("parts").select("id, material, description, image_url, stock, machine_model").eq("subcategory", part!.subcategory).neq("id", part!.id).gt("stock", 0).limit(6));
      if (part!.machine_model) filters.push(supabase.from("parts").select("id, material, description, image_url, stock, machine_model").eq("machine_model", part!.machine_model).neq("id", part!.id).gt("stock", 0).limit(6));
      if (filters.length === 0) return [];
      const results = await Promise.all(filters);
      const merged = results.flatMap(r => r.data || []);
      const seen = new Set<string>();
      return merged.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; }).slice(0, 6);
    },
  });

  const { data: extraImages = [] } = usePartImages(part?.id);

  useEffect(() => { if (part) track.viewItem(part); }, [part]);

  const handleAdd = () => {
    addToCart(part);
    track.addToCart(part);
    toast.success("Adicionado à cotação!");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center text-muted-foreground">Carregando...</div>
    </div>
  );

  if (!part) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <PackageSearch className="h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground">Peça não encontrada.</p>
      <Link to="/cotacao"><Button>Voltar ao catálogo</Button></Link>
    </div>
  );

  const wppMsg = `Olá, gostaria de uma cotação para a peça ${part.material} - ${part.description}`;
  const wppUrl = `https://wa.me/5531995165511?text=${encodeURIComponent(wppMsg)}`;
  const wppShare = `https://wa.me/?text=${encodeURIComponent(`Veja essa peça XCMG: ${part.description} (${part.material})\n${window.location.href}`)}`;

  const specs = ai?.technical_specs as unknown as Record<string, string> | null;
  const machines = (ai?.compatible_machines as string[]) ?? [];
  const tips = ai?.maintenance_tips as string | null;
  const inCart = cartItems.some(i => i.material === part.material);

  const stockUrgent = part.stock > 0 && part.stock <= 5;
  const stockReady = part.stock > 10;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={`${part.description} | ${part.material} | Peças XCMG | Ásia Peças`}
        description={`${part.description} — código ${part.material}. ${part.machine_model ? `Compatível com ${part.machine_model}. ` : ""}Peça XCMG original ou compatível. ${part.stock > 0 ? "Em estoque" : "Sob consulta"}. Cotação rápida em até 24h.`}
        canonical={`/cotacao/p/${encodeURIComponent(part.material)}`}
        image={part.image_url || undefined}
        type="product"
        jsonLd={[
          organizationLd(),
          productLd({ ...part, images: extraImages.length > 0 ? extraImages.map(i => i.url) : undefined }),
          breadcrumbLd([
            { name: "Início", url: "/" },
            { name: "Catálogo XCMG", url: "/cotacao" },
            ...(part.subcategory ? [{ name: part.subcategory, url: `/cotacao` }] : []),
            { name: part.description, url: `/cotacao/p/${encodeURIComponent(part.material)}` },
          ]),
        ]}
      />

      <SiteHeader
        lang="pt"
        search={search}
        onSearchChange={setSearch}
        cartCount={cartItems.length}
        onOpenCart={() => window.dispatchEvent(new Event("open-quote-cart"))}
      />

      <main className="flex-1 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">

          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-5 flex items-center gap-1 flex-wrap">
            <Link to="/" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link to="/cotacao" className="hover:text-primary transition-colors">Catálogo XCMG</Link>
            {part.subcategory && (<>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <Link to="/cotacao" className="hover:text-primary transition-colors">{part.subcategory}</Link>
            </>)}
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-foreground font-medium line-clamp-1 max-w-[200px]">{part.description}</span>
          </nav>

          {/* Produto principal */}
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden mb-6">
            <div className="grid md:grid-cols-[1fr_1.1fr] gap-0">

              {/* Galeria */}
              <div className="p-5 md:p-8 border-b md:border-b-0 md:border-r border-border bg-muted/20">
                <PartImageCarousel
                  images={extraImages.map(i => ({ url: i.url, alt_text: i.alt_text }))}
                  fallbackUrl={part.image_url}
                  alt={part.description}
                />
              </div>

              {/* Info + CTAs */}
              <div className="p-5 md:p-8 flex flex-col gap-5">

                {/* Header do produto */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold tracking-wide">
                      #{part.material}
                    </span>
                    {hasPromo && (
                      <Badge className="bg-destructive text-destructive-foreground border-0 gap-1">
                        <Tag className="h-3 w-3" /> EM PROMOÇÃO
                      </Badge>
                    )}
                    {part.manufacturer && (
                      <Badge variant="outline" className="text-xs">{part.manufacturer}</Badge>
                    )}
                  </div>

                  <h1 className="text-xl md:text-2xl font-bold text-foreground leading-snug">
                    {part.description}
                  </h1>

                  {part.machine_model && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5 text-primary shrink-0" />
                      Compatível com <span className="font-semibold text-foreground">{part.machine_model}</span>
                    </p>
                  )}
                </div>

                {/* Disponibilidade */}
                <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                  stockReady
                    ? "bg-success/10 border-success/20"
                    : stockUrgent
                    ? "bg-warning/10 border-warning/20"
                    : part.stock > 0
                    ? "bg-primary/10 border-primary/20"
                    : "bg-muted border-foreground/10"
                }`}>
                  {stockReady ? (
                    <>
                      <Zap className="h-5 w-5 text-success shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-success">Pronta entrega</p>
                        <p className="text-xs text-success">{part.stock} unidades em estoque</p>
                      </div>
                    </>
                  ) : stockUrgent ? (
                    <>
                      <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-warning">Últimas {part.stock} unidades</p>
                        <p className="text-xs text-warning">Disponibilidade limitada — solicite já</p>
                      </div>
                    </>
                  ) : part.stock > 0 ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-primary">Disponível</p>
                        <p className="text-xs text-primary">{part.stock} unidades</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <PackageSearch className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-foreground">Sob consulta</p>
                        <p className="text-xs text-muted-foreground">Entre em contato para verificar disponibilidade</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Descrição técnica AI */}
                {ai?.technical_description && (
                  <p className="text-sm text-foreground/75 leading-relaxed border-l-2 border-primary/40 pl-3">
                    {ai.technical_description}
                  </p>
                )}

                {/* CTAs */}
                <div className="flex flex-col gap-2.5 pt-1">
                  <Button
                    size="lg"
                    className="w-full gap-2 h-12 text-base font-bold"
                    onClick={handleAdd}
                    disabled={inCart || part.stock <= 0}
                    variant={inCart ? "secondary" : "default"}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {inCart ? "Adicionado à cotação ✓" : "Adicionar à cotação"}
                  </Button>
                  <a href={wppUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button size="lg" variant="outline" className="w-full gap-2 h-12 text-base font-bold border-[#25D366] text-[#25D366] hover:bg-[#25D366]/8">
                      <WhatsAppIcon className="h-5 w-5" />
                      Cotação via WhatsApp
                    </Button>
                  </a>
                </div>

                {/* Selos de confiança */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {TRUST.map((t) => (
                    <div key={t.title} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                      <t.icon className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-[11px] font-bold text-foreground leading-tight">{t.title}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{t.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Compartilhar */}
                <div className="flex items-center gap-2 pt-1 border-t border-border">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Share2 className="h-3.5 w-3.5" /> Compartilhar:
                  </span>
                  <a href={wppShare} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition px-3 py-2 rounded-full text-xs font-semibold">
                    <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                  <button onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 bg-muted hover:bg-muted/80 transition px-3 py-2 rounded-full text-xs font-semibold text-foreground/70">
                    {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copiado!" : "Copiar link"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Detalhes técnicos */}
          {(specs || machines.length > 0 || tips) && (
            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden mb-6">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-base font-bold text-foreground">Informações técnicas</h2>
              </div>
              <div className="p-6 grid md:grid-cols-2 gap-8">

                {/* Specs table */}
                {specs && Object.keys(specs).length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary" /> Especificações
                    </h3>
                    <table className="w-full text-sm">
                      <tbody>
                        {Object.entries(specs).map(([k, v], i) => (
                          <tr key={k} className={i % 2 === 0 ? "bg-muted/40" : ""}>
                            <td className="py-2 px-3 font-semibold text-foreground/70 w-2/5 rounded-l">{k}</td>
                            <td className="py-2 px-3 text-foreground rounded-r">{String(v)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Máquinas compatíveis */}
                {machines.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Modelos compatíveis
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {machines.map((m) => (
                        <span key={m} className="px-2.5 py-1 bg-primary/8 text-primary text-xs font-semibold rounded-full border border-primary/15">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dicas de manutenção */}
                {tips && (
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" /> Dicas de manutenção
                    </h3>
                    <p className="text-sm text-foreground/70 leading-relaxed">{tips}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Produtos relacionados */}
          {related.length > 0 && (
            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden mb-6">
              <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">Peças relacionadas</h2>
                <Link to="/cotacao" className="text-xs text-primary hover:underline">
                  Ver catálogo completo →
                </Link>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {related.map((p: any) => (
                    <Link
                      key={p.id}
                      to={`/cotacao/p/${encodeURIComponent(p.material)}`}
                      className="group block bg-muted/30 hover:bg-primary/5 border border-border hover:border-primary/30 rounded-lg overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="aspect-square bg-muted overflow-hidden">
                        <img
                          src={partImage(p.image_url)}
                          alt={p.description}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-2.5">
                        <p className="font-mono text-[9px] text-primary font-bold">{p.material}</p>
                        <p className="text-xs text-foreground font-medium line-clamp-2 mt-0.5 leading-tight">{p.description}</p>
                        {p.stock > 0 && (
                          <span className="inline-block mt-1.5 text-[9px] text-success font-bold bg-success/10 px-1.5 py-0.5 rounded-full">
                            Em estoque
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Voltar */}
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ChevronLeft className="h-4 w-4" /> Voltar
          </button>
        </div>
      </main>

      <QuoteFooter lang="pt" />
      <QuoteCart items={cartItems} onUpdateQty={updateQty} onRemove={removeItem} onClear={clearCart} lang="pt" showTrigger={false} />
    </div>
  );
}
