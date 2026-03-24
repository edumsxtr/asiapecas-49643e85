import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Brain, Wrench, Cpu, Link2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type Lang, tr } from "./translations";

interface QuotePartDetailProps {
  part: any | null;
  open: boolean;
  onClose: () => void;
  inCart: boolean;
  onAdd: () => void;
  lang: Lang;
}

export default function QuotePartDetail({ part, open, onClose, inCart, onAdd, lang }: QuotePartDetailProps) {
  const { data: aiData } = useQuery({
    queryKey: ["ai-research-quote", part?.id],
    enabled: !!part?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_compatibility_results")
        .select("*")
        .eq("part_id", part.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: similar } = useQuery({
    queryKey: ["similar-parts-quote", part?.description],
    enabled: !!part?.description,
    queryFn: async () => {
      const words = part.description.split(" ").filter((w: string) => w.length > 3).slice(0, 2);
      if (words.length === 0) return [];
      const { data } = await supabase
        .from("parts")
        .select("id, material, description, stock")
        .neq("id", part.id)
        .ilike("description", `%${words[0]}%`)
        .gt("stock", 0)
        .limit(4);
      return data || [];
    },
  });

  if (!part) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground font-mono">{part.material}</Badge>
            {aiData && <Badge variant="outline" className="gap-1 border-primary/40 text-primary"><Brain className="h-3 w-3" /> {tr("detail.aiResearch", lang)}</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">{part.description}</h3>
            <p className="text-sm text-muted-foreground mt-1">{tr("detail.model", lang)}: {part.machine_model || "—"} • {tr("detail.manufacturer", lang)}: {part.manufacturer || "—"}</p>
            <Badge variant={part.stock > 0 ? "secondary" : "destructive"} className="mt-2">
              {part.stock > 0 ? `${part.stock} ${tr("detail.available", lang)}` : tr("part.unavailable", lang)}
            </Badge>
          </div>

          {aiData && (
            <div className="space-y-3 border-t pt-4">
              {aiData.technical_description && (
                <div className="flex gap-2">
                  <Cpu className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">{tr("detail.techDesc", lang)}</p>
                    <p className="text-sm text-foreground">{aiData.technical_description}</p>
                  </div>
                </div>
              )}
              {aiData.probable_function && (
                <div className="flex gap-2">
                  <Wrench className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">{tr("detail.function", lang)}</p>
                    <p className="text-sm text-foreground">{aiData.probable_function}</p>
                  </div>
                </div>
              )}
              {aiData.compatible_machines && aiData.compatible_machines.length > 0 && (
                <div className="flex gap-2">
                  <Link2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">{tr("detail.compatible", lang)}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {aiData.compatible_machines.map((m: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{m}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {aiData.technical_specs && aiData.technical_specs.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{tr("detail.specs", lang)}</p>
                  <ul className="text-sm text-foreground list-disc list-inside space-y-0.5">
                    {aiData.technical_specs.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {similar && similar.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{tr("detail.similar", lang)}</p>
              <div className="grid grid-cols-2 gap-2">
                {similar.map((s: any) => (
                  <div key={s.id} className="bg-muted/50 rounded-lg p-2">
                    <p className="text-xs font-mono text-muted-foreground">{s.material}</p>
                    <p className="text-xs text-foreground line-clamp-1">{s.description}</p>
                    <p className="text-xs text-primary font-medium">{s.stock} {tr("part.units", lang)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button className="w-full gap-2" onClick={onAdd} disabled={inCart || part.stock <= 0}>
            <ShoppingCart className="h-4 w-4" />
            {inCart ? tr("detail.alreadyAdded", lang) : tr("detail.addToQuote", lang)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
