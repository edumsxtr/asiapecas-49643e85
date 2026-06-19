import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useProposalSettings, useUpdateProposalSettings } from "@/hooks/use-proposal-settings";
import { usePricingSettings, useUpdatePricingSettings } from "@/hooks/use-pricing";
import { useSalespeople, useUpsertSalesperson, useDeleteSalesperson, type Salesperson } from "@/hooks/use-salespeople";
import { useWarrantyTemplates, useUpsertWarrantyTemplate, useDeleteWarrantyTemplate, type WarrantyTemplate } from "@/hooks/use-warranty-templates";
import { usePaymentTemplates, useUpsertPaymentTemplate, useDeletePaymentTemplate, type PaymentTemplate } from "@/hooks/use-payment-templates";
import { Save, Building2, Percent, FileText, Users, Shield, CreditCard, Banknote, Plus, Trash2, Pencil } from "lucide-react";

export default function ProposalConfigTab() {
  return (
    <Tabs defaultValue="company" className="w-full">
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="company" className="gap-1"><Building2 className="h-3.5 w-3.5" />Empresa</TabsTrigger>
        <TabsTrigger value="bank" className="gap-1"><Banknote className="h-3.5 w-3.5" />Banco</TabsTrigger>
        <TabsTrigger value="pricing" className="gap-1"><Percent className="h-3.5 w-3.5" />Precificação</TabsTrigger>
        <TabsTrigger value="defaults" className="gap-1"><FileText className="h-3.5 w-3.5" />Padrões</TabsTrigger>
        <TabsTrigger value="salespeople" className="gap-1"><Users className="h-3.5 w-3.5" />Vendedores</TabsTrigger>
        <TabsTrigger value="warranty" className="gap-1"><Shield className="h-3.5 w-3.5" />Garantias</TabsTrigger>
        <TabsTrigger value="payment" className="gap-1"><CreditCard className="h-3.5 w-3.5" />Pagamento</TabsTrigger>
      </TabsList>

      <TabsContent value="company" className="mt-4"><CompanySection /></TabsContent>
      <TabsContent value="bank" className="mt-4"><BankSection /></TabsContent>
      <TabsContent value="pricing" className="mt-4"><PricingSection /></TabsContent>
      <TabsContent value="defaults" className="mt-4"><DefaultsSection /></TabsContent>
      <TabsContent value="salespeople" className="mt-4"><SalespeopleSection /></TabsContent>
      <TabsContent value="warranty" className="mt-4"><WarrantySection /></TabsContent>
      <TabsContent value="payment" className="mt-4"><PaymentSection /></TabsContent>
    </Tabs>
  );
}

