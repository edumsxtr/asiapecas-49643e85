import { useState } from "react";
import { InstitutionalLayout } from "@/components/layout/InstitutionalLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, MapPin, Phone, Clock } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", notes: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error("Informe nome e e-mail para prosseguir.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("quote_requests").insert({
      customer_name: form.name,
      email: form.email,
      phone: form.phone,
      company: form.company,
      notes: `[CONTATO] ${form.notes}`,
      items: [],
      status: "pendente",
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível enviar a mensagem. Tente novamente.");
      return;
    }
    toast.success("Mensagem enviada. Nossa equipe entrará em contato.");
    setForm({ name: "", email: "", phone: "", company: "", notes: "" });
  };

  const localBusinessLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Ásia Peças & Máquinas",
    image: "https://asiapecas.lovable.app/logo.png",
    telephone: "+55-95-97400-9289",
    email: "contato@asiapecas.com.br",
    address: { "@type": "PostalAddress", addressLocality: "Boa Vista", addressRegion: "RR", addressCountry: "BR" },
    areaServed: ["BR", "VE", "GY"],
    url: "https://asiapecas.lovable.app/contato",
    openingHours: "Mo-Fr 08:00-18:00",
  };

  return (
    <InstitutionalLayout
      title="Fale com a Ásia Peças & Máquinas"
      description="Canais oficiais de atendimento comercial, suporte técnico e pós-venda. Resposta em até 24 horas úteis."
      canonical="/contato"
      crumbs={[{ label: "Contato" }]}
      jsonLd={localBusinessLd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 not-prose">
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold mb-2">Canais oficiais</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3"><Phone className="h-4 w-4 mt-0.5 text-primary" /><div><p className="font-medium">Telefone / WhatsApp</p><a href="tel:+5595974009289" className="text-muted-foreground hover:text-primary">(95) 9 7400-9289</a></div></li>
              <li className="flex items-start gap-3"><Mail className="h-4 w-4 mt-0.5 text-primary" /><div><p className="font-medium">E-mail</p><a href="mailto:contato@asiapecas.com.br" className="text-muted-foreground hover:text-primary">contato@asiapecas.com.br</a></div></li>
              <li className="flex items-start gap-3"><MapPin className="h-4 w-4 mt-0.5 text-primary" /><div><p className="font-medium">Endereço</p><p className="text-muted-foreground">Boa Vista — Roraima, Brasil</p></div></li>
              <li className="flex items-start gap-3"><Clock className="h-4 w-4 mt-0.5 text-primary" /><div><p className="font-medium">Atendimento comercial</p><p className="text-muted-foreground">Segunda a sexta, das 08h às 18h</p></div></li>
            </ul>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3 p-5 rounded-lg border bg-card">
          <h2 className="font-display text-lg font-semibold">Envie uma mensagem</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="n" className="text-xs">Nome</Label><Input id="n" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><Label htmlFor="e" className="text-xs">E-mail</Label><Input id="e" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            <div><Label htmlFor="p" className="text-xs">Telefone</Label><Input id="p" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label htmlFor="c" className="text-xs">Empresa</Label><Input id="c" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
          </div>
          <div><Label htmlFor="m" className="text-xs">Mensagem</Label><Textarea id="m" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <Button type="submit" disabled={loading} className="w-full">{loading ? "Enviando..." : "Enviar mensagem"}</Button>
        </form>
      </div>
    </InstitutionalLayout>
  );
}
