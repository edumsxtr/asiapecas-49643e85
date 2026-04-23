import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCustomerEquipment } from "@/hooks/use-customers";

export function CustomerEquipmentTab({ customerId }: { customerId: string }) {
  const { data = [], isLoading } = useCustomerEquipment(customerId);

  if (isLoading) return <p className="text-sm text-muted-foreground p-6">Carregando…</p>;
  if (data.length === 0) return <p className="text-sm text-muted-foreground p-6">Nenhum equipamento registrado para este cliente.</p>;

  const total = data.reduce((s, e) => s + (e.sale_value || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{data.length} equipamento(s)</p>
        <p className="text-sm font-semibold">Total histórico: R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Modelo</TableHead>
            <TableHead>Série</TableHead>
            <TableHead>Order Form</TableHead>
            <TableHead>Ano</TableHead>
            <TableHead>Local entrega</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="font-medium">{e.model || "—"}</TableCell>
              <TableCell className="font-mono text-xs">{e.serial_number || "—"}</TableCell>
              <TableCell className="font-mono text-xs">{e.order_form || "—"}</TableCell>
              <TableCell>{e.purchase_year || "—"}</TableCell>
              <TableCell className="text-sm">{e.delivery_location || "—"}</TableCell>
              <TableCell className="text-right">{e.sale_value ? `R$ ${e.sale_value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
