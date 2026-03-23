import { useState } from "react";
import { useMarketResearch, useAddMarketResearch } from "@/hooks/use-market-research";
import { formatBRL } from "@/hooks/use-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, TrendingDown, TrendingUp, Minus, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  partId: string;
  ourPrice: number;
}

export function MarketResearchTab({ partId, ourPrice }: Props) {
  const { data: entries = [], isLoading } = useMarketResearch(partId);
  const addMutation = useAddMarketResearch();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    distributor_name: "",
    price_found: "",
    delivery_days: "",
    payment_terms: "",
    availability: "em estoque",
    source_url: "",
    notes: "",
  });

  const avgMarket = entries.length > 0
    ? entries.reduce((s, e) => s + Number(e.price_found), 0) / entries.length
    : 0;
  const minMarket = entries.length > 0 ? Math.min(...entries.map(e => Number(e.price_found))) : 0;
  const maxMarket = entries.length > 0 ? Math.max(...entries.map(e => Number(e.price_found))) : 0;

  const competitiveness = avgMarket > 0
    ? ((ourPrice - avgMarket) / avgMarket) * 100
    : 0;

  const handleSubmit = async () => {
    if (!form.distributor_name || !form.price_found) {
      toast.error("Preencha o distribuidor e o preço");
      return;
    }
    await addMutation.mutateAsync({
      part_id: partId,
      distributor_name: form.distributor_name,
      price_found: parseFloat(form.price_found),
      delivery_days: form.delivery_days ? parseInt(form.delivery_days) : null,
      payment_terms: form.payment_terms || null,
      availability: form.availability,
      source_url: form.source_url || null,
      notes: form.notes || null,
      researched_at: new Date().toISOString(),
      researched_by: null,
    });
    toast.success("Pesquisa registrada!");
    setForm({ distributor_name: "", price_found: "", delivery_days: "", payment_terms: "", availability: "em estoque", source_url: "", notes: "" });
    setShowForm(false);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {/* Competitiveness Summary */}
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Menor Preço</p>
            <p className="font-bold text-sm">{formatBRL(minMarket)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Média Mercado</p>
            <p className="font-bold text-sm">{formatBRL(avgMarket)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Maior Preço</p>
            <p className="font-bold text-sm">{formatBRL(maxMarket)}</p>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <div className={`flex items-center gap-2 rounded-lg p-3 text-sm font-medium ${
          competitiveness < -5 ? "bg-green-500/10 text-green-600" :
          competitiveness > 5 ? "bg-red-500/10 text-red-600" :
          "bg-yellow-500/10 text-yellow-600"
        }`}>
          {competitiveness < -5 ? <TrendingDown className="h-4 w-4" /> :
           competitiveness > 5 ? <TrendingUp className="h-4 w-4" /> :
           <Minus className="h-4 w-4" />}
          <span>
            Nosso preço ({formatBRL(ourPrice)}) está{" "}
            {competitiveness < -5 ? `${Math.abs(competitiveness).toFixed(1)}% abaixo` :
             competitiveness > 5 ? `${competitiveness.toFixed(1)}% acima` :
             "na faixa"} da média do mercado
          </span>
        </div>
      )}

      {/* Table */}
      {entries.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Distribuidor</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Disp.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1">
                    {e.distributor_name}
                    {e.source_url && (
                      <a href={e.source_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    )}
                  </div>
                  {e.payment_terms && <p className="text-[10px] text-muted-foreground">{e.payment_terms}</p>}
                </TableCell>
                <TableCell>
                  <span className={Number(e.price_found) < ourPrice ? "text-green-600 font-semibold" : Number(e.price_found) > ourPrice ? "text-red-600" : ""}>
                    {formatBRL(Number(e.price_found))}
                  </span>
                </TableCell>
                <TableCell>{e.delivery_days ? `${e.delivery_days}d` : "—"}</TableCell>
                <TableCell>
                  <Badge variant={e.availability === "em estoque" ? "default" : "secondary"} className="text-[10px]">
                    {e.availability}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhuma pesquisa de mercado registrada para esta peça.
        </p>
      )}

      {/* Add Form */}
      {showForm ? (
        <div className="space-y-3 border rounded-lg p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Distribuidor *</Label>
              <Input placeholder="Nome do distribuidor" value={form.distributor_name} onChange={(e) => setForm(f => ({ ...f, distributor_name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Preço encontrado *</Label>
              <Input type="number" placeholder="0.00" value={form.price_found} onChange={(e) => setForm(f => ({ ...f, price_found: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Prazo (dias)</Label>
              <Input type="number" placeholder="Dias" value={form.delivery_days} onChange={(e) => setForm(f => ({ ...f, delivery_days: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Disponibilidade</Label>
              <Select value={form.availability} onValueChange={(v) => setForm(f => ({ ...f, availability: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="em estoque">Em estoque</SelectItem>
                  <SelectItem value="sob encomenda">Sob encomenda</SelectItem>
                  <SelectItem value="indisponível">Indisponível</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Condições de pagamento</Label>
            <Input placeholder="Ex: 30/60/90 dias" value={form.payment_terms} onChange={(e) => setForm(f => ({ ...f, payment_terms: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={addMutation.isPending}>
              {addMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Salvar"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="w-full">
          <Plus className="h-3 w-3 mr-1" /> Adicionar Pesquisa
        </Button>
      )}
    </div>
  );
}
