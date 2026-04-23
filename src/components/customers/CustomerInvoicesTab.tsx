import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useCustomerInvoices } from "@/hooks/use-customers";

export function CustomerInvoicesTab({ customerId }: { customerId: string }) {
  const { data = [], isLoading } = useCustomerInvoices(customerId);

  if (isLoading) return <p className="text-sm text-muted-foreground p-6">Carregando…</p>;
  if (data.length === 0) return <p className="text-sm text-muted-foreground p-6">Nenhuma nota fiscal SAP para este cliente.</p>;

  const total = data.reduce((s, i) => s + i.total_value, 0);
  const avg = total / data.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-xs uppercase text-muted-foreground">Total NFs</p>
          <p className="text-xl font-bold">{data.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs uppercase text-muted-foreground">Total faturado</p>
          <p className="text-xl font-bold">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs uppercase text-muted-foreground">Ticket médio</p>
          <p className="text-xl font-bold">R$ {avg.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </CardContent></Card>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Documento</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Pagador</TableHead>
            <TableHead>Cond. Pagto</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((i) => (
            <TableRow key={i.id}>
              <TableCell className="font-mono text-xs">{i.document_number || "—"}</TableCell>
              <TableCell>{i.invoice_date ? new Date(i.invoice_date).toLocaleDateString("pt-BR") : "—"}</TableCell>
              <TableCell className="text-sm">{i.payer_name || "—"}</TableCell>
              <TableCell className="text-sm">{i.payment_terms || "—"}</TableCell>
              <TableCell className="text-right font-medium">R$ {i.total_value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
