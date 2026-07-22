import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Mail, Reply, Trash2, Plus, Save } from "lucide-react";
import {
  useCotacao, useCotacaoItens, useUpdateCotacao, useUpdateCotacaoItem,
  useDeleteCotacao, CotacaoStatus, STATUS_LABEL, STATUS_ORDER,
  ItemFonte, ItemDisp,
} from "@/hooks/use-cotacoes";
import { supabase } from "@/integrations/supabase/client";
import { GerarEmailFabricaDialog } from "@/components/cotacoes/GerarEmailFabricaDialog";
import { RegistrarRespostaFabricaDialog } from "@/components/cotacoes/RegistrarRespostaFabricaDialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function CotacaoDetailPage() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: cotacao, isLoading } = useCotacao(id);
  const { data: itens = [] } = useCotacaoItens(id);
  const updateCot = useUpdateCotacao();
  const updateItem = useUpdateCotacaoItem();
  const del = useDeleteCotacao();

  const [emailOpen, setEmailOpen] = useState(false);
  const [respostaOpen, setRespostaOpen] = useState(false);
  const [obsLocal, setObsLocal] = useState<string | null>(null);

  if (isLoading || !cotacao) {
    return <AppLayout><div className="p-6">Carregando...</div></AppLayout>;
  }

  const addItem = async () => {
    const { error } = await (supabase as any)
      .from("cotacao_itens")
      .insert({ cotacao_id: id, pn: "NOVO", quantidade: 1, fonte: "sem_fonte" });
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["cotacao-itens", id] });
  };

  const removeItem = async (itemId: string) => {
    const { error } = await (supabase as any).from("cotacao_itens").delete().eq("id", itemId);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["cotacao-itens", id] });
  };

  const valorTotal = itens.reduce((s, i) => s + Number(i.preco_venda || 0) * Number(i.quantidade || 0), 0);

  const saveObs = () => {
    if (obsLocal === null) return;
    updateCot.mutate({ id, patch: { observacoes: obsLocal } }, {
      onSuccess: () => { setObsLocal(null); toast.success("Observações salvas"); }
    });
  };

  const saveValor = () => {
    updateCot.mutate({ id, patch: { valor_total: valorTotal } as any });
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => nav("/cotacoes")}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <h1 className="text-xl font-display font-bold">{cotacao.numero}</h1>
              <p className="text-sm text-muted-foreground">{cotacao.cliente_nome}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={cotacao.status} onValueChange={(v) => updateCot.mutate({ id, patch: { status: v as CotacaoStatus } })}>
              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_ORDER.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setEmailOpen(true)}>
              <Mail className="h-4 w-4 mr-1" /> Gerar e-mail fábrica
            </Button>
            <Button variant="outline" onClick={() => setRespostaOpen(true)}>
              <Reply className="h-4 w-4 mr-1" /> Registrar resposta
            </Button>
            <Button variant="ghost" className="text-destructive"
              onClick={() => { if (confirm("Excluir esta cotação?")) del.mutate(id, { onSuccess: () => nav("/cotacoes") }); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase">Cliente</p>
            <p className="font-medium">{cotacao.cliente_nome}</p>
            <p className="text-sm text-muted-foreground">{cotacao.cliente_whatsapp || "—"}</p>
            <p className="text-sm text-muted-foreground">{cotacao.cliente_email || "—"}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase">Responsável</p>
            <Select value={cotacao.responsavel || ""} onValueChange={(v) => updateCot.mutate({ id, patch: { responsavel: v } })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Eduardo">Eduardo</SelectItem>
                <SelectItem value="Pedro">Pedro</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">Origem: {cotacao.origem}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase">Valor total</p>
            <p className="text-2xl font-bold">{valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
            <Button size="sm" variant="link" onClick={saveValor} className="p-0 h-auto">Salvar no total da cotação</Button>
          </CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Itens ({itens.length})</h3>
              <Button size="sm" variant="outline" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
            </div>
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-1">
              <span className="col-span-2">PN</span>
              <span className="col-span-3">Descrição</span>
              <span className="col-span-1">Qtd</span>
              <span className="col-span-2">Fonte</span>
              <span className="col-span-1">Disp.</span>
              <span className="col-span-1">Custo</span>
              <span className="col-span-1">Venda</span>
              <span className="col-span-1"></span>
            </div>
            {itens.map((i) => (
              <div key={i.id} className="grid grid-cols-12 gap-2 items-center border-t pt-2">
                <Input className="col-span-2 font-mono text-xs" defaultValue={i.pn}
                  onBlur={(e) => e.target.value !== i.pn && updateItem.mutate({ id: i.id, patch: { pn: e.target.value } })} />
                <Input className="col-span-3 text-xs" defaultValue={i.descricao || ""}
                  onBlur={(e) => updateItem.mutate({ id: i.id, patch: { descricao: e.target.value } })} />
                <Input className="col-span-1" type="number" defaultValue={i.quantidade}
                  onBlur={(e) => updateItem.mutate({ id: i.id, patch: { quantidade: parseFloat(e.target.value) || 1 } })} />
                <Select value={i.fonte} onValueChange={(v) => updateItem.mutate({ id: i.id, patch: { fonte: v as ItemFonte } })}>
                  <SelectTrigger className="col-span-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="estoque">Estoque</SelectItem>
                    <SelectItem value="fabrica">Fábrica</SelectItem>
                    <SelectItem value="parceiro">Parceiro</SelectItem>
                    <SelectItem value="sem_fonte">Sem fonte</SelectItem>
                  </SelectContent>
                </Select>
                <div className="col-span-1"><Badge variant="outline" className="text-[10px]">{i.disponibilidade_fabrica}</Badge></div>
                <Input className="col-span-1" type="number" step="0.01" defaultValue={i.preco_custo ?? ""}
                  onBlur={(e) => updateItem.mutate({ id: i.id, patch: { preco_custo: parseFloat(e.target.value) || null } })} />
                <Input className="col-span-1" type="number" step="0.01" defaultValue={i.preco_venda ?? ""}
                  onBlur={(e) => updateItem.mutate({ id: i.id, patch: { preco_venda: parseFloat(e.target.value) || null } })} />
                <Button variant="ghost" size="icon" className="col-span-1" onClick={() => removeItem(i.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Observações</h3>
              {obsLocal !== null && (
                <Button size="sm" onClick={saveObs}><Save className="h-3 w-3 mr-1" /> Salvar</Button>
              )}
            </div>
            <Textarea
              value={obsLocal ?? cotacao.observacoes ?? ""}
              onChange={(e) => setObsLocal(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        <GerarEmailFabricaDialog open={emailOpen} onOpenChange={setEmailOpen} cotacao={cotacao} itens={itens} />
        <RegistrarRespostaFabricaDialog open={respostaOpen} onOpenChange={setRespostaOpen} cotacaoId={id} itens={itens} />
      </div>
    </AppLayout>
  );
}
