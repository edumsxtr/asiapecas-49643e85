import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { type Part, formatBRL, getActiveCategories } from "@/hooks/use-parts";
import { Package, Clock, Layers, Truck, Search, Brain } from "lucide-react";
import { MarketResearchTab } from "./MarketResearchTab";
import { PartAIResearch } from "./PartAIResearch";

interface PartDetailDialogProps {
  part: Part | null;
  onClose: () => void;
}

export function PartDetailDialog({ part, onClose }: PartDetailDialogProps) {
  if (!part) return null;

  const categories = getActiveCategories(part);
  const totalValue = part.stock * part.estimated_price;

  return (
    <Dialog open={!!part} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Detalhes da Peça
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground font-mono">{part.material}</p>
            <p className="font-semibold text-foreground mt-1">{part.description}</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <Badge key={cat} variant="outline">{cat}</Badge>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow icon={<Layers className="h-4 w-4" />} label="Modelo" value={part.machine_model ?? "—"} />
            <InfoRow icon={<Truck className="h-4 w-4" />} label="Fornecedor" value={part.supplier ?? "—"} />
            <InfoRow icon={<Clock className="h-4 w-4" />} label="Última Entrada" value={part.last_entry_time ?? "—"} />
            <InfoRow icon={<Package className="h-4 w-4" />} label="Estoque" value={part.stock.toLocaleString("pt-BR") + " un."} />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">Preço Unitário</p>
              <p className="font-display font-bold text-lg text-foreground">{formatBRL(part.estimated_price)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Valor Total</p>
              <p className="font-display font-bold text-lg text-primary">{formatBRL(totalValue)}</p>
            </div>
          </div>

          {part.compatible_models && part.compatible_models.length > 1 && (
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
                Compatível com outros modelos
              </p>
              <div className="flex flex-wrap gap-1.5">
                {part.compatible_models.map((model) => (
                  <Badge key={model} variant="secondary" className="text-xs">{model}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        <Tabs defaultValue="market" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="market" className="flex-1 gap-1">
              <Search className="h-3 w-3" /> Pesquisa de Mercado
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex-1 gap-1">
              <Brain className="h-3 w-3" /> IA Compatibilidade
            </TabsTrigger>
          </TabsList>
          <TabsContent value="market">
            <MarketResearchTab partId={part.id} ourPrice={part.estimated_price} />
          </TabsContent>
          <TabsContent value="ai">
            <PartAIResearch material={part.material} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
