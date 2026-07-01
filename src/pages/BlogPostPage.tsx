import { useParams, Link, useNavigate } from "react-router-dom";
import { useBlogPost, useBlogCategories } from "@/hooks/use-blog-posts";
import { SEO, organizationLd, breadcrumbLd } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Calendar, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import SiteHeader from "@/components/quote/site/SiteHeader";
import QuoteFooter from "@/components/quote/QuoteFooter";
import QuoteCart from "@/components/quote/QuoteCart";
import { useCartSession } from "@/hooks/use-cart-session";

const SITE = "https://asiapecas.com";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data: post, isLoading } = useBlogPost(slug);
  const { data: cats = [] } = useBlogCategories();
  const { items, updateQty, removeItem, clearCart } = useCartSession();

  const { data: relatedParts = [] } = useQuery({
    queryKey: ["blog-related-parts", post?.related_part_ids],
    enabled: !!post?.related_part_ids?.length,
    queryFn: async () => {
      const { data } = await supabase
        .from("parts")
        .select("id, material, description, image_url, machine_model")
        .in("id", post!.related_part_ids);
      return data || [];
    },
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!post || post.status !== "published") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Post não encontrado.</p>
        <Link to="/blog"><Button>Voltar ao blog</Button></Link>
      </div>
    );
  }

  const categoryName = cats.find((c) => c.slug === post.category_slug)?.name;
  const url = `${SITE}/blog/${post.slug}`;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || post.seo_description,
    image: post.cover_url || undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { "@type": "Organization", name: post.author_name || "Ásia Peças & Máquinas" },
    publisher: {
      "@type": "Organization",
      name: "Ásia Peças & Máquinas",
      logo: { "@type": "ImageObject", url: `${SITE}/logo.png` },
    },
    mainEntityOfPage: url,
  };

  return (
    <>
      <SEO
        title={post.seo_title || post.title}
        description={post.seo_description || post.excerpt || ""}
        canonical={`/blog/${post.slug}`}
        image={post.cover_url || undefined}
        type="article"
        jsonLd={[organizationLd(), articleLd, breadcrumbLd([
          { name: "Início", url: "/" },
          { name: "Blog", url: "/blog" },
          { name: post.title, url: `/blog/${post.slug}` },
        ])]}
      />

      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader
          lang="pt"
          search={search}
          onSearchChange={setSearch}
          cartCount={items.length}
          onOpenCart={() => window.dispatchEvent(new Event("open-quote-cart"))}
        />

        <article className="max-w-3xl mx-auto px-4 md:px-6 py-8 w-full flex-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-1">
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>

          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-6">
            <ol className="flex gap-1 flex-wrap">
              <li><Link to="/" className="hover:text-primary">Início</Link></li>
              <li>/</li>
              <li><Link to="/blog" className="hover:text-primary">Blog</Link></li>
              <li>/</li>
              <li className="text-foreground line-clamp-1">{post.title}</li>
            </ol>
          </nav>

          <header className="space-y-4 mb-8">
            {categoryName && (
              <Badge variant="outline">{categoryName}</Badge>
            )}
            <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight leading-tight">{post.title}</h1>
            {post.excerpt && <p className="text-lg text-muted-foreground">{post.excerpt}</p>}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {post.published_at && new Date(post.published_at).toLocaleDateString("pt-BR")}
              </span>
              {post.author_name && (
                <span className="inline-flex items-center gap-1">
                  <User className="h-3 w-3" /> {post.author_name}
                </span>
              )}
            </div>
          </header>

          {post.cover_url && (
            <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-8">
              <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-h2:text-2xl prose-h3:text-xl">
            <ReactMarkdown>{post.content_md}</ReactMarkdown>
          </div>

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t">
              {post.tags.map((t) => (
                <Badge key={t} variant="secondary">{t}</Badge>
              ))}
            </div>
          )}

          {relatedParts.length > 0 && (
            <section className="mt-10 pt-6 border-t">
              <h2 className="font-bold text-xl mb-4 font-display">Peças relacionadas</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {relatedParts.map((p: any) => (
                  <Link
                    key={p.id}
                    to={`/cotacao/p/${encodeURIComponent(p.material)}`}
                    className="flex gap-3 p-3 rounded-lg border hover:border-primary/40 transition-colors"
                  >
                    <div className="w-16 h-16 bg-muted rounded shrink-0 overflow-hidden">
                      {p.image_url && <img src={p.image_url} alt={p.description} className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium line-clamp-2">{p.description}</p>
                      <p className="text-xs text-muted-foreground font-mono">#{p.material}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

        <QuoteFooter lang="pt" />
      </div>

      <QuoteCart items={items} onUpdateQty={updateQty} onRemove={removeItem} onClear={clearCart} lang="pt" showTrigger={false} />
    </>
  );
}
