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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, RefreshCw, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useStockImports } from "@/hooks/use-stock-imports";
import { useUpdateStockImport, useReprocessStockImport, useRevertStockImport } from "@/hooks/use-admin-sources";
import { toast } from "sonner";

export function StockImportsTab() {
  const { data: imports, isLoading } = useStockImports();
  const updateMut = useUpdateStockImport();
  const reprocessMut = useReprocessStockImport();
  const revertMut = useRevertStockImport();

  const [editing, setEditing] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ row: any; mode: "record" | "revert" } | null>(null);

  const handleSaveEdit = async () => {
    if (!editing) return;
    await updateMut.mutateAsync({
      id: editing.id, file_name: editing.file_name, source_label: editing.source_label, imported_at: editing.imported_at,
    });
    toast.success("Metadados atualizados");
    setEditing(null);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await revertMut.mutateAsync({
        import_id: confirmDelete.row.id, delete_parts: confirmDelete.mode === "revert",
      });
      toast.success(
        confirmDelete.mode === "revert"
          ? `Revertido: ${res.parts_deleted} peças excluídas, ${res.parts_zeroed} zeradas`
          : "Registro de importação excluído"
      );
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleReprocess = async (row: any) => {
    try {
      const res = await reprocessMut.mutateAsync(row.id);
      toast.success(`Reprocessado: ${res.unique_materials} materiais (${res.inserted} novos, ${res.updated} atualizados)`);
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    }
  };

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Arquivo</TableHead>
            <TableHead>Filial / Fonte</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Linhas</TableHead>
            <TableHead className="text-right">Unidades</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></TableCell></TableRow>
          )}
          {imports?.length === 0 && (
            <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma importação registrada.</TableCell></TableRow>
          )}
          {imports?.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono text-xs max-w-[240px] truncate">{row.file_name}</TableCell>
              <TableCell>{row.source_label}</TableCell>
              <TableCell className="text-xs">{new Date(row.imported_at).toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-right tabular-nums">{row.total_rows?.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-right tabular-nums">{row.total_stock?.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-right tabular-nums">R$ {(Number(row.total_value || 0) / 1_000_000).toFixed(2)}M</TableCell>
              <TableCell><Badge variant={row.status === "completo" ? "default" : "secondary"}>{row.status}</Badge></TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditing({ ...row })}>
                      <Pencil className="h-4 w-4 mr-2" /> Editar metadados
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleReprocess(row)} disabled={reprocessMut.isPending}>
                      <RefreshCw className="h-4 w-4 mr-2" /> Reprocessar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setConfirmDelete({ row, mode: "record" })}>
                      <Trash2 className="h-4 w-4 mr-2" /> Excluir só registro
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setConfirmDelete({ row, mode: "revert" })} className="text-destructive">
                      <AlertTriangle className="h-4 w-4 mr-2" /> Excluir + reverter peças
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit metadata */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar metadados</DialogTitle>
            <DialogDescription>Renomear arquivo, filial e data — não altera os dados importados.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Arquivo</Label><Input value={editing.file_name || ""} onChange={(e) => setEditing({ ...editing, file_name: e.target.value })} /></div>
              <div><Label>Filial / Fonte</Label><Input value={editing.source_label || ""} onChange={(e) => setEditing({ ...editing, source_label: e.target.value })} /></div>
              <div><Label>Data</Label><Input type="datetime-local" value={editing.imported_at?.slice(0, 16) || ""} onChange={(e) => setEditing({ ...editing, imported_at: new Date(e.target.value).toISOString() })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={updateMut.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete / revert confirm */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDelete?.mode === "revert" ? "Excluir importação e reverter peças?" : "Excluir registro da importação?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.mode === "revert" ? (
                <>Para cada material desta importação: se NÃO houver outra importação referenciando, a peça será <strong>excluída do catálogo</strong>. Se houver, o estoque será <strong>zerado</strong>. Não é possível desfazer.</>
              ) : (
                <>Apaga apenas o registro <strong>{confirmDelete?.row.file_name}</strong> e seus itens auxiliares. As peças no catálogo permanecem intactas.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {revertMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
