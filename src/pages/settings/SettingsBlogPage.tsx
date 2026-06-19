import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Sparkles, FileText, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAllPosts, useDeletePost, type BlogPost } from "@/hooks/use-blog-posts";
import { DataPagination } from "@/components/common/DataPagination";
import { BlogPostEditor } from "@/components/blog/BlogPostEditor";
import { AIBlogGeneratorDialog } from "@/components/blog/AIBlogGeneratorDialog";

export default function SettingsBlogPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [creating, setCreating] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useAllPosts({ page, pageSize });
  const del = useDeletePost();

  const filtered = (data?.posts || []).filter((p) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase())
  );

  if (editing || creating) {
    return (
      <AppLayout>
        <div className="p-6 max-w-5xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => { setEditing(null); setCreating(false); }} className="mb-4 gap-1">
            <ChevronLeft className="h-4 w-4" /> Voltar à lista
          </Button>
          <BlogPostEditor
            post={editing || undefined}
            onSaved={() => { setEditing(null); setCreating(false); }}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Blog</h1>
              <p className="text-sm text-muted-foreground">Posts publicados em /blog. Conteúdo melhora SEO do portal.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAiOpen(true)} className="gap-2">
              <Sparkles className="h-4 w-4" /> Gerar com IA
            </Button>
            <Button onClick={() => setCreating(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Novo post
            </Button>
          </div>
        </header>

        <div className="flex gap-3">
          <Input
            placeholder="Buscar por título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Card>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">Nenhum post ainda.</p>
              <Button onClick={() => setCreating(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Criar primeiro post
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between gap-3 hover:bg-muted/30">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium truncate">{p.title}</h3>
                      <Badge variant={p.status === "published" ? "default" : "secondary"} className="text-[10px]">
                        {p.status === "published" ? "Publicado" : p.status === "draft" ? "Rascunho" : "Arquivado"}
                      </Badge>
                      {p.ai_generated && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Sparkles className="h-2.5 w-2.5" /> IA
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      /blog/{p.slug} · {new Date(p.updated_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {p.status === "published" && (
                      <Link to={`/blog/${p.slug}`} target="_blank">
                        <Button size="sm" variant="ghost">Ver</Button>
                      </Link>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => setEditing(p)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => { if (confirm(`Excluir "${p.title}"?`)) del.mutate(p.id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {data && data.count > pageSize && (
          <DataPagination
            page={page}
            pageSize={pageSize}
            total={data.count}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
          />
        )}

        <AIBlogGeneratorDialog open={aiOpen} onOpenChange={setAiOpen} />
      </div>
    </AppLayout>
  );
}
