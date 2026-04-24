import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw, Info } from "lucide-react";
import type { Customer } from "@/hooks/use-customers";
import { useEnrichCustomer } from "@/hooks/use-customers";

type Enrichment = {
  official_name?: string;
  cnpj_formatted?: string | null;
  cnae?: string | null;
  company_size?: string | null;
  segment?: string;
  website?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
  alt_phone?: string | null;
  full_address?: string | null;
  decision_maker_role?: string | null;
  commercial_notes?: string | null;
  confidence?: "high" | "medium" | "low";
  sources?: string[];
};

export function EnrichmentPanel({ customer }: { customer: Customer }) {
  const enrich = useEnrichCustomer();
  const data = (customer.enrichment_data || {}) as Enrichment;
  const isEnriched = customer.enrichment_status === "enriched";

  if (!isEnriched) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <Info className="h-10 w-10 mx-auto text-primary" />
          <div>
            <p className="font-semibold">Nenhuma informação carregada ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Buscar CNPJ, CNAE, porte, redes sociais e mais sobre {customer.name}
            </p>
          </div>
          <Button onClick={() => enrich.mutate(customer.id)} disabled={enrich.isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${enrich.isPending ? "animate-spin" : ""}`} />
            {enrich.isPending ? "Carregando…" : "Carregar informações"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const confColor = data.confidence === "high" ? "default" : data.confidence === "medium" ? "secondary" : "outline";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Informações complementares</span>
          <Badge variant={confColor as never}>Confiança: {data.confidence || "—"}</Badge>
          {customer.enriched_at && (
            <span className="text-xs text-muted-foreground">
              · {new Date(customer.enriched_at).toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => enrich.mutate(customer.id)} disabled={enrich.isPending}>
          <RefreshCw className={`h-4 w-4 mr-2 ${enrich.isPending ? "animate-spin" : ""}`} />
          Atualizar informações
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Razão social" value={data.official_name} />
        <Field label="CNPJ" value={data.cnpj_formatted} mono />
        <Field label="CNAE" value={data.cnae} />
        <Field label="Porte" value={data.company_size} />
        <Field label="Setor" value={data.segment} capitalize />
        <Field label="Decisor típico" value={data.decision_maker_role} />
        <Field label="Telefone alt." value={data.alt_phone} />
        <Field label="Endereço" value={data.full_address} />
      </div>

      {data.commercial_notes && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Observações comerciais</p>
            <p className="text-sm">{data.commercial_notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {data.website && <LinkBadge url={data.website} label="Site" />}
        {data.linkedin && <LinkBadge url={data.linkedin} label="LinkedIn" />}
        {data.instagram && <LinkBadge url={data.instagram} label="Instagram" />}
      </div>

      {data.sources && data.sources.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Fontes consultadas</p>
          <div className="space-y-1">
            {data.sources.map((s, i) => (
              <a key={i} href={s} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary hover:underline truncate">
                {s}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono, capitalize }: { label: string; value?: string | null; mono?: boolean; capitalize?: boolean }) {
  return (
    <div className="border rounded-md p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-sm mt-1 ${mono ? "font-mono" : ""} ${capitalize ? "capitalize" : ""}`}>{value || "—"}</p>
    </div>
  );
}

function LinkBadge({ url, label }: { url: string; label: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <Badge variant="outline" className="gap-1 hover:bg-accent">
        <ExternalLink className="h-3 w-3" />
        {label}
      </Badge>
    </a>
  );
}
