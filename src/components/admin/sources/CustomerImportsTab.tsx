import { useMemo, useState } from "react";
import { DataPagination } from "@/components/common/DataPagination";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Eye, Loader2 } from "lucide-react";
import { useCustomerImports, useDeleteCustomerImport, useUpdateCustomerImport } from "@/hooks/use-admin-sources";
import { toast } from "sonner";

export function CustomerImportsTab() {
  const { data: imports, isLoading } = useCustomerImports();
  const del = useDeleteCustomerImport();
  const upd = useUpdateCustomerImport();
  const [editing, setEditing] = useState<any | null>(null);
  const [viewing, setViewing] = useState<any | null>(null);
  const [confirmDel, setConfirmDel] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const total = imports?.length ?? 0;
  const paginated = useMemo(() => (imports ?? []).slice((page - 1) * pageSize, page * pageSize), [imports, page, pageSize]);

  return (
    <Card className="overflow-hidden">
      <div className="p-3 text-xs text-muted-foreground border-b bg-muted/30">
        ⚠ Excluir um registro <strong>não remove</strong> clientes do banco — não há vínculo cliente↔importação. Use a página de Clientes para limpar a base.
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Arquivo</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Linhas</TableHead>
            <TableHead className="text-right">Inseridos</TableHead>
            <TableHead className="text-right">Atualizados</TableHead>
            <TableHead className="text-right">Ignorados</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></TableCell></TableRow>}
          {imports?.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma importação de clientes.</TableCell></TableRow>}
          {paginated.map((r: any) => (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-xs max-w-[240px] truncate">{r.file_name}</TableCell>
              <TableCell className="text-xs">{new Date(r.imported_at).toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-right tabular-nums">{r.total_rows?.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-right tabular-nums">{r.inserted?.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-right tabular-nums">{r.updated?.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-right tabular-nums">{r.skipped?.toLocaleString("pt-BR")}</TableCell>
              <TableCell><Badge>{r.status}</Badge></TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditing({ ...r })}><Pencil className="h-4 w-4 mr-2" /> Editar nome</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setViewing(r)}><Eye className="h-4 w-4 mr-2" /> Ver relatório</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setConfirmDel(r)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Excluir registro</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DataPagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />


      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Renomear importação</DialogTitle></DialogHeader>
          {editing && <div><Label>Nome do arquivo</Label><Input value={editing.file_name} onChange={(e) => setEditing({ ...editing, file_name: e.target.value })} /></div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={async () => { await upd.mutateAsync({ id: editing.id, file_name: editing.file_name }); toast.success("Atualizado"); setEditing(null); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Relatório</DialogTitle><DialogDescription>{viewing?.file_name}</DialogDescription></DialogHeader>
          <pre className="text-xs bg-muted p-3 rounded max-h-[400px] overflow-auto">{JSON.stringify(viewing?.report || {}, null, 2)}</pre>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir registro?</AlertDialogTitle><AlertDialogDescription>Remove apenas o histórico de <strong>{confirmDel?.file_name}</strong>. Clientes permanecem na base.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { await del.mutateAsync(confirmDel.id); toast.success("Registro excluído"); setConfirmDel(null); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
