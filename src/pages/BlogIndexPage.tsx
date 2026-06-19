import { useState } from "react";
import { Link } from "react-router-dom";
import { usePublishedPosts, useBlogCategories } from "@/hooks/use-blog-posts";
import { SEO, organizationLd, breadcrumbLd } from "@/lib/seo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Tag } from "lucide-react";


const PAGE_SIZE = 9;

export default function BlogIndexPage() {
  const [category, setCategory] = useState<string | undefined>();
  const [page, setPage] = useState(0);
  const { data: cats = [] } = useBlogCategories();
  const { data, isLoading } = usePublishedPosts({ category, page, pageSize: PAGE_SIZE });

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
      <div className="min-h-screen bg-background">
        <div className="border-b bg-gradient-to-br from-primary/5 to-background">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <Link to="/cotacao" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-4">
              <ChevronLeft className="h-3 w-3" /> Voltar ao catálogo
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold font-['Space_Grotesk'] mb-3">Blog Ásia Peças</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Conhecimento técnico sobre peças, manutenção e operação de máquinas pesadas XCMG.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
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
        </div>
      </div>
    </>
  );
}
