import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { differenceInHours, formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Cotacao,
  CotacaoStatus,
  STATUS_LABEL,
  STATUS_ORDER,
  useCotacoes,
  useUpdateCotacao,
} from "@/hooks/use-cotacoes";
import { cn } from "@/lib/utils";

function isFactoryOverdue(c: Cotacao) {
  if (c.status !== "aguardando_fabrica" || !c.data_envio_fabrica) return false;
  return differenceInHours(new Date(), new Date(c.data_envio_fabrica)) >= 24;
}

export function KanbanBoard() {
  const { data: cotacoes = [], isLoading } = useCotacoes();
  const update = useUpdateCotacao();
  const nav = useNavigate();
  const [dragId, setDragId] = useState<string | null>(null);

  const byStatus = useMemo(() => {
    const m: Record<CotacaoStatus, Cotacao[]> = {
      recebida: [], verificando_estoque: [], aguardando_fabrica: [],
      fabrica_respondeu: [], cotando_parceiro: [], proposta_enviada: [],
      fechada: [], perdida: [],
    };
    cotacoes.forEach((c) => m[c.status]?.push(c));
    return m;
  }, [cotacoes]);

  const onDrop = (status: CotacaoStatus) => {
    if (!dragId) return;
    const cur = cotacoes.find((c) => c.id === dragId);
    if (!cur || cur.status === status) return;
    const patch: any = { status };
    if (status === "aguardando_fabrica" && !cur.data_envio_fabrica) {
      patch.data_envio_fabrica = new Date().toISOString();
    }
    update.mutate({ id: dragId, patch });
    setDragId(null);
  };

  if (isLoading) return <p className="text-muted-foreground text-sm p-4">Carregando...</p>;

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {STATUS_ORDER.map((s) => (
        <div
          key={s}
          className="min-w-[280px] w-[280px] bg-muted/40 rounded-lg p-2 flex flex-col"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => onDrop(s)}
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {STATUS_LABEL[s]}
            </h3>
            <span className="text-xs text-muted-foreground">{byStatus[s].length}</span>
          </div>
          <div className="flex flex-col gap-2 min-h-[80px]">
            {byStatus[s].map((c) => {
              const overdue = isFactoryOverdue(c);
              const daysHere = formatDistanceToNowStrict(new Date(c.updated_at), { locale: ptBR });
              return (
                <Card
                  key={c.id}
                  draggable
                  onDragStart={() => setDragId(c.id)}
                  onClick={() => nav(`/cotacoes/${c.id}`)}
                  className={cn(
                    "p-3 cursor-pointer hover:border-primary transition-colors",
                    overdue && "border-destructive border-2"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{c.numero}</span>
                    {overdue && (
                      <Badge variant="destructive" className="gap-1 text-[10px]">
                        <AlertTriangle className="h-3 w-3" /> +24h
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium text-sm truncate">{c.cliente_nome}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{daysHere}</span>
                    {c.responsavel && <span>{c.responsavel}</span>}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
