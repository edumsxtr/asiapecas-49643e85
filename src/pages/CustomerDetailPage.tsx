import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, MapPin, Building2, Sparkles } from "lucide-react";
import { useCustomerById, useCustomerEquipment, useCustomerInvoices } from "@/hooks/use-customers";
import { EnrichmentPanel } from "@/components/customers/EnrichmentPanel";
import { CustomerEquipmentTab } from "@/components/customers/CustomerEquipmentTab";
import { CustomerInvoicesTab } from "@/components/customers/CustomerInvoicesTab";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: customer, isLoading } = useCustomerById(id);
  const { data: equipment = [] } = useCustomerEquipment(id);
  const { data: invoices = [] } = useCustomerInvoices(id);

  if (isLoading) {
    return <AppLayout><div className="p-6 text-muted-foreground">Carregando…</div></AppLayout>;
  }
  if (!customer) {
    return <AppLayout><div className="p-6">Cliente não encontrado.</div></AppLayout>;
  }

  const totalInv = invoices.reduce((s, i) => s + i.total_value, 0);

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/clientes")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-bold">{customer.name}</h1>
            {customer.company && <p className="text-lg text-muted-foreground flex items-center gap-2 mt-1"><Building2 className="h-4 w-4" />{customer.company}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="capitalize">{customer.segment || "geral"}</Badge>
              {customer.relationship_status && <Badge variant="secondary" className="capitalize">{customer.relationship_status}</Badge>}
              {customer.enrichment_status === "enriched" && (
                <Badge className="gap-1"><Sparkles className="h-3 w-3" /> Enriquecido</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Total faturado</p>
            <p className="text-xl font-bold">R$ {totalInv.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Equipamentos</p>
            <p className="text-xl font-bold">{equipment.length}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Última visita</p>
            <p className="text-sm font-semibold">{customer.last_visit_at ? new Date(customer.last_visit_at).toLocaleDateString("pt-BR") : "—"}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Última proposta</p>
            <p className="text-sm font-semibold">{customer.last_proposal_at ? new Date(customer.last_proposal_at).toLocaleDateString("pt-BR") : "—"}</p>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Resumo</TabsTrigger>
            <TabsTrigger value="ai">Inteligência IA</TabsTrigger>
            <TabsTrigger value="equipment">Equipamentos ({equipment.length})</TabsTrigger>
            <TabsTrigger value="invoices">Faturamento SAP ({invoices.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 pt-4">
            <Card><CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Info icon={<Phone className="h-4 w-4" />} label="Telefone" value={customer.phone} />
              <Info icon={<Mail className="h-4 w-4" />} label="Email" value={customer.email} />
              <Info icon={<Building2 className="h-4 w-4" />} label="CNPJ/CPF" value={customer.cnpj_cpf} mono />
              <Info icon={<MapPin className="h-4 w-4" />} label="Localização" value={[customer.city, customer.state].filter(Boolean).join(" / ") || null} />
              <Info icon={<MapPin className="h-4 w-4" />} label="Endereço" value={customer.address} />
            </CardContent></Card>

            {customer.interest_models && customer.interest_models.length > 0 && (
              <Card><CardContent className="p-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Modelos de interesse</p>
                <div className="flex flex-wrap gap-2">
                  {customer.interest_models.map((m, i) => <Badge key={i} variant="secondary">{m}</Badge>)}
                </div>
              </CardContent></Card>
            )}

            {customer.notes && (
              <Card><CardContent className="p-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Observações</p>
                <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
              </CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="ai" className="pt-4">
            <EnrichmentPanel customer={customer} />
          </TabsContent>

          <TabsContent value="equipment" className="pt-4">
            <CustomerEquipmentTab customerId={customer.id} />
          </TabsContent>

          <TabsContent value="invoices" className="pt-4">
            <CustomerInvoicesTab customerId={customer.id} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function Info({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`text-sm ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
      </div>
    </div>
  );
}
