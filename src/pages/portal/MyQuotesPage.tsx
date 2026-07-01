import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMyQuotes } from "@/hooks/use-my-quotes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEO } from "@/lib/seo";
import asiaLogo from "@/assets/asia-logo.png";
import { ArrowLeft, FileText, Clock, CheckCircle2, XCircle } from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; cls: string; icon: any }> = {
  pendente:           { label: "Pendente",          cls: "bg-warning/15 text-warning border-warning/30", icon: Clock },
  em_analise:         { label: "Em análise",        cls: "bg-info/15 text-info border-info/30", icon: Clock },
  proposta_enviada:   { label: "Proposta enviada",  cls: "bg-primary/15 text-primary border-primary/30", icon: FileText },
  aprovado:           { label: "Aprovado",          cls: "bg-success/15 text-success border-success/30", icon: CheckCircle2 },
  concluido:          { label: "Concluído",         cls: "bg-success/15 text-success border-success/30", icon: CheckCircle2 },
  recusado:           { label: "Encerrado",         cls: "bg-muted text-muted-foreground border-border", icon: XCircle },
  convertido:         { label: "Convertido",        cls: "bg-primary/15 text-primary border-primary/30", icon: FileText },
};

export default function MyQuotesPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: quotes, isLoading } = useMyQuotes();

  if (!authLoading && !user) return <Navigate to="/portal/login" replace />;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Minhas cotações | Portal do Cliente — Ásia Peças" description="Acompanhe o status das suas cotações e propostas." canonical="/minhas-cotacoes" />
      <header className="bg-secondary text-secondary-foreground border-b border-secondary-foreground/10">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <Link to="/cotacao" className="flex items-center gap-3">
            <img src={asiaLogo} alt="Ásia Peças" className="h-10 w-auto" />
            <span className="font-bold text-sm font-display">Ásia Peças & Máquinas</span>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <span className="hidden md:inline text-secondary-foreground/70">{user?.email}</span>
            <Button size="sm" variant="ghost" className="text-secondary-foreground hover:bg-secondary-foreground/10" onClick={() => signOut()}>Sair</Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/cotacao" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm">
            <ArrowLeft className="h-4 w-4" /> Catálogo
          </Link>
        </div>
        <h1 className="text-2xl font-bold font-display mb-1">Minhas cotações</h1>
        <p className="text-sm text-muted-foreground mb-8">Acompanhe o andamento de cada solicitação e as propostas enviadas pela nossa equipe comercial.</p>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : !quotes || quotes.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center space-y-3">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-foreground">Você ainda não enviou cotações.</p>
              <Link to="/cotacao"><Button size="sm">Ver catálogo</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {quotes.map(q => {
              const meta = STATUS_LABEL[q.status] || STATUS_LABEL.pendente;
              const Icon = meta.icon;
              const items = Array.isArray(q.items) ? q.items : [];
              return (
                <Card key={q.id}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Protocolo</p>
                        <p className="font-mono text-sm">{q.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                      <Badge variant="outline" className={`${meta.cls} inline-flex items-center gap-1`}>
                        <Icon className="h-3 w-3" /> {meta.label}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Enviado em {new Date(q.created_at).toLocaleString("pt-BR")}
                    </div>
                    <div className="border-t pt-3 space-y-1">
                      <p className="text-xs font-semibold text-foreground">{items.length} item(ns)</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {items.slice(0, 5).map((it: any, i: number) => (
                          <li key={i}>• <span className="font-mono">{it.material}</span> — {it.quantity || 1} un</li>
                        ))}
                        {items.length > 5 && <li>+ {items.length - 5} outros</li>}
                      </ul>
                    </div>
                    {q.status_history && q.status_history.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-xs font-semibold text-foreground mb-1">Histórico</p>
                        <ul className="text-[11px] text-muted-foreground space-y-0.5">
                          {q.status_history.slice(-4).map((h: any, i: number) => (
                            <li key={i}>{new Date(h.at).toLocaleString("pt-BR")} — {h.status}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
