import { Link } from "react-router-dom";
import { usePublishedPosts } from "@/hooks/use-blog-posts";
import { BookOpen, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export function BlogHighlightStrip() {
  const { data } = usePublishedPosts({ pageSize: 3 });
  if (!data?.posts?.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-10">
      <div className="flex items-end justify-between mb-5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="font-display text-2xl font-bold">Blog & Dicas Técnicas</h2>
        </div>
        <Link to="/blog" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          Ver todos <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {data.posts.map((p) => (
          <Link key={p.id} to={`/blog/${p.slug}`} className="group">
            <Card className="h-full overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
              {p.cover_url && (
                <div className="aspect-video bg-muted overflow-hidden">
                  <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary">{p.title}</h3>
                {p.excerpt && <p className="text-xs text-muted-foreground line-clamp-2">{p.excerpt}</p>}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
