import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Cotacao, CotacaoItem, useUpdateCotacao } from "@/hooks/use-cotacoes";

export function GerarEmailFabricaDialog({
  open, onOpenChange, cotacao, itens,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  cotacao: Cotacao; itens: CotacaoItem[];
}) {
  const update = useUpdateCotacao();
  const [copied, setCopied] = useState(false);

  const alvo = itens.filter((i) => i.fonte === "fabrica");

  const linhas = alvo.map((i, idx) =>
    `${idx + 1}. PN ${i.pn} — ${i.descricao || "sem descrição"} — Qtd: ${i.quantidade}`
  ).join("\n");

  const texto =
`Prezados,

Segue solicitação de cotação (${cotacao.numero}):

${linhas}

Solicitamos:
- Valor unitário
- Disponibilidade em estoque
- Prazo de entrega
- Percentual de desconto aplicável

Cliente final: ${cotacao.cliente_nome}

Aguardamos retorno em até 24h.

Atenciosamente,
${cotacao.responsavel || "Equipe Ásia Peças"}
Ásia Peças & Máquinas
vendas@asiapecas.com`;

  const copy = async () => {
    await navigator.clipboard.writeText(texto);
    setCopied(true);
    toast.success("E-mail copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmarEnvio = () => {
    update.mutate(
      { id: cotacao.id, patch: { status: "aguardando_fabrica", data_envio_fabrica: new Date().toISOString() } as any },
      { onSuccess: () => { toast.success("Marcado como enviado à fábrica"); onOpenChange(false); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>E-mail para fábrica XCMG</DialogTitle></DialogHeader>
        {alvo.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhum item marcado como "Cotar Fábrica". Ajuste a fonte dos itens antes.
          </p>
        ) : (
          <>
            <Textarea value={texto} readOnly rows={16} className="font-mono text-xs" />
            <DialogFooter>
              <Button variant="outline" onClick={copy}>
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                Copiar texto
              </Button>
              <Button onClick={confirmarEnvio}>Confirmar envio e mover para "Aguardando Fábrica"</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
