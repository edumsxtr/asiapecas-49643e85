import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Eye, Package, Zap, AlertTriangle, ShieldCheck, Cog, Filter, Disc, Wrench, Fuel, Cable, CircuitBoard, Fan, Gauge, Hammer, Info, Sparkles, Loader2, ExternalLink, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { type Lang, tr } from "./translations";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ICON_KEYWORDS: [string[], LucideIcon, string][] = [
  [["filtro", "filter"], Filter, "text-blue-500"],
  [["engrenagem", "gear", "eixo", "rolamento", "bearing"], Cog, "text-zinc-500"],
  [["disco", "brake", "freio", "disk"], Disc, "text-orange-500"],
  [["parafuso", "bolt", "porca", "nut", "arruela", "washer"], Wrench, "text-slate-500"],
  [["combustivel", "fuel", "tanque", "tank", "bomba", "pump"], Fuel, "text-amber-600"],
  [["cabo", "cable", "fio", "wire", "chicote", "harness"], Cable, "text-purple-500"],
  [["sensor", "modulo", "module", "eletron", "electr", "ecu", "placa"], CircuitBoard, "text-emerald-500"],
  [["ventilador", "fan", "radiador", "radiator", "cooler"], Fan, "text-cyan-500"],
  [["manometro", "gauge", "pressao", "pressure", "valvula", "valve"], Gauge, "text-red-500"],
  [["martelo", "hammer", "pino", "pin", "bucha", "bushing"], Hammer, "text-stone-500"],
];

function getPartIcon(description: string): [LucideIcon, string] {
  const lower = description.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [keywords, icon, color] of ICON_KEYWORDS) {
    if (keywords.some(k => lower.includes(k))) return [icon, color];
  }
  return [Package, "text-muted-foreground/30"];
}

const AI_LABELS: Record<string, Record<string, string>> = {
  researchAi: { pt: "Pesquisar com IA", en: "Research with AI", es: "Investigar con IA" },
  researching: { pt: "Pesquisando...", en: "Researching...", es: "Investigando..." },
  moreInfo: { pt: "Ver informações técnicas da IA", en: "View AI technical info", es: "Ver info técnica de IA" },
  researchTip: { pt: "Clique para obter descrição técnica, compatibilidade e peças relacionadas via IA", en: "Click to get technical description, compatibility and related parts via AI", es: "Haga clic para obtener descripción técnica, compatibilidad y repuestos relacionados vía IA" },
};

interface QuotePartCardProps {
  part: {
    id: string;
    material: string;
    description: string;
    machine_model: string | null;
    stock: number;
    manufacturer: string | null;
  };
  inCart: boolean;
  hasAiData: boolean;
  aiPreview?: string | null;
  onAdd: () => void;
  onViewDetail: () => void;
  lang: Lang;
}

