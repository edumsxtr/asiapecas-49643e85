import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { type Part, formatBRL, getActiveCategories } from "@/data/sample-parts";
import { Package, Clock, Layers, Truck } from "lucide-react";

interface PartDetailDialogProps {
  part: Part | null;
  onClose: () => void;
}

export function PartDetailDialog({ part, onClose }: PartDetailDialogProps) {
  if (!part) return null;

  const categories = getActiveCategories(part);
  const totalValue = part.stock * part.estimatedPrice;

  return (
    <Dialog open={!!part} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Detalhes da Peça
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground font-mono">{part.material}</p>
            <p className="font-semibold text-foreground mt-1">{part.description}</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <Badge key={cat} variant="outline">{cat}</Badge>
            ))}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow icon={<Layers className="h-4 w-4" />} label="Modelo" value={part.machineModel} />
            <InfoRow icon={<Truck className="h-4 w-4" />} label="Fornecedor" value={part.supplier} />
            <InfoRow icon={<Clock className="h-4 w-4" />} label="Última Entrada" value={part.lastEntryTime} />
            <InfoRow icon={<Package className="h-4 w-4" />} label="Estoque" value={part.stock.toLocaleString("pt-BR") + " un."} />
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">Preço Unitário (c/ impostos)</p>
              <p className="font-display font-bold text-lg text-foreground">{formatBRL(part.estimatedPrice)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Valor Total em Estoque</p>
              <p className="font-display font-bold text-lg text-primary">{formatBRL(totalValue)}</p>
            </div>
          </div>

          {part.compatibleModels && part.compatibleModels.length > 1 && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
                  Compatível com outros modelos
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {part.compatibleModels.map((model) => (
                    <Badge key={model} variant="secondary" className="text-xs">
                      {model}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
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
