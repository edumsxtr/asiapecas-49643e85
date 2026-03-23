import { usePartAIResearch } from "@/hooks/use-part-ai-research";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, Loader2, Cpu, Wrench, Cog } from "lucide-react";
import { formatBRL } from "@/hooks/use-parts";

interface Props {
  material: string;
}

export function PartAIResearch({ material }: Props) {
  const { research, loading, analysis, clear } = usePartAIResearch();

  if (!analysis && !loading) {
    return (
      <div className="flex flex-col items-center py-6 gap-3">
        <Brain className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground text-center">
          Use IA para obter informações técnicas, compatibilidade e sugestões de peças relacionadas.
        </p>
        <Button onClick={() => research(material)} size="sm">
          <Brain className="h-4 w-4 mr-1" /> Pesquisar com IA
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-8 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Analisando peça com IA...</p>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="h-4 w-4 text-primary" />
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Descrição Técnica</p>
        </div>
        <p className="text-sm text-foreground">{analysis.technical_description}</p>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Cog className="h-4 w-4 text-primary" />
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Função</p>
        </div>
        <p className="text-sm text-foreground">{analysis.probable_function}</p>
      </div>

      <Separator />

      {analysis.compatible_machines?.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
            Máquinas Compatíveis (IA)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.compatible_machines.map((m) => (
              <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
            ))}
          </div>
        </div>
      )}

      {analysis.technical_specs?.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
            Especificações Técnicas
          </p>
          <ul className="text-sm space-y-1">
            {analysis.technical_specs.map((s, i) => (
              <li key={i} className="text-foreground">• {s}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.maintenance_tips && (
        <>
          <Separator />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="h-4 w-4 text-primary" />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Manutenção</p>
            </div>
            <p className="text-sm text-foreground">{analysis.maintenance_tips}</p>
          </div>
        </>
      )}

      {analysis.catalog_related && analysis.catalog_related.length > 0 && (
        <>
          <Separator />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Peças Relacionadas no Catálogo
            </p>
            <div className="space-y-2">
              {analysis.catalog_related.map((p) => (
                <div key={p.material} className="flex justify-between items-center text-sm bg-muted/50 rounded px-3 py-2">
                  <div>
                    <span className="font-mono text-xs text-muted-foreground">{p.material}</span>
                    <p className="text-foreground truncate max-w-[250px]">{p.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{p.stock} un.</p>
                    <p className="font-semibold text-xs">{formatBRL(p.estimated_price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Button variant="ghost" size="sm" onClick={clear} className="w-full text-xs">
        Limpar resultado
      </Button>
    </div>
  );
}
