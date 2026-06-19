import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trash2, Plus, Loader2 } from "lucide-react";
import { useExtractCustomer, type ExtractedCustomer, type ExtractedContact } from "@/hooks/use-extract-customer";
import { useCreateCustomer } from "@/hooks/use-customers";
import { useUpsertCustomerContact } from "@/hooks/use-customer-contacts";
import { toast } from "sonner";

const MAX_BYTES = 10 * 1024 * 1024;
const SEGMENTS = ["mineração", "construção", "logística", "energia", "agronegócio", "geral"];

const emptyExtract: ExtractedCustomer = {
  legal_name: null, trade_name: null, cnpj_cpf: null, state_registration: null, municipal_registration: null,
  email: null, phone: null, website: null, segment: "geral",
  address: { street: null, number: null, complement: null, district: null, city: null, state: null, zip: null },
  contacts: [],
  notes: null,
};

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function AICustomerImportDialog({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [tab, setTab] = useState<"text" | "pdf" | "docx">("text");
  const [text, setText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<ExtractedCustomer | null>(null);

  const extractMut = useExtractCustomer();
  const createMut = useCreateCustomer();
  const contactMut = useUpsertCustomerContact();

  const reset = () => {
    setText(""); setPdfFile(null); setDocxFile(null); setExtracted(null); setTab("text");
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleExtract = async () => {
    try {
      if (tab === "text") {
        if (!text.trim()) { toast.error("Cole o texto antes."); return; }
        const data = await extractMut.mutateAsync({ text: text.trim() });
        setExtracted(data);
      } else {
        const file = tab === "pdf" ? pdfFile : docxFile;
        if (!file) { toast.error("Selecione um arquivo."); return; }
        if (file.size > MAX_BYTES) { toast.error("Arquivo maior que 10MB."); return; }
        const fileBase64 = await fileToBase64(file);
        const data = await extractMut.mutateAsync({ fileBase64, fileType: tab, fileName: file.name });
        setExtracted(data);
      }
      toast.success("Dados extraídos. Revise antes de salvar.");
    } catch {/* toast handled */}
  };

  const updateExtract = (patch: Partial<ExtractedCustomer>) => {
    setExtracted((e) => e ? { ...e, ...patch } : e);
  };
  const updateAddress = (patch: Partial<ExtractedCustomer["address"]>) => {
    setExtracted((e) => e ? { ...e, address: { ...e.address, ...patch } } : e);
  };
  const updateContact = (idx: number, patch: Partial<ExtractedContact>) => {
    setExtracted((e) => {
      if (!e) return e;
      const contacts = [...e.contacts];
      contacts[idx] = { ...contacts[idx], ...patch };
      return { ...e, contacts };
    });
  };
  const addContact = () => {
    setExtracted((e) => e ? { ...e, contacts: [...e.contacts, { name: "", role: null, phone: null, email: null, is_primary: e.contacts.length === 0 }] } : e);
  };
  const removeContact = (idx: number) => {
    setExtracted((e) => e ? { ...e, contacts: e.contacts.filter((_, i) => i !== idx) } : e);
  };

  const handleSave = async () => {
    if (!extracted) return;
    const name = extracted.contacts.find((c) => c.is_primary)?.name
      || extracted.contacts[0]?.name
      || extracted.trade_name
      || extracted.legal_name
      || "";
    if (!name.trim()) { toast.error("Informe ao menos um nome ou razão social."); return; }

    const company = extracted.trade_name || extracted.legal_name;
    const addr = extracted.address;
    try {
      const created = await createMut.mutateAsync({
        name: name.trim(),
        company,
        legal_name: extracted.legal_name,
        trade_name: extracted.trade_name,
        cnpj_cpf: extracted.cnpj_cpf,
        state_registration: extracted.state_registration,
        municipal_registration: extracted.municipal_registration,
        email: extracted.email,
        phone: extracted.phone,
        segment: extracted.segment || "geral",
        notes: extracted.notes,
        address_street: addr.street,
        address_number: addr.number,
        address_complement: addr.complement,
        address_district: addr.district,
        address_city: addr.city,
        address_state: addr.state,
        address_zip: addr.zip,
        city: addr.city,
        state: addr.state,
      });

      // Save contacts (best-effort)
      const newId = (created as { id?: string } | null)?.id;
      if (newId) {
        for (const c of extracted.contacts) {
          if (!c.name?.trim()) continue;
          try {
            await contactMut.mutateAsync({
              customer_id: newId,
              name: c.name.trim(),
              role: c.role,
              phone: c.phone,
              email: c.email,
              is_primary: c.is_primary,
            });
          } catch {/* ignore individual contact failure */}
        }
      }
      handleClose(false);
    } catch {/* toast handled */}
  };

  const isExtracting = extractMut.isPending;
  const isSaving = createMut.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Cadastrar cliente via IA
          </DialogTitle>
          <DialogDescription>
            Cole o texto enviado pelo cliente, ou envie um PDF / Word com os dados. A IA preenche o cadastro automaticamente para você revisar.
          </DialogDescription>
        </DialogHeader>

        {!extracted ? (
          <div className="space-y-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text">Colar texto</TabsTrigger>
                <TabsTrigger value="pdf">PDF</TabsTrigger>
                <TabsTrigger value="docx">Word</TabsTrigger>
              </TabsList>
              <TabsContent value="text" className="space-y-2">
                <Label>Texto com os dados do cliente</Label>
                <Textarea rows={12} placeholder="Ex.: Razão Social: ACME LTDA, CNPJ 12.345.678/0001-90, contato João Silva (Compras) joao@acme.com..." value={text} onChange={(e) => setText(e.target.value)} />
              </TabsContent>
              <TabsContent value="pdf" className="space-y-2">
                <Label>Arquivo PDF (até 10MB)</Label>
                <Input type="file" accept="application/pdf,.pdf" onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)} />
                {pdfFile && <p className="text-xs text-muted-foreground">{pdfFile.name} — {(pdfFile.size / 1024).toFixed(0)} KB</p>}
              </TabsContent>
              <TabsContent value="docx" className="space-y-2">
                <Label>Arquivo Word .docx (até 10MB)</Label>
                <Input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => setDocxFile(e.target.files?.[0] ?? null)} />
                {docxFile && <p className="text-xs text-muted-foreground">{docxFile.name} — {(docxFile.size / 1024).toFixed(0)} KB</p>}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
              <Button onClick={handleExtract} disabled={isExtracting}>
                {isExtracting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Extraindo…</> : <><Sparkles className="h-4 w-4 mr-2" /> Extrair dados</>}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Revisar antes de salvar</Badge>
              <Button variant="ghost" size="sm" onClick={() => setExtracted(null)}>Voltar</Button>
            </div>

            <section className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Identificação</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Razão Social</Label><Input value={extracted.legal_name ?? ""} onChange={(e) => updateExtract({ legal_name: e.target.value || null })} /></div>
                <div><Label>Nome Fantasia</Label><Input value={extracted.trade_name ?? ""} onChange={(e) => updateExtract({ trade_name: e.target.value || null })} /></div>
                <div><Label>CNPJ</Label><Input value={extracted.cnpj_cpf ?? ""} onChange={(e) => updateExtract({ cnpj_cpf: e.target.value.replace(/\D+/g, "") || null })} /></div>
                <div><Label>Segmento</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={extracted.segment ?? "geral"} onChange={(e) => updateExtract({ segment: e.target.value })}>
                    {SEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div><Label>Inscrição Estadual</Label><Input value={extracted.state_registration ?? ""} onChange={(e) => updateExtract({ state_registration: e.target.value || null })} /></div>
                <div><Label>Inscrição Municipal</Label><Input value={extracted.municipal_registration ?? ""} onChange={(e) => updateExtract({ municipal_registration: e.target.value || null })} /></div>
                <div><Label>Email principal</Label><Input value={extracted.email ?? ""} onChange={(e) => updateExtract({ email: e.target.value.toLowerCase() || null })} /></div>
                <div><Label>Telefone principal</Label><Input value={extracted.phone ?? ""} onChange={(e) => updateExtract({ phone: e.target.value || null })} /></div>
                <div className="col-span-2"><Label>Site</Label><Input value={extracted.website ?? ""} onChange={(e) => updateExtract({ website: e.target.value || null })} /></div>
              </div>
            </section>

            <section className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Endereço</p>
              <div className="grid grid-cols-6 gap-3">
                <div className="col-span-4"><Label>Rua</Label><Input value={extracted.address.street ?? ""} onChange={(e) => updateAddress({ street: e.target.value || null })} /></div>
                <div className="col-span-1"><Label>Nº</Label><Input value={extracted.address.number ?? ""} onChange={(e) => updateAddress({ number: e.target.value || null })} /></div>
                <div className="col-span-1"><Label>CEP</Label><Input value={extracted.address.zip ?? ""} onChange={(e) => updateAddress({ zip: e.target.value.replace(/\D+/g, "") || null })} /></div>
                <div className="col-span-2"><Label>Complemento</Label><Input value={extracted.address.complement ?? ""} onChange={(e) => updateAddress({ complement: e.target.value || null })} /></div>
                <div className="col-span-2"><Label>Bairro</Label><Input value={extracted.address.district ?? ""} onChange={(e) => updateAddress({ district: e.target.value || null })} /></div>
                <div className="col-span-2"><Label>Cidade</Label><Input value={extracted.address.city ?? ""} onChange={(e) => updateAddress({ city: e.target.value || null })} /></div>
                <div className="col-span-6"><Label>UF</Label><Input maxLength={2} value={extracted.address.state ?? ""} onChange={(e) => updateAddress({ state: e.target.value.toUpperCase() || null })} /></div>
              </div>
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Contatos ({extracted.contacts.length})</p>
                <Button size="sm" variant="outline" onClick={addContact}><Plus className="h-3 w-3 mr-1" />Adicionar</Button>
              </div>
              {extracted.contacts.length === 0 && <p className="text-sm text-muted-foreground">Nenhum contato detectado.</p>}
              {extracted.contacts.map((c, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end border rounded-md p-3">
                  <div className="col-span-3"><Label>Nome</Label><Input value={c.name} onChange={(e) => updateContact(i, { name: e.target.value })} /></div>
                  <div className="col-span-2"><Label>Cargo</Label><Input value={c.role ?? ""} onChange={(e) => updateContact(i, { role: e.target.value || null })} /></div>
                  <div className="col-span-3"><Label>Email</Label><Input value={c.email ?? ""} onChange={(e) => updateContact(i, { email: e.target.value.toLowerCase() || null })} /></div>
                  <div className="col-span-2"><Label>Telefone</Label><Input value={c.phone ?? ""} onChange={(e) => updateContact(i, { phone: e.target.value || null })} /></div>
                  <div className="col-span-1 flex flex-col items-center">
                    <Label className="text-xs">Principal</Label>
                    <input type="radio" name="primary" checked={c.is_primary} onChange={() => setExtracted((e) => e ? { ...e, contacts: e.contacts.map((cc, idx) => ({ ...cc, is_primary: idx === i })) } : e)} />
                  </div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="icon" onClick={() => removeContact(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </section>

            <section>
              <Label>Observações</Label>
              <Textarea rows={3} value={extracted.notes ?? ""} onChange={(e) => updateExtract({ notes: e.target.value || null })} />
            </section>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando…</> : "Salvar cliente"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
