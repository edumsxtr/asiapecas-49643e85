import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useProposalSettings, generateProposalNumber } from "@/hooks/use-proposal-settings";
import { useSalespeople } from "@/hooks/use-salespeople";
import { useWarrantyTemplates, pickTemplateForCategory, useUpsertWarrantyTemplate } from "@/hooks/use-warranty-templates";
import { usePaymentTemplates, buildSchedule } from "@/hooks/use-payment-templates";
import { useGenerateWarrantyAI } from "@/hooks/use-warranty-ai";
import { useCustomerById } from "@/hooks/use-customers";
import { useCustomerContacts } from "@/hooks/use-customer-contacts";
import { usePricingSettings, applySellPrice } from "@/hooks/use-pricing";
import type { Sale } from "@/hooks/use-sales";
import { supabase } from "@/integrations/supabase/client";
import { generateProposalInstitutional, loadLogoAsBase64, type ProposalItem, type ProposalPayload } from "@/lib/generate-proposal-institutional";
import ProposalPreviewInstitutional from "./ProposalPreviewInstitutional";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { FileDown, Loader2, Eye, Save, Sparkles } from "lucide-react";

type Props = {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ProposalGeneratorDialog({ sale, open, onOpenChange }: Props) {
  const { data: settings } = useProposalSettings();
  const { data: salespeople = [] } = useSalespeople(true);
  const { data: warranties = [] } = useWarrantyTemplates(true);
  const { data: payments = [] } = usePaymentTemplates(true);
  const { data: pricing } = usePricingSettings();
  const markup = pricing?.default_markup ?? 30;

  const { data: customer } = useCustomerById(sale?.customer_id || null);
  const { data: contacts = [] } = useCustomerContacts(sale?.customer_id || null);

  const [salespersonId, setSalespersonId] = useState<string>("");
  const [contactId, setContactId] = useState<string>("none");
  const [validityDays, setValidityDays] = useState(15);
  const [intro, setIntro] = useState("");
  const [paymentTemplateId, setPaymentTemplateId] = useState<string>("");
  const [applyTemplateDiscount, setApplyTemplateDiscount] = useState<boolean>(true);
  const [manualDiscount, setManualDiscount] = useState<string>(""); // "" = no override
  const [freight, setFreight] = useState("Por conta do comprador.");
  const [observations, setObservations] = useState("");
  const [items, setItems] = useState<ProposalItem[]>([]);
  const [partMeta, setPartMeta] = useState<Record<string, { part_category: string | null; subcategory: string | null; manufacturer: string | null; machine_model: string | null }>>({});
  const [aiLoadingIdx, setAiLoadingIdx] = useState<number | null>(null);
  const [proposalNumber, setProposalNumber] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>();
  const [logoBase64, setLogoBase64] = useState<string>();

  const aiWarranty = useGenerateWarrantyAI();
  const upsertWarranty = useUpsertWarrantyTemplate();

  useEffect(() => {
    if (!open) return;
    loadLogoAsBase64().then((b64) => { setLogoBase64(b64); setLogoUrl(b64); });
  }, [open]);

  useEffect(() => {
    if (open && settings) {
      setValidityDays(settings.default_validity_days);
      setIntro(settings.intro_paragraph || "");
      setObservations(settings.default_observations || "");
    }
  }, [open, settings]);

  useEffect(() => {
    if (open && salespeople.length > 0 && !salespersonId) {
      const def = salespeople.find(s => s.is_default) || salespeople[0];
      setSalespersonId(def.id);
    }
  }, [open, salespeople, salespersonId]);

  useEffect(() => {
    if (open && contacts.length > 0 && contactId === "none") {
      const primary = contacts.find(c => c.is_primary);
      if (primary) setContactId(primary.id);
    }
  }, [open, contacts, contactId]);

  useEffect(() => {
    if (open && payments.length > 0 && !paymentTemplateId) {
      setPaymentTemplateId(payments[0].id);
    }
  }, [open, payments, paymentTemplateId]);

  // Build items whenever sale opens
  useEffect(() => {
    if (!open || !sale) { setItems([]); setPartMeta({}); return; }
    (async () => {
      const partIds = (sale.sale_items || []).map(i => i.part_id).filter(Boolean) as string[];
      const meta: Record<string, { part_category: string | null; subcategory: string | null; manufacturer: string | null; machine_model: string | null }> = {};
      if (partIds.length > 0) {
        const { data } = await supabase.from("parts")
          .select("id, part_category, subcategory, manufacturer, machine_model")
          .in("id", partIds);
        for (const p of (data || []) as Array<{ id: string; part_category: string | null; subcategory: string | null; manufacturer: string | null; machine_model: string | null }>) {
          meta[p.id] = { part_category: p.part_category, subcategory: p.subcategory, manufacturer: p.manufacturer, machine_model: p.machine_model };
        }
      }
      setPartMeta(meta);
      const built: ProposalItem[] = (sale.sale_items || []).map((si) => {
        const partRow = si.parts as { material?: string; description?: string } | null;
        const sp = (si as { sell_price?: number }).sell_price && (si as { sell_price?: number }).sell_price! > 0
          ? (si as { sell_price?: number }).sell_price!
          : applySellPrice(si.unit_price, markup);
        const cat = si.part_id ? meta[si.part_id]?.part_category ?? null : null;
        return {
          id: si.id,
          material: partRow?.material || "—",
          description: partRow?.description || "—",
          quantity: si.quantity,
          unit_price: si.unit_price,
          sell_price: sp,
          condition: (si as { condition?: string }).condition || "Novo",
          warranty_template: pickTemplateForCategory(warranties, cat),
          warranty_custom_months: null,
          warranty_custom_text: null,
          pickup_address: null,
        };
      });
      setItems(built);
    })();
  }, [open, sale, markup, warranties]);

  useEffect(() => {
    if (open && !proposalNumber) {
      // Use the existing proposal_number if the sale already has one
      const existing = (sale as { proposal_number?: string | null } | null)?.proposal_number;
      if (existing) setProposalNumber(existing);
      else generateProposalNumber().then(setProposalNumber).catch(() => setProposalNumber("AP-RASCUNHO"));
    }
  }, [open, sale, proposalNumber]);

  useEffect(() => {
    if (!open) {
      setSalespersonId(""); setContactId("none"); setPaymentTemplateId(""); setProposalNumber("");
      setApplyTemplateDiscount(true); setManualDiscount("");
    }
  }, [open]);

  // When template changes, reset discount toggle to its template's default behavior
  useEffect(() => {
    setManualDiscount("");
    setApplyTemplateDiscount(true);
  }, [paymentTemplateId]);

  const total = useMemo(() => items.reduce((s, it) => s + it.sell_price * it.quantity, 0), [items]);
  const paymentTemplate = payments.find(p => p.id === paymentTemplateId);

  // Effective discount: manual override wins; otherwise toggle decides between template % and 0.
  const effectiveDiscountPct = useMemo(() => {
    const manual = manualDiscount.trim() === "" ? null : Number(manualDiscount);
    if (manual != null && !Number.isNaN(manual)) return Math.max(0, manual);
    if (!paymentTemplate) return 0;
    return applyTemplateDiscount ? paymentTemplate.discount_pct : 0;
  }, [manualDiscount, applyTemplateDiscount, paymentTemplate]);

  const scheduleResult = useMemo(() => {
    if (!paymentTemplate) return { schedule: [], finalTotal: total, discount: 0, discountPct: 0 };
    return buildSchedule(paymentTemplate, total, new Date(), effectiveDiscountPct);
  }, [paymentTemplate, total, effectiveDiscountPct]);
  const schedule = scheduleResult.schedule;
  const discountAmount = scheduleResult.discount;
  const finalTotal = scheduleResult.finalTotal;

  const salesperson = salespeople.find(s => s.id === salespersonId);
  const contact = contacts.find(c => c.id === contactId) || null;

  const payload: ProposalPayload | null = useMemo(() => {
    if (!settings || !salesperson || !customer) return null;
    return {
      proposalNumber: proposalNumber || "AP-...",
      date: new Date(),
      validityDays,
      intro,
      settings,
      salesperson,
      client: {
        name: customer.name,
        legal_name: (customer as { legal_name?: string | null }).legal_name,
        trade_name: (customer as { trade_name?: string | null }).trade_name,
        cnpj_cpf: customer.cnpj_cpf,
        state_registration: (customer as { state_registration?: string | null }).state_registration,
        municipal_registration: (customer as { municipal_registration?: string | null }).municipal_registration,
        address_street: (customer as { address_street?: string | null }).address_street,
        address_number: (customer as { address_number?: string | null }).address_number,
        address_complement: (customer as { address_complement?: string | null }).address_complement,
        address_district: (customer as { address_district?: string | null }).address_district,
        address_city: (customer as { address_city?: string | null }).address_city,
        address_state: (customer as { address_state?: string | null }).address_state,
        address_zip: (customer as { address_zip?: string | null }).address_zip,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        phone: customer.phone,
        email: customer.email,
      },
      contact,
      items,
      paymentTemplateName: paymentTemplate?.name || null,
      schedule,
      freightTerms: freight,
      observations,
    };
  }, [settings, salesperson, customer, contact, items, paymentTemplate, schedule, proposalNumber, validityDays, intro, freight, observations]);

  const updateItem = (idx: number, patch: Partial<ProposalItem>) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };

  const handleGenerate = async () => {
    if (!payload) return;
    setGenerating(true);
    try {
      await generateProposalInstitutional(payload, logoBase64);
      await saveProposalMetadata();
      toast.success("Proposta gerada!");
      onOpenChange(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro";
      toast.error("Erro ao gerar: " + msg);
    } finally {
      setGenerating(false);
    }
  };

  const saveProposalMetadata = async () => {
    if (!sale) return;
    await supabase.from("sales").update({
      proposal_number: proposalNumber,
      salesperson_id: salespersonId || null,
      payment_template_id: paymentTemplateId || null,
      payment_schedule: schedule as never,
      freight_terms: freight,
      validity_days: validityDays,
      intro_paragraph: intro,
      observations,
      contact_id: contactId !== "none" ? contactId : null,
      proposal_status: "rascunho",
    } as never).eq("id", sale.id);
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      await saveProposalMetadata();
      toast.success("Rascunho salvo");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro";
      toast.error("Erro: " + msg);
    } finally { setSavingDraft(false); }
  };

  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] max-h-[95vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" /> Proposta {proposalNumber || "..."} — {customer?.name || "..."}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: form */}
          <div className="w-[480px] border-r flex flex-col">
            <Tabs defaultValue="config" className="flex-1 flex flex-col">
              <TabsList className="rounded-none border-b w-full justify-start px-2">
                <TabsTrigger value="config">Cabeçalho</TabsTrigger>
                <TabsTrigger value="items">Itens & Garantia</TabsTrigger>
                <TabsTrigger value="payment">Pagamento</TabsTrigger>
                <TabsTrigger value="closing">Fechamento</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1">
                <TabsContent value="config" className="p-4 space-y-3 m-0">
                  <div>
                    <Label>Nº Proposta</Label>
                    <Input value={proposalNumber} onChange={e => setProposalNumber(e.target.value)} className="font-mono" />
                  </div>
                  <div>
                    <Label>Vendedor (assina a proposta)</Label>
                    <Select value={salespersonId} onValueChange={setSalespersonId}>
                      <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                      <SelectContent>
                        {salespeople.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name} — {s.role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Contato do cliente</Label>
                    <Select value={contactId} onValueChange={setContactId}>
                      <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum (usar dados do cliente)</SelectItem>
                        {contacts.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}{c.role ? ` — ${c.role}` : ""}{c.is_primary ? " ★" : ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {contacts.length === 0 && <p className="text-xs text-muted-foreground mt-1">Nenhum contato cadastrado para este cliente.</p>}
                  </div>
                  <div>
                    <Label>Validade (dias)</Label>
                    <Input type="number" min={1} value={validityDays} onChange={e => setValidityDays(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Parágrafo de apresentação</Label>
                    <Textarea rows={4} value={intro} onChange={e => setIntro(e.target.value)} />
                  </div>
                </TabsContent>

                <TabsContent value="items" className="p-4 space-y-3 m-0">
                  {items.length === 0 && <p className="text-sm text-muted-foreground">Sem itens.</p>}
                  {items.map((it, idx) => (
                    <Card key={it.id}>
                      <CardContent className="p-3 space-y-2 text-xs">
                        <p className="font-mono">{it.material}</p>
                        <p className="text-muted-foreground">{it.description}</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-[10px]">Qtd</Label>
                            <Input type="number" min={1} value={it.quantity} onChange={e => updateItem(idx, { quantity: Number(e.target.value) })} className="h-8" />
                          </div>
                          <div>
                            <Label className="text-[10px]">Condição</Label>
                            <Select value={it.condition} onValueChange={v => updateItem(idx, { condition: v })}>
                              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Novo">Novo</SelectItem>
                                <SelectItem value="Recondicionado">Recondicionado</SelectItem>
                                <SelectItem value="Usado">Usado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-[10px]">Vlr Unit.</Label>
                            <Input type="number" value={it.sell_price} onChange={e => updateItem(idx, { sell_price: Number(e.target.value) })} className="h-8" />
                          </div>
                        </div>
                        <div>
                          <Label className="text-[10px]">Garantia (template)</Label>
                          <Select value={it.warranty_template?.id || "none"} onValueChange={v => {
                            if (v === "none") updateItem(idx, { warranty_template: null });
                            else updateItem(idx, { warranty_template: warranties.find(w => w.id === v) || null });
                          }}>
                            <SelectTrigger className="h-8"><SelectValue placeholder="Sem garantia" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem garantia</SelectItem>
                              {warranties.map(w => <SelectItem key={w.id} value={w.id}>{w.name} ({w.months}m)</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px]">Override meses</Label>
                            <Input type="number" placeholder={String(it.warranty_template?.months ?? 0)} value={it.warranty_custom_months ?? ""} onChange={e => updateItem(idx, { warranty_custom_months: e.target.value ? Number(e.target.value) : null })} className="h-8" />
                          </div>
                          <div>
                            <Label className="text-[10px]">Local retirada</Label>
                            <Input value={it.pickup_address || ""} onChange={e => updateItem(idx, { pickup_address: e.target.value || null })} className="h-8" placeholder="Opcional" />
                          </div>
                        </div>
                        <div>
                          <Label className="text-[10px]">Override texto garantia</Label>
                          <Textarea rows={2} placeholder="Deixe vazio para usar o template" value={it.warranty_custom_text || ""} onChange={e => updateItem(idx, { warranty_custom_text: e.target.value || null })} className="text-xs" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="payment" className="p-4 space-y-3 m-0">
                  <div>
                    <Label>Template de pagamento</Label>
                    <Select value={paymentTemplateId} onValueChange={setPaymentTemplateId}>
                      <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                      <SelectContent>
                        {payments.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Frete</Label>
                    <Input value={freight} onChange={e => setFreight(e.target.value)} />
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-2">Cronograma calculado:</p>
                    <Table>
                      <TableHeader><TableRow><TableHead className="h-7">Parcela</TableHead><TableHead className="h-7 text-right">Valor</TableHead><TableHead className="h-7 text-center">Vencimento</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {schedule.map((s, i) => (
                          <TableRow key={i}><TableCell className="text-xs py-1">{s.label}</TableCell><TableCell className="text-xs py-1 text-right font-mono">R$ {s.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell><TableCell className="text-xs py-1 text-center">{s.due_date ? new Date(s.due_date).toLocaleDateString("pt-BR") : "—"}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <p className="text-right text-sm font-bold mt-2">Total: R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                </TabsContent>

                <TabsContent value="closing" className="p-4 space-y-3 m-0">
                  <div>
                    <Label>Observações</Label>
                    <Textarea rows={6} value={observations} onChange={e => setObservations(e.target.value)} />
                  </div>
                  {customer && (!customer.cnpj_cpf || !(customer as { address_street?: string }).address_street) && (
                    <Card className="border-yellow-500/40 bg-yellow-50 dark:bg-yellow-950/20">
                      <CardContent className="p-3 text-xs space-y-1">
                        <p className="font-bold">⚠ Dados do cliente incompletos</p>
                        {!customer.cnpj_cpf && <p>• CNPJ não cadastrado</p>}
                        {!(customer as { address_street?: string }).address_street && <p>• Endereço estruturado não cadastrado</p>}
                        <p className="text-muted-foreground mt-1">Edite o cliente para aparecer corretamente no PDF.</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          {/* Right: live preview */}
          <ScrollArea className="flex-1 bg-muted">
            <div className="p-4 flex justify-center">
              <div style={{ transform: "scale(0.65)", transformOrigin: "top center", marginBottom: "-35%" }}>
                <ProposalPreviewInstitutional payload={payload} logoUrl={logoUrl} />
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="p-3 border-t gap-2">
          <Badge variant="outline" className="mr-auto">Total: R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</Badge>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="outline" onClick={handleSaveDraft} disabled={savingDraft}>
            {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar Rascunho
          </Button>
          <Button onClick={handleGenerate} disabled={generating || !payload}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="h-4 w-4 mr-2" />} Gerar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
