import { useState } from "react";
import { useCustomerContacts, useUpsertCustomerContact, useDeleteCustomerContact, type CustomerContact } from "@/hooks/use-customer-contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, Star } from "lucide-react";

export function CustomerContactsTab({ customerId }: { customerId: string }) {
  const { data: contacts = [] } = useCustomerContacts(customerId);
  const upsert = useUpsertCustomerContact();
  const del = useDeleteCustomerContact();
  const [editing, setEditing] = useState<Partial<CustomerContact> | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{contacts.length} contato(s) cadastrado(s)</p>
        <Button size="sm" onClick={() => setEditing({ customer_id: customerId, name: "", is_primary: contacts.length === 0 })} className="gap-1">
          <Plus className="h-3.5 w-3.5" />Novo Contato
        </Button>
      </div>

      {contacts.length === 0 && !editing && (
        <p className="text-sm text-muted-foreground">Nenhum contato cadastrado.</p>
      )}

      <ul className="divide-y">
        {contacts.map(c => (
          <li key={c.id} className="py-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium flex items-center gap-2">
                {c.name}
                {c.is_primary && <Badge variant="default" className="gap-1 text-[10px]"><Star className="h-3 w-3" />Principal</Badge>}
                {c.role && <span className="text-xs text-muted-foreground">— {c.role}</span>}
              </p>
              <p className="text-xs text-muted-foreground">{c.phone} {c.email && `· ${c.email}`}</p>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => setEditing(c)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" onClick={() => del.mutate({ id: c.id, customer_id: customerId })}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <div className="p-3 border rounded-md space-y-3 bg-muted/30">
          <h4 className="font-medium text-sm">{editing.id ? "Editar" : "Novo"} contato</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Nome *</Label><Input value={editing.name || ""} onChange={e => setEditing(p => ({ ...p!, name: e.target.value }))} /></div>
            <div><Label className="text-xs">Cargo</Label><Input value={editing.role || ""} onChange={e => setEditing(p => ({ ...p!, role: e.target.value || null }))} /></div>
            <div><Label className="text-xs">Telefone</Label><Input value={editing.phone || ""} onChange={e => setEditing(p => ({ ...p!, phone: e.target.value || null }))} /></div>
            <div><Label className="text-xs">Email</Label><Input value={editing.email || ""} onChange={e => setEditing(p => ({ ...p!, email: e.target.value || null }))} /></div>
            <div className="flex items-center gap-2 col-span-2">
              <Switch checked={!!editing.is_primary} onCheckedChange={v => setEditing(p => ({ ...p!, is_primary: v }))} />
              <Label className="text-xs">Marcar como principal</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button size="sm" onClick={() => {
              if (!editing.name?.trim()) return;
              upsert.mutate({ customer_id: customerId, ...editing } as CustomerContact, {
                onSuccess: () => setEditing(null),
              });
            }}>Salvar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