function CompanySection() {
  const { data: settings, isLoading } = useProposalSettings();
  const update = useUpdateProposalSettings();
  const [d, setD] = useState({ company_name: "", legal_company_name: "", cnpj: "", legal_state_registration: "", address: "", phone: "", email: "", website: "" });

  useEffect(() => {
    if (settings) setD({
      company_name: settings.company_name, legal_company_name: settings.legal_company_name, cnpj: settings.cnpj,
      legal_state_registration: settings.legal_state_registration || "", address: settings.address,
      phone: settings.phone, email: settings.email, website: settings.website,
    });
  }, [settings]);

  if (isLoading) return <p className="text-muted-foreground p-4">Carregando...</p>;
  return (
    <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" />Dados da Empresa</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nome Comercial" value={d.company_name} onChange={v => setD(p => ({ ...p, company_name: v }))} />
        <Field label="Razão Social (emissora da NF)" value={d.legal_company_name} onChange={v => setD(p => ({ ...p, legal_company_name: v }))} />
        <Field label="CNPJ" value={d.cnpj} onChange={v => setD(p => ({ ...p, cnpj: v }))} />
        <Field label="Inscrição Estadual" value={d.legal_state_registration} onChange={v => setD(p => ({ ...p, legal_state_registration: v }))} />
        <Field label="Endereço" value={d.address} onChange={v => setD(p => ({ ...p, address: v }))} />
        <Field label="Telefone" value={d.phone} onChange={v => setD(p => ({ ...p, phone: v }))} />
        <Field label="Email" value={d.email} onChange={v => setD(p => ({ ...p, email: v }))} />
        <Field label="Site" value={d.website} onChange={v => setD(p => ({ ...p, website: v }))} />
        <div className="md:col-span-2">
          <Button onClick={() => update.mutate(d)} disabled={update.isPending} className="gap-2"><Save className="h-4 w-4" />Salvar</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BankSection() {
  const { data: settings, isLoading } = useProposalSettings();
  const update = useUpdateProposalSettings();
  const [d, setD] = useState({ bank_name: "", bank_agency: "", bank_account: "", bank_cnpj: "", bank_favored: "", pix_key: "" });

  useEffect(() => {
    if (settings) setD({
      bank_name: settings.bank_name || "", bank_agency: settings.bank_agency || "",
      bank_account: settings.bank_account || "", bank_cnpj: settings.bank_cnpj || "",
      bank_favored: settings.bank_favored || "", pix_key: settings.pix_key || "",
    });
  }, [settings]);

  if (isLoading) return <p className="text-muted-foreground p-4">Carregando...</p>;
  return (
    <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Banknote className="h-4 w-4" />Dados Bancários (aparecem no PDF)</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Banco" value={d.bank_name} onChange={v => setD(p => ({ ...p, bank_name: v }))} placeholder="Ex: 756 - Sicoob" />
        <Field label="Agência" value={d.bank_agency} onChange={v => setD(p => ({ ...p, bank_agency: v }))} />
        <Field label="Conta" value={d.bank_account} onChange={v => setD(p => ({ ...p, bank_account: v }))} />
        <Field label="CNPJ da conta" value={d.bank_cnpj} onChange={v => setD(p => ({ ...p, bank_cnpj: v }))} />
        <Field label="Favorecido" value={d.bank_favored} onChange={v => setD(p => ({ ...p, bank_favored: v }))} />
        <Field label="Chave PIX" value={d.pix_key} onChange={v => setD(p => ({ ...p, pix_key: v }))} />
        <div className="md:col-span-2">
          <Button onClick={() => update.mutate(d)} disabled={update.isPending} className="gap-2"><Save className="h-4 w-4" />Salvar</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PricingSection() {
  const { data: pricing } = usePricingSettings();
  const update = useUpdatePricingSettings();
  const [markup, setMarkup] = useState(30);
  useEffect(() => { if (pricing) setMarkup(pricing.default_markup); }, [pricing]);
  return (
    <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Percent className="h-4 w-4" />Precificação Global</CardTitle></CardHeader>
      <CardContent className="flex items-end gap-4">
        <div className="w-40"><Label>Margem (%)</Label><Input type="number" min={0} value={markup} onChange={e => setMarkup(Number(e.target.value))} /></div>
        <Button onClick={() => update.mutate({ default_markup: markup })} disabled={update.isPending} className="gap-2"><Save className="h-4 w-4" />Salvar</Button>
        <p className="text-sm text-muted-foreground">Ex: custo R$100 → venda R${(100 * (1 + markup / 100)).toFixed(2)}</p>
      </CardContent>
    </Card>
  );
}

function DefaultsSection() {
  const { data: settings, isLoading } = useProposalSettings();
  const update = useUpdateProposalSettings();
  const [d, setD] = useState({ default_validity_days: 15, intro_paragraph: "", default_delivery_terms: "", default_observations: "", pdf_theme: "bw_institutional" as "bw_institutional" | "yellow_legacy" });

  useEffect(() => {
    if (settings) setD({
      default_validity_days: settings.default_validity_days,
      intro_paragraph: settings.intro_paragraph || "",
      default_delivery_terms: settings.default_delivery_terms,
      default_observations: settings.default_observations,
      pdf_theme: settings.pdf_theme,
    });
  }, [settings]);

  if (isLoading) return <p className="text-muted-foreground p-4">Carregando...</p>;
  return (
    <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Padrões da Proposta</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Validade padrão (dias)</Label><Input type="number" min={1} value={d.default_validity_days} onChange={e => setD(p => ({ ...p, default_validity_days: Number(e.target.value) }))} /></div>
          <div><Label>Tema do PDF</Label>
            <Select value={d.pdf_theme} onValueChange={v => setD(p => ({ ...p, pdf_theme: v as "bw_institutional" | "yellow_legacy" }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bw_institutional">Preto & Branco Institucional (novo)</SelectItem>
                <SelectItem value="yellow_legacy">Amarelo (legado)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>Parágrafo de apresentação</Label><Textarea rows={3} value={d.intro_paragraph} onChange={e => setD(p => ({ ...p, intro_paragraph: e.target.value }))} /></div>
        <div><Label>Termos de entrega padrão</Label><Input value={d.default_delivery_terms} onChange={e => setD(p => ({ ...p, default_delivery_terms: e.target.value }))} /></div>
        <div><Label>Observações padrão</Label><Textarea rows={4} value={d.default_observations} onChange={e => setD(p => ({ ...p, default_observations: e.target.value }))} /></div>
        <Button onClick={() => update.mutate(d)} disabled={update.isPending} className="gap-2"><Save className="h-4 w-4" />Salvar</Button>
      </CardContent>
    </Card>
  );
}

function SalespeopleSection() {
  const { data: list = [] } = useSalespeople();
  const upsert = useUpsertSalesperson();
  const del = useDeleteSalesperson();
  const [editing, setEditing] = useState<Partial<Salesperson> | null>(null);

  return (
    <Card><CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Vendedores</CardTitle>
      <Button size="sm" className="gap-1" onClick={() => setEditing({ name: "", role: "Comercial", active: true, is_default: false })}><Plus className="h-3.5 w-3.5" />Novo</Button>
    </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Cargo</TableHead><TableHead>Contato</TableHead><TableHead className="text-center">Padrão</TableHead><TableHead className="text-center">Ativo</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {list.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell><TableCell>{s.role}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{s.phone} {s.email && `· ${s.email}`}</TableCell>
                <TableCell className="text-center">{s.is_default && <Badge>Padrão</Badge>}</TableCell>
                <TableCell className="text-center">{s.active ? "Sim" : "Não"}</TableCell>
                <TableCell className="text-right"><div className="flex gap-1 justify-end">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(s.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {editing && (
          <div className="mt-4 p-4 border rounded-md space-y-3">
            <h4 className="font-medium">{editing.id ? "Editar" : "Novo"} Vendedor</h4>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome" value={editing.name || ""} onChange={v => setEditing(p => ({ ...p!, name: v }))} />
              <Field label="Cargo" value={editing.role || ""} onChange={v => setEditing(p => ({ ...p!, role: v }))} />
              <Field label="Telefone" value={editing.phone || ""} onChange={v => setEditing(p => ({ ...p!, phone: v }))} />
              <Field label="Email" value={editing.email || ""} onChange={v => setEditing(p => ({ ...p!, email: v }))} />
              <div className="flex items-center gap-2"><Switch checked={!!editing.is_default} onCheckedChange={v => setEditing(p => ({ ...p!, is_default: v }))} /><Label>Padrão</Label></div>
              <div className="flex items-center gap-2"><Switch checked={editing.active !== false} onCheckedChange={v => setEditing(p => ({ ...p!, active: v }))} /><Label>Ativo</Label></div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={() => { if (!editing.name) return; upsert.mutate(editing as Salesperson, { onSuccess: () => setEditing(null) }); }}>Salvar</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WarrantySection() {
  const { data: list = [] } = useWarrantyTemplates();
  const upsert = useUpsertWarrantyTemplate();
  const del = useDeleteWarrantyTemplate();
  const [editing, setEditing] = useState<Partial<WarrantyTemplate> | null>(null);

  return (
    <Card><CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" />Templates de Garantia</CardTitle>
      <Button size="sm" className="gap-1" onClick={() => setEditing({ name: "", months: 3, intro_text: "", conditions: [], exclusions: [], active: true })}><Plus className="h-3.5 w-3.5" />Novo</Button>
    </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Prazo</TableHead><TableHead>Categoria padrão</TableHead><TableHead>Condições</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {list.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell>{t.months}m</TableCell>
                <TableCell className="text-xs">{t.default_for_category ? <Badge variant="secondary" className="text-[10px]">{t.default_for_category}</Badge> : "—"}</TableCell>
                <TableCell className="text-xs">{t.conditions.length} cond. · {t.exclusions.length} excl.</TableCell>
                <TableCell className="text-right"><div className="flex gap-1 justify-end">
                  <Button size="icon" variant="ghost" title="Duplicar" onClick={() => {
                    const { id: _id, created_at: _c, updated_at: _u, ...rest } = t;
                    setEditing({ ...rest, name: `${t.name} (cópia)` });
                  }}><Plus className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditing(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(t.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {editing && (
          <div className="mt-4 p-4 border rounded-md space-y-3">
            <h4 className="font-medium">{editing.id ? "Editar" : "Novo"} Template de Garantia</h4>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Nome" value={editing.name || ""} onChange={v => setEditing(p => ({ ...p!, name: v }))} />
              <div><Label>Prazo (meses)</Label><Input type="number" value={editing.months ?? 0} onChange={e => setEditing(p => ({ ...p!, months: Number(e.target.value) }))} /></div>
              <Field label="Categoria padrão (opcional)" value={editing.default_for_category || ""} onChange={v => setEditing(p => ({ ...p!, default_for_category: v || null }))} placeholder="Ex: Motor" />
            </div>
            <div><Label>Texto introdutório</Label><Textarea rows={4} value={editing.intro_text || ""} onChange={e => setEditing(p => ({ ...p!, intro_text: e.target.value }))} /></div>
            <div><Label>Condições (uma por linha)</Label><Textarea rows={5} value={(editing.conditions || []).join("\n")} onChange={e => setEditing(p => ({ ...p!, conditions: e.target.value.split("\n").filter(Boolean) }))} /></div>
            <div><Label>Exclusões (uma por linha)</Label><Textarea rows={4} value={(editing.exclusions || []).join("\n")} onChange={e => setEditing(p => ({ ...p!, exclusions: e.target.value.split("\n").filter(Boolean) }))} /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={() => { if (!editing.name) return; upsert.mutate(editing as WarrantyTemplate, { onSuccess: () => setEditing(null) }); }}>Salvar</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentSection() {
  const { data: list = [] } = usePaymentTemplates();
  const upsert = useUpsertPaymentTemplate();
  const del = useDeletePaymentTemplate();
  const [editing, setEditing] = useState<Partial<PaymentTemplate> | null>(null);

  return (
    <Card><CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" />Templates de Condição de Pagamento</CardTitle>
      <Button size="sm" className="gap-1" onClick={() => setEditing({ name: "", kind: "entry_installments", entry_pct: 40, installments: 3, interval_days: 30, discount_pct: 0, active: true })}><Plus className="h-3.5 w-3.5" />Novo</Button>
    </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Entrada</TableHead><TableHead>Parcelas</TableHead><TableHead>Intervalo</TableHead><TableHead>Desc.</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {list.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="text-xs">{t.kind === "cash" ? "À vista" : t.kind === "entry_installments" ? "Entrada+Parcelas" : "Parcelado"}</TableCell>
                <TableCell>{t.entry_pct}%</TableCell><TableCell>{t.installments}</TableCell>
                <TableCell>{t.interval_days}d</TableCell><TableCell>{t.discount_pct}%</TableCell>
                <TableCell className="text-right"><div className="flex gap-1 justify-end">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(t.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {editing && (
          <div className="mt-4 p-4 border rounded-md space-y-3">
            <h4 className="font-medium">{editing.id ? "Editar" : "Novo"} Template</h4>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Nome" value={editing.name || ""} onChange={v => setEditing(p => ({ ...p!, name: v }))} />
              <div><Label>Tipo</Label>
                <Select value={editing.kind || "entry_installments"} onValueChange={v => setEditing(p => ({ ...p!, kind: v as PaymentTemplate["kind"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">À vista</SelectItem>
                    <SelectItem value="entry_installments">Entrada + Parcelas</SelectItem>
                    <SelectItem value="installments">Parcelado puro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Entrada (%)</Label><Input type="number" value={editing.entry_pct ?? 0} onChange={e => setEditing(p => ({ ...p!, entry_pct: Number(e.target.value) }))} /></div>
              <div><Label>Nº parcelas</Label><Input type="number" value={editing.installments ?? 0} onChange={e => setEditing(p => ({ ...p!, installments: Number(e.target.value) }))} /></div>
              <div><Label>Intervalo (dias)</Label><Input type="number" value={editing.interval_days ?? 30} onChange={e => setEditing(p => ({ ...p!, interval_days: Number(e.target.value) }))} /></div>
              <div><Label>Desconto (%)</Label><Input type="number" value={editing.discount_pct ?? 0} onChange={e => setEditing(p => ({ ...p!, discount_pct: Number(e.target.value) }))} /></div>
            </div>
            <Field label="Notas" value={editing.notes || ""} onChange={v => setEditing(p => ({ ...p!, notes: v || null }))} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={() => { if (!editing.name) return; upsert.mutate(editing as PaymentTemplate, { onSuccess: () => setEditing(null) }); }}>Salvar</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <div><Label>{label}</Label><Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /></div>;
}
