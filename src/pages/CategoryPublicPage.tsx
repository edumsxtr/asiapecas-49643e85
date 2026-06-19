import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { findCategoryBySlug, slugify, modelSlug } from "@/lib/slugs";
import { useCategoryParts, useCategoryRelatedModels } from "@/hooks/use-category-parts";
import { useCartSession } from "@/hooks/use-cart-session";
import { SEO, organizationLd, breadcrumbLd, productLd, itemListLd } from "@/lib/seo";
import { track, trackServerConversion } from "@/lib/analytics";
import CategoryHero from "@/components/quote/CategoryHero";
import RelatedChips from "@/components/quote/RelatedChips";
import CategoryFAQ, { faqLd } from "@/components/quote/CategoryFAQ";
import QuotePartCard from "@/components/quote/QuotePartCard";
import QuoteCart from "@/components/quote/QuoteCart";
import QuoteFooter from "@/components/quote/QuoteFooter";
import B2BLeadDialog from "@/components/quote/B2BLeadDialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useCategoryMedia } from "@/hooks/use-category-media";

export default function CategoryPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const cat = useMemo(() => (slug ? findCategoryBySlug(slug) : undefined), [slug]);
  const categoryName = cat?.key || null;
  const { data: parts = [], isLoading } = useCategoryParts(categoryName);
  const { data: relatedModels = [] } = useCategoryRelatedModels(categoryName);
  const { items, addToCart, updateQty, removeItem, clearCart } = useCartSession();
  const { data: catMedia } = useCategoryMedia(categoryName);
  const [b2bKey, setB2bKey] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef(false);

  // SEO override (admin can edit)
  const { data: seoOverride } = useQuery({
    queryKey: ["seo-override", "category", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await supabase
        .from("vitrine_seo_overrides")
        .select("*")
        .eq("kind", "category").eq("slug", slug!).maybeSingle();
      return data;
    },
  });

  // Active promotions (campaign badge)
  const { data: promoCount = 0 } = useQuery({
    queryKey: ["category-promo-count", categoryName],
    enabled: !!categoryName && parts.length > 0,
    queryFn: async () => {
      const ids = parts.map(p => p.id);
      const { count } = await supabase
        .from("part_promotions")
        .select("part_id", { count: "exact", head: true })
        .eq("active", true)
        .in("part_id", ids);
      return count || 0;
    },
  });

  // Track view_item_list once
  useEffect(() => {
    if (!isLoading && parts.length > 0 && categoryName) {
      track.viewItemList(parts.slice(0, 30), `category:${slug}`);
    }
  }, [isLoading, parts.length, categoryName, slug]);

  // Scroll 75% tracker
  useEffect(() => {
    const onScroll = () => {
      if (scrolledRef.current) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max > 0.75) {
        scrolledRef.current = true;
        track.scroll75Category(slug || "");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [slug]);

  // Unknown slug
  if (slug && !cat) {
    return (
      <>
        <SEO title="Categoria não encontrada · Ásia Peças" canonical={`/cotacao/c/${slug}`} noindex />
        <div className="min-h-screen flex flex-col items-center justify-center gap-3">
          <p className="text-muted-foreground">Categoria não encontrada.</p>
          <Link to="/cotacao/categorias"><Button variant="outline">Ver todas as categorias</Button></Link>
        </div>
      </>
    );
  }

  const top4 = parts.slice(0, 4);
  const cartItemsForCart = items.map(i => ({ material: i.material, description: i.description, quantity: i.quantity }));
  const handleWppClick = () => {
    track.contact("whatsapp_category", { slug });
    trackServerConversion({ event: "whatsapp_click" });
  };
  const handleB2bClick = () => setB2bKey(k => k + 1);
  const handleScrollToList = () => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const total = parts.length;
  const hasStock = total > 0;
  const noindex = !hasStock || !!seoOverride?.noindex;

  const wppText = `Olá! Tenho interesse em ${cat?.key || "peças"} XCMG.`;
  const wppUrl = `https://wa.me/5531992293767?text=${encodeURIComponent(wppText)}`;

  const defaultTitle = `${cat?.key} XCMG · ${total} em estoque · Ásia Peças`;
  const defaultDesc = `${total} ${cat?.key?.toLowerCase()} originais e equivalentes para máquinas XCMG. Estoque real em Macapá-AP. Cotação rápida via WhatsApp em PT/EN/ES.`;

  const faqItems = cat ? [
    { q: `Vocês têm ${cat.key.toLowerCase()} XCMG em estoque?`, a: `Sim. Atualmente temos ${total} itens da categoria ${cat.key} disponíveis para pronta entrega no Brasil.` },
    { q: `Como solicito uma cotação de ${cat.key.toLowerCase()}?`, a: `Adicione as peças ao carrinho de cotação ou clique em WhatsApp. Respondemos em até 1 hora útil.` },
    { q: `Há garantia nas peças?`, a: `Todas as peças vendidas pela Ásia Peças & Máquinas têm 3 meses de garantia contra defeitos de fabricação.` },
  ] : [];

  const lds: any[] = [organizationLd()];
  if (cat) {
    lds.push(breadcrumbLd([
      { name: "Início", url: "/" },
      { name: "Cotação", url: "/cotacao" },
      { name: "Categorias", url: "/cotacao/categorias" },
      { name: cat.key, url: `/cotacao/c/${slug}` },
    ]));
    if (top4.length) lds.push(itemListLd(top4 as any));
    lds.push(faqLd(faqItems));
  }

  const Icon = cat?.icon;

  return (
    <>
      <SEO
        title={seoOverride?.title || defaultTitle}
        description={seoOverride?.description || defaultDesc}
        canonical={`/cotacao/c/${slug}`}
        image={seoOverride?.og_image || top4[0]?.image_url || undefined}
        noindex={noindex}
        jsonLd={lds}
      />

      <div className="min-h-screen bg-background flex flex-col">
        <CategoryHero
          title={catMedia?.headline || `${cat?.key} para máquinas XCMG`}
          subtitle={catMedia?.description || defaultDesc}
          countBadge={hasStock ? `${total} em estoque` : "Sob consulta"}
          Icon={Icon}
          whatsAppUrl={wppUrl}
          onB2bClick={handleB2bClick}
          onScrollToList={handleScrollToList}
          campaignActive={total > 0 && promoCount / total > 0.5}
          imageUrl={catMedia?.image_url || undefined}
        />

        <div className="max-w-6xl mx-auto px-6 py-6 w-full">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-1">
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>

          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-6">
            <ol className="flex flex-wrap gap-1">
              <li><Link to="/" className="hover:text-primary">Início</Link></li>
              <li>/</li>
              <li><Link to="/cotacao" className="hover:text-primary">Cotação</Link></li>
              <li>/</li>
              <li><Link to="/cotacao/categorias" className="hover:text-primary">Categorias</Link></li>
              <li>/</li>
              <li className="text-foreground">{cat?.key}</li>
            </ol>
          </nav>

          {/* Mais procurados */}
          {top4.length > 0 && (
            <section className="mb-10 space-y-3">
              <h2 className="text-lg font-semibold font-['Space_Grotesk']">Mais procurados em estoque</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {top4.map(p => (
                  <QuotePartCard
                    key={p.id}
                    part={p as any}
                    inCart={items.some(i => i.material === p.material)}
                    hasAiData={false}
                    onAdd={() => { addToCart(p as any); track.addToCart(p as any); toast.success("Adicionado à cotação"); }}
                    onViewDetail={() => navigate(`/cotacao/p/${encodeURIComponent(p.material)}`)}
                    lang="pt"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Catálogo completo */}
          <section ref={listRef} id="lista" className="space-y-3 mb-10">
            <h2 className="text-lg font-semibold font-['Space_Grotesk']">Todas as peças desta categoria</h2>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : parts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem itens em estoque no momento. <a href={wppUrl} onClick={handleWppClick} className="text-primary underline">Solicitar pelo WhatsApp</a>.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {parts.map(p => (
                  <QuotePartCard
                    key={p.id}
                    part={p as any}
                    inCart={items.some(i => i.material === p.material)}
                    hasAiData={false}
                    onAdd={() => { addToCart(p as any); track.addToCart(p as any); toast.success("Adicionado à cotação"); }}
                    onViewDetail={() => navigate(`/cotacao/p/${encodeURIComponent(p.material)}`)}
                    lang="pt"
                  />
                ))}
              </div>
            )}
          </section>

          {/* Modelos compatíveis */}
          <div className="mb-10">
            <RelatedChips
              title="Modelos compatíveis"
              items={relatedModels.map(m => ({
                label: m.model,
                href: `/cotacao/m/${modelSlug(m.model)}`,
                count: m.count,
              }))}
            />
          </div>

          {/* FAQ */}
          <div className="mb-10">
            <CategoryFAQ items={faqItems} />
          </div>
        </div>

        <QuoteFooter lang="pt" />
      </div>

      <QuoteCart
        items={cartItemsForCart}
        onUpdateQty={updateQty}
        onRemove={removeItem}
        onClear={clearCart}
        lang="pt"
      />
      <B2BLeadDialog key={b2bKey} lang="pt" />
    </>
  );
}
