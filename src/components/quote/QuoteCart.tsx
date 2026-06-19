import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Plus, Minus, Trash2, Send, CheckCircle2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { type Lang, tr } from "./translations";
import { getUtm } from "@/lib/utm";
import { track, trackServerConversion } from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";
import { lookupCep } from "@/lib/viacep";

type CartItem = { material: string; description: string; quantity: number };

interface QuoteCartProps {
  items: CartItem[];
  onUpdateQty: (material: string, qty: number) => void;
  onRemove: (material: string) => void;
  onClear: () => void;
  lang: Lang;
}

const SEGMENTS = ["Mineração", "Construção / Linha amarela", "Locação de equipamentos", "Revenda / Distribuidor", "Transporte / Logística", "Outro"];

const emptyForm = {
  // contact
  name: "", email: "", phone: "", document: "", documentType: "CNPJ" as "CNPJ" | "CPF",
  // company (PJ)
  legal_name: "", trade_name: "", state_registration: "",
  // address
  zip: "", street: "", number: "", complement: "", district: "", city: "", state: "", country: "Brasil",
  // ops
  segment: "", interest_models: "", notes: "",
  // account
  createAccount: false, password: "", passwordConfirm: "",
};

export default function QuoteCart({ items, onUpdateQty, onRemove, onClear, lang }: QuoteCartProps) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Prefill from logged-in customer
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: c } = await supabase.from("customers").select("*").eq("email", user.email!).maybeSingle();
      if (c) {
        setForm(f => ({
          ...f,
          name: c.name || f.name,
          email: user.email || f.email,
          phone: c.phone || f.phone,
          document: c.cnpj_cpf || f.document,
          legal_name: c.legal_name || f.legal_name,
          trade_name: c.trade_name || f.trade_name,
          state_registration: c.state_registration || f.state_registration,
          zip: c.address_zip || f.zip,
          street: c.address_street || f.street,
          number: c.address_number || f.number,
          complement: c.address_complement || f.complement,
          district: c.address_district || f.district,
          city: c.address_city || c.city || f.city,
          state: c.address_state || c.state || f.state,
          country: c.country || f.country,
          segment: c.segment || f.segment,
        }));
      } else if (user.email) {
        setForm(f => ({ ...f, email: user.email! }));
      }
    })();
  }, [user]);

  const handleCepBlur = async () => {
    const r = await lookupCep(form.zip);
    if (r) setForm(f => ({ ...f, street: r.logradouro || f.street, district: r.bairro || f.district, city: r.localidade || f.city, state: r.uf || f.state }));
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return "Informe o nome do contato.";
    if (!form.email.trim()) return "Informe um e-mail válido.";
    if (!form.phone.trim()) return "Informe um telefone/WhatsApp.";
    if (!form.document.trim()) return "Informe o CNPJ ou CPF.";
    if (form.documentType === "CNPJ" && !form.legal_name.trim()) return "Informe a razão social.";
    if (!form.zip.trim() || !form.street.trim() || !form.number.trim() || !form.city.trim() || !form.state.trim())
      return "Endereço completo é obrigatório.";
    if (!form.segment) return "Selecione o segmento.";
    if (form.createAccount) {
      if (form.password.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
      if (form.password !== form.passwordConfirm) return "As senhas não coincidem.";
    }
    return null;
  };

  const handleSubmit = async () => {
    if (items.length === 0) { toast.error(tr("cart.error", lang)); return; }
    const err = validate();
    if (err) { toast.error(err); return; }

    setSubmitting(true);
    let authUserId: string | null = user?.id || null;

    // Optional signup
    if (!user && form.createAccount) {
      const { data: signed, error: signErr } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { emailRedirectTo: window.location.origin + "/minhas-cotacoes" },
      });
      if (signErr) { setSubmitting(false); toast.error("Erro ao criar conta: " + signErr.message); return; }
      authUserId = signed.user?.id || null;
    }

    const customerPayload = {
      contact_name: form.name,
      email: form.email,
      phone: form.phone,
      document: form.document,
      document_type: form.documentType,
      legal_name: form.legal_name,
      trade_name: form.trade_name,
      state_registration: form.state_registration,
      address: {
        zip: form.zip, street: form.street, number: form.number, complement: form.complement,
        district: form.district, city: form.city, state: form.state, country: form.country,
      },
      segment: form.segment,
      interest_models: form.interest_models.split(",").map(s => s.trim()).filter(Boolean),
    };

    const utm = getUtm();
    track.beginCheckout(items as any);

    // Upsert customer
    let customerId: string | null = null;
    const { data: existing } = await supabase.from("customers").select("id").eq("email", form.email).maybeSingle();
    const customerRow: any = {
      name: form.name, email: form.email, phone: form.phone, cnpj_cpf: form.document,
      company: form.trade_name || form.legal_name || null,
      legal_name: form.legal_name || null, trade_name: form.trade_name || null, state_registration: form.state_registration || null,
      address_zip: form.zip, address_street: form.street, address_number: form.number,
      address_complement: form.complement, address_district: form.district,
      address_city: form.city, address_state: form.state, country: form.country,
      city: form.city, state: form.state, segment: form.segment, source: "portal",
    };
    if (existing) {
      await supabase.from("customers").update(customerRow).eq("id", existing.id);
      customerId = existing.id;
    } else {
      const { data: created } = await supabase.from("customers").insert(customerRow).select("id").single();
      customerId = created?.id || null;
    }

    const { data: quoteRow, error } = await supabase.from("quote_requests").insert({
      customer_name: form.name,
      company: form.trade_name || form.legal_name || null,
      cnpj_cpf: form.document,
      email: form.email,
      phone: form.phone,
      items: items.map(({ material, description, quantity }) => ({ material, description, quantity })),
      notes: form.notes || null,
      utm,
      auth_user_id: authUserId,
      customer_id: customerId,
      customer_payload: customerPayload,
      status: "pendente",
    } as any).select("id").single();
    setSubmitting(false);
    if (error) { toast.error(tr("cart.errorSend", lang) + ": " + error.message); return; }

    // Fire-and-forget notification to sales inbox
    supabase.functions.invoke("send-quote-notification", {
      body: {
        quote_id: quoteRow?.id,
        customer: { ...customerPayload, name: form.name },
        items: items.map(({ material, description, quantity }) => ({ material, description, quantity })),
        notes: form.notes || null,
      },
    }).catch((e) => console.warn("send-quote-notification failed", e));

    track.generateLead("quote", { items: items.length });
    trackServerConversion({ event: "quote_lead", email: form.email, phone: form.phone, utm } as any);
    setSubmitted(true);
  };

  const resetAll = () => {
    setSubmitted(false);
    setShowForm(false);
    setForm(emptyForm);
    onClear();
  };

  const f = form;
  const set = (k: keyof typeof form, v: any) => setForm(s => ({ ...s, [k]: v }));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground h-14 w-14 rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform">
          <ShoppingCart className="h-6 w-6" />
          {items.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center">
              {items.length}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            {tr("cart.title", lang)} ({items.length} {tr("cart.items", lang)})
          </SheetTitle>
        </SheetHeader>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
            <CheckCircle2 className="h-16 w-16 text-primary" />
            <h3 className="text-xl font-bold text-foreground">{tr("cart.sent", lang)}</h3>
            <p className="text-sm text-muted-foreground">{tr("cart.sentDesc", lang)}</p>
            {(user || form.createAccount) && (
              <Link to="/minhas-cotacoes"><Button variant="outline" className="gap-2"><User className="h-4 w-4" />Acompanhar cotação</Button></Link>
            )}
            <Button onClick={resetAll}>{tr("cart.new", lang)}</Button>
          </div>
        ) : showForm ? (
          <div className="space-y-4 mt-4">
            {!user && (
              <div className="text-xs bg-muted/50 border rounded p-2">
                Já tem conta? <Link to="/portal/login" className="text-primary font-semibold hover:underline">Entrar</Link> e seus dados serão preenchidos automaticamente.
              </div>
            )}

            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contato</h4>
              <div><Label>Nome completo *</Label><Input value={f.name} onChange={e => set("name", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>E-mail *</Label><Input type="email" value={f.email} onChange={e => set("email", e.target.value)} /></div>
                <div><Label>Telefone / WhatsApp *</Label><Input value={f.phone} onChange={e => set("phone", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Tipo *</Label>
                  <Select value={f.documentType} onValueChange={(v: any) => set("documentType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="CNPJ">CNPJ</SelectItem><SelectItem value="CPF">CPF</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label>{f.documentType} *</Label><Input value={f.document} onChange={e => set("document", e.target.value)} /></div>
              </div>
            </section>

            {f.documentType === "CNPJ" && (
              <section className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Empresa</h4>
                <div><Label>Razão social *</Label><Input value={f.legal_name} onChange={e => set("legal_name", e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Nome fantasia</Label><Input value={f.trade_name} onChange={e => set("trade_name", e.target.value)} /></div>
                  <div><Label>Inscrição estadual</Label><Input value={f.state_registration} onChange={e => set("state_registration", e.target.value)} /></div>
                </div>
              </section>
            )}

            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Endereço</h4>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>CEP *</Label><Input value={f.zip} onChange={e => set("zip", e.target.value)} onBlur={handleCepBlur} /></div>
                <div className="col-span-2"><Label>Rua *</Label><Input value={f.street} onChange={e => set("street", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Número *</Label><Input value={f.number} onChange={e => set("number", e.target.value)} /></div>
                <div className="col-span-2"><Label>Complemento</Label><Input value={f.complement} onChange={e => set("complement", e.target.value)} /></div>
              </div>
              <div><Label>Bairro</Label><Input value={f.district} onChange={e => set("district", e.target.value)} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2"><Label>Cidade *</Label><Input value={f.city} onChange={e => set("city", e.target.value)} /></div>
                <div><Label>UF *</Label><Input maxLength={2} value={f.state} onChange={e => set("state", e.target.value.toUpperCase())} /></div>
              </div>
              <div><Label>País</Label><Input value={f.country} onChange={e => set("country", e.target.value)} /></div>
            </section>

            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operação</h4>
              <div>
                <Label>Segmento *</Label>
                <Select value={f.segment} onValueChange={v => set("segment", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{SEGMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Modelos de interesse</Label>
                <Input placeholder="Ex.: XE215, GR215, separe por vírgula" value={f.interest_models} onChange={e => set("interest_models", e.target.value)} />
              </div>
              <div><Label>{tr("cart.notes", lang)}</Label><Textarea rows={3} value={f.notes} onChange={e => set("notes", e.target.value)} /></div>
            </section>

            {!user && (
              <section className="space-y-2 border-t pt-4">
                <label className="flex items-start gap-2 cursor-pointer">
                  <Checkbox checked={f.createAccount} onCheckedChange={v => set("createAccount", !!v)} />
                  <div>
                    <span className="text-sm font-semibold text-foreground">Criar conta para acompanhar minhas cotações</span>
                    <p className="text-xs text-muted-foreground">Você receberá atualizações de status e a proposta final em sua conta.</p>
                  </div>
                </label>
                {f.createAccount && (
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Senha *</Label><Input type="password" value={f.password} onChange={e => set("password", e.target.value)} /></div>
                    <div><Label>Confirmar *</Label><Input type="password" value={f.passwordConfirm} onChange={e => set("passwordConfirm", e.target.value)} /></div>
                  </div>
                )}
              </section>
            )}

            <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
              <Send className="h-4 w-4" /> {submitting ? tr("cart.sending", lang) : tr("cart.send", lang)}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setShowForm(false)}>{tr("cart.back", lang)}</Button>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {items.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">{tr("cart.empty", lang)}</p>
            ) : (
              <>
                {items.map(item => (
                  <div key={item.material} className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-muted-foreground">{item.material}</p>
                      <p className="text-sm text-foreground truncate">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onUpdateQty(item.material, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-7 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onUpdateQty(item.material, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(item.material)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button onClick={() => setShowForm(true)} className="w-full gap-2 mt-4">
                  <Send className="h-4 w-4" /> {tr("cart.submit", lang)}
                </Button>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
