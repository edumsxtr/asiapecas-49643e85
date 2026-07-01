import { useState } from "react";
import { Link } from "react-router-dom";
import { usePublishedPosts, useBlogCategories } from "@/hooks/use-blog-posts";
import { SEO, organizationLd, breadcrumbLd } from "@/lib/seo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Tag } from "lucide-react";
import SiteHeader from "@/components/quote/site/SiteHeader";
import QuoteFooter from "@/components/quote/QuoteFooter";
import QuoteCart from "@/components/quote/QuoteCart";
import { useCartSession } from "@/hooks/use-cart-session";


const PAGE_SIZE = 9;

export default function BlogIndexPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const [page, setPage] = useState(0);
  const { data: cats = [] } = useBlogCategories();
  const { data, isLoading } = usePublishedPosts({ category, page, pageSize: PAGE_SIZE });
  const { items, updateQty, removeItem, clearCart } = useCartSession();

  const totalPages = Math.ceil((data?.count || 0) / PAGE_SIZE);

  return (
    <>
      <SEO
        title="Blog Ásia Peças — Manutenção, peças e dicas técnicas XCMG"
        description="Conteúdo técnico sobre peças, manutenção preventiva e operação de máquinas pesadas XCMG. Dicas práticas para mineração, linha amarela e mais."
        canonical="/blog"
        jsonLd={[organizationLd(), breadcrumbLd([
          { name: "Início", url: "/" },
          { name: "Blog", url: "/blog" },
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

        <div className="border-b border-border bg-gradient-to-br from-primary/5 to-background">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-7 md:py-9">
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-3">
              <ol className="flex gap-1">
                <li><Link to="/" className="hover:text-primary">Início</Link></li>
                <li>/</li>
                <li className="text-foreground">Blog</li>
              </ol>
            </nav>
            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight mb-2">Blog Ásia Peças</h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
              Conhecimento técnico sobre peças, manutenção e operação de máquinas pesadas XCMG.
            </p>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 w-full flex-1">
          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Button
              variant={!category ? "default" : "outline"}
              size="sm"
              onClick={() => { setCategory(undefined); setPage(0); }}
            >
              Todos
            </Button>
            {cats.map((c) => (
              <Button
                key={c.slug}
                variant={category === c.slug ? "default" : "outline"}
                size="sm"
                onClick={() => { setCategory(c.slug); setPage(0); }}
              >
                {c.name}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <p className="text-muted-foreground">Carregando posts...</p>
          ) : !data?.posts.length ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Nenhum post publicado ainda.</p>
            </Card>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.posts.map((p) => (
                  <Link key={p.id} to={`/blog/${p.slug}`} className="group">
                    <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
                      {p.cover_url && (
                        <div className="aspect-video bg-muted overflow-hidden">
                          <img
                            src={p.cover_url}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <CardContent className="p-5 space-y-3">
                        {p.category_slug && (
                          <Badge variant="outline" className="text-[10px]">
                            {cats.find((c) => c.slug === p.category_slug)?.name || p.category_slug}
                          </Badge>
                        )}
                        <h2 className="font-bold text-lg leading-snug group-hover:text-primary line-clamp-2">
                          {p.title}
                        </h2>
                        {p.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {p.published_at ? new Date(p.published_at).toLocaleDateString("pt-BR") : ""}
                          </span>
                          {p.tags?.length > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Tag className="h-3 w-3" /> {p.tags[0]}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-1 text-sm">Página {page + 1} de {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </main>

        <QuoteFooter lang="pt" />
      </div>

      <QuoteCart items={items} onUpdateQty={updateQty} onRemove={removeItem} onClear={clearCart} lang="pt" showTrigger={false} />
    </>
  );
}
