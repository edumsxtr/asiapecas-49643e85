import { useState } from "react";
import { useCustomerProposals } from "@/hooks/use-customer-proposals";
import { useSales, type Sale } from "@/hooks/use-sales";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDown, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProposalGeneratorDialog from "@/components/sales/ProposalGeneratorDialog";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  rascunho: "outline",
  enviada: "secondary",
  aprovada: "default",
  recusada: "destructive",
  expirada: "outline",
};

export function CustomerProposalsTab({ customerId }: { customerId: string }) {
  const navigate = useNavigate();
  const { data: list = [] } = useCustomerProposals(customerId);
  const { data: allSales = [] } = useSales();
  const [openSale, setOpenSale] = useState<Sale | null>(null);

  const findSale = (id: string) => allSales.find(s => s.id === id) || null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{list.length} proposta(s) / orçamento(s)</p>
        <Button size="sm" className="gap-1" onClick={() => navigate(`/pedidos/novo?customer_id=${customerId}`)}>
          <Plus className="h-3.5 w-3.5" />Nova Proposta
        </Button>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma proposta gerada ainda.</p>
      ) : (
        <ul className="divide-y">
          {list.map(p => (
            <li key={p.id} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-mono">{p.proposal_number || `#${p.id.slice(0, 8)}`}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(p.sale_date).toLocaleDateString("pt-BR")} ·
                  Validade {p.validity_days || 15}d ·{" "}
                  <Badge variant={STATUS_VARIANT[p.proposal_status] || "outline"} className="capitalize text-[10px]">{p.proposal_status}</Badge>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium whitespace-nowrap">R$ {Number(p.total_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => {
                  const sale = findSale(p.id);
                  if (sale) setOpenSale(sale);
                }}>
                  <FileDown className="h-3.5 w-3.5" />Abrir
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ProposalGeneratorDialog sale={openSale} open={!!openSale} onOpenChange={(o) => !o && setOpenSale(null)} />
    </div>
  );
}
