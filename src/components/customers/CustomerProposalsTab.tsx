import { useMemo, useState } from "react";
import { useCustomerProposals } from "@/hooks/use-customer-proposals";
import { useSales, type Sale } from "@/hooks/use-sales";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDown, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProposalGeneratorDialog from "@/components/sales/ProposalGeneratorDialog";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  rascunho: "outline",
  enviada: "secondary",
  aprovada: "default",
  recusada: "destructive",
  expirada: "outline",
};

const PAGE_SIZE = 10;

export function CustomerProposalsTab({ customerId }: { customerId: string }) {
  const navigate = useNavigate();
  const { data: list = [] } = useCustomerProposals(customerId);
  const { data: allSales = [] } = useSales();
  const [openSale, setOpenSale] = useState<Sale | null>(null);
  const [page, setPage] = useState(1);

  const findSale = (id: string) => allSales.find(s => s.id === id) || null;
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const slice = useMemo(
    () => list.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [list, currentPage]
  );

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-3 p-4 border-b">
        <div>
          <h3 className="font-semibold">Propostas / Orçamentos</h3>
          <p className="text-xs text-muted-foreground">{list.length} registro(s)</p>
        </div>
        <Button size="sm" className="gap-1" onClick={() => navigate(`/pedidos/novo?customer_id=${customerId}`)}>
          <Plus className="h-3.5 w-3.5" /> Nova Proposta
        </Button>
      </div>

      {list.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma proposta gerada ainda.</p>
      ) : (
        <ul className="divide-y">
          {slice.map(p => (
            <li key={p.id} className="p-4 flex items-center justify-between gap-3 hover:bg-muted/30">
              <div className="min-w-0">
                <p className="text-sm font-mono">{p.proposal_number || `#${p.id.slice(0, 8)}`}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                  <span>{new Date(p.sale_date).toLocaleDateString("pt-BR")}</span>
                  <span>·</span>
                  <span>Validade {p.validity_days || 15}d</span>
                  <Badge variant={STATUS_VARIANT[p.proposal_status] || "outline"} className="capitalize text-[10px]">
                    {p.proposal_status}
                  </Badge>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium font-mono tabular-nums whitespace-nowrap">
                  R$ {Number(p.total_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
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

      {list.length > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3 p-3 border-t text-xs">
          <span className="text-muted-foreground">{list.length} proposta(s)</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 px-2" disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-muted-foreground tabular-nums">Pág. {currentPage} de {totalPages}</span>
            <Button variant="outline" size="sm" className="h-7 px-2" disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <ProposalGeneratorDialog sale={openSale} open={!!openSale} onOpenChange={(o) => !o && setOpenSale(null)} />
    </div>
  );
}