export default function QuotePartCard({ part, inCart, hasAiData, aiPreview, onAdd, onViewDetail, lang }: QuotePartCardProps) {
  const isReadyToShip = part.stock > 10;
  const isLastUnits = part.stock >= 1 && part.stock <= 5;
  const [PartIcon, iconColor] = useMemo(() => getPartIcon(part.description), [part.description]);
  const [researching, setResearching] = useState(false);
  const [justResearched, setJustResearched] = useState(false);

  const handleResearch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (researching) return;
    setResearching(true);
    try {
      const { error } = await supabase.functions.invoke("part-research", {
        body: { material: part.material },
      });
      if (error) throw error;
      setJustResearched(true);
      toast.success(lang === "en" ? "AI research complete!" : lang === "es" ? "¡Investigación IA completa!" : "Pesquisa IA concluída!");
    } catch {
      toast.error(lang === "en" ? "Research failed. Try again." : lang === "es" ? "Error en investigación." : "Erro na pesquisa. Tente novamente.");
    } finally {
      setResearching(false);
    }
  };

  const showAi = hasAiData || justResearched;

  return (
    <Card className={`group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border ${inCart ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/40"}`}>
      <CardContent className="p-0">
        {/* Top badges row */}
        <div className="flex items-center justify-between px-4 pt-4">
          <Badge className="bg-primary text-primary-foreground font-mono text-xs">{part.material}</Badge>
          <div className="flex items-center gap-1">
            {showAi ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={onViewDetail} className="cursor-pointer">
                      <Badge variant="outline" className="text-xs gap-1 border-green-500/40 text-green-600 bg-green-50 animate-pulse">
                        <ShieldCheck className="h-3 w-3" /> {tr("part.aiVerified", lang)}
                      </Badge>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs font-medium mb-1">{AI_LABELS.moreInfo[lang]}</p>
                    {aiPreview && <p className="text-xs text-muted-foreground line-clamp-3">{aiPreview}</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleResearch}
                      disabled={researching}
                      className="cursor-pointer"
                    >
                      <Badge variant="outline" className="text-xs gap-1 border-amber-400/60 text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors">
                        {researching ? (
                          <><Loader2 className="h-3 w-3 animate-spin" /> {AI_LABELS.researching[lang]}</>
                        ) : (
                          <><Sparkles className="h-3 w-3" /> {AI_LABELS.researchAi[lang]}</>
                        )}
                      </Badge>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">{AI_LABELS.researchTip[lang]}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Scarcity / availability badges */}
        <div className="px-4 pt-2 flex gap-1.5">
          {isReadyToShip && (
            <Badge className="text-[10px] gap-1 bg-green-500 text-white border-0 animate-pulse">
              <Zap className="h-2.5 w-2.5" /> {tr("part.readyToShip", lang)}
            </Badge>
          )}
          {isLastUnits && (
            <Badge className="text-[10px] gap-1 bg-red-500 text-white border-0">
              <AlertTriangle className="h-2.5 w-2.5" /> {tr("part.lastUnits", lang)}
            </Badge>
          )}
          {!isReadyToShip && !isLastUnits && part.stock > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {part.stock} {tr("part.units", lang)}
            </Badge>
          )}
          {part.stock <= 0 && (
            <Badge variant="destructive" className="text-[10px]">
              {tr("part.unavailable", lang)}
            </Badge>
          )}
        </div>

        {/* Icon area */}
        <div className="flex items-center justify-center py-5 bg-muted/30 mx-4 rounded-lg group-hover:bg-primary/5 transition-colors">
          <PartIcon className={`h-12 w-12 ${iconColor} opacity-60 group-hover:opacity-100 transition-opacity`} />
        </div>

        {/* Description */}
        <div className="px-4 pb-2 space-y-1">
          <p className="text-sm font-medium text-foreground line-clamp-2 min-h-[2.5rem]">{part.description}</p>
          <p className="text-xs text-muted-foreground">{part.machine_model || tr("part.noModel", lang)}</p>
          {part.manufacturer && <p className="text-xs text-muted-foreground">{tr("detail.manufacturer", lang)}: {part.manufacturer}</p>}
          {isReadyToShip && <p className="text-[10px] text-green-600 font-medium">{part.stock} {tr("part.units", lang)}</p>}
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 pt-2 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={onViewDetail}>
            {showAi ? <Info className="h-3.5 w-3.5 text-primary" /> : <Eye className="h-3.5 w-3.5" />}
            {tr("part.details", lang)}
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            onClick={onAdd}
            disabled={inCart || part.stock <= 0}
            variant={inCart ? "secondary" : "default"}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {inCart ? tr("part.added", lang) : tr("part.quote", lang)}
          </Button>
        </div>
        <div className="px-4 pb-3">
          <Link to={`/cotacao/p/${encodeURIComponent(part.material)}`} className="text-[10px] text-muted-foreground hover:text-primary inline-flex items-center gap-1">
            <ExternalLink className="h-2.5 w-2.5" /> Página da peça
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
