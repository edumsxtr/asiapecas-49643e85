import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink, RefreshCw, Info, AlertTriangle, ShieldCheck, ShieldAlert, FileSearch } from "lucide-react";
import type { Customer } from "@/hooks/use-customers";
import { useEnrichCustomer, useVerifyCustomerSource } from "@/hooks/use-customers";
import { toast } from "sonner";

type Evidence = { source_url: string; source_excerpt: string };

type Enrichment = {
  official_name?: string | null;
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
  evidence?: Record<string, Evidence>;
  _note?: string;
};

const FIELD_LABELS: Record<string, string> = {
  official_name: "Razão social",
  cnpj_formatted: "CNPJ",
  cnae: "CNAE",
  company_size: "Porte",
  segment: "Setor",
  decision_maker_role: "Decisor típico",
  alt_phone: "Telefone alt.",
  full_address: "Endereço",
  website: "Site",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  commercial_notes: "Observações",
};

export function EnrichmentPanel({ customer }: { customer: Customer }) {
  const enrich = useEnrichCustomer();
  const verify = useVerifyCustomerSource();
  const data = (customer.enrichment_data || {}) as Enrichment;
  const isEnriched = customer.enrichment_status === "enriched";
  const sources = data.sources || [];
  const hasNoVerifiedSources = isEnriched && sources.length === 0;

  if (!isEnriched) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <Info className="h-10 w-10 mx-auto text-primary" />
          <div>
            <p className="font-semibold">Nenhuma informação carregada ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Buscamos páginas públicas reais para extrair dados verificados sobre {customer.company || customer.name}.
            </p>
          </div>
          <Button onClick={() => enrich.mutate(customer.id)} disabled={enrich.isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${enrich.isPending ? "animate-spin" : ""}`} />
            {enrich.isPending ? "Pesquisando…" : "Carregar informações"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const confColor = data.confidence === "high" ? "default" : data.confidence === "medium" ? "secondary" : "outline";

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Informações verificadas</span>
            <Badge variant={confColor as never} className="gap-1">
              {data.confidence === "high" ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
              Confiança: {data.confidence || "—"}
            </Badge>
            <Badge variant="outline">{sources.length} fonte(s) verificada(s)</Badge>
            {customer.enriched_at && (
              <span className="text-xs text-muted-foreground">
                · {new Date(customer.enriched_at).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => enrich.mutate(customer.id)} disabled={enrich.isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${enrich.isPending ? "animate-spin" : ""}`} />
            {enrich.isPending ? "Pesquisando…" : "Reverificar"}
          </Button>
        </div>

        {hasNoVerifiedSources && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Sem fontes públicas confirmadas</p>
                <p className="text-muted-foreground mt-1">
                  {data._note || "Não encontramos páginas públicas que mencionem esta empresa de forma verificável. Preencha os dados manualmente ou tente novamente mais tarde."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!hasNoVerifiedSources && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <EvidenceField label="Razão social" value={data.official_name} evidence={data.evidence?.official_name} />
            <EvidenceField label="CNPJ" value={data.cnpj_formatted} evidence={data.evidence?.cnpj_formatted} mono />
            <EvidenceField label="CNAE" value={data.cnae} evidence={data.evidence?.cnae} />
            <EvidenceField label="Porte" value={data.company_size} evidence={data.evidence?.company_size} />
            <EvidenceField label="Setor" value={data.segment} evidence={data.evidence?.segment} capitalize />
            <EvidenceField label="Decisor típico" value={data.decision_maker_role} evidence={data.evidence?.decision_maker_role} />
            <EvidenceField label="Telefone alt." value={data.alt_phone} evidence={data.evidence?.alt_phone} />
            <EvidenceField label="Endereço" value={data.full_address} evidence={data.evidence?.full_address} />
          </div>
        )}

        {data.commercial_notes && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Observações comerciais</p>
                {data.evidence?.commercial_notes && (
                  <EvidenceTooltip evidence={data.evidence.commercial_notes} />
                )}
              </div>
              <p className="text-sm">{data.commercial_notes}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          {data.website && <LinkBadge url={data.website} label="Site" />}
          {data.linkedin && <LinkBadge url={data.linkedin} label="LinkedIn" />}
          {data.instagram && <LinkBadge url={data.instagram} label="Instagram" />}
        </div>

        {sources.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Fontes verificadas</p>
            <div className="space-y-1">
              {sources.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <a href={s} target="_blank" rel="noopener noreferrer" className="flex-1 text-primary hover:underline truncate">
                    {s}
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    disabled={verify.isPending}
                    onClick={async () => {
                      const r = await verify.mutateAsync({ url: s, customer_name: customer.company || customer.name });
                      if (r.ok) toast.success("Fonte ainda contém o nome da empresa.");
                      else toast.warning("Fonte não confirma mais o nome do cliente.");
                    }}
                  >
                    <FileSearch className="h-3 w-3 mr-1" />
                    Reverificar
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

function EvidenceField({
  label, value, evidence, mono, capitalize,
}: { label: string; value?: string | null; evidence?: Evidence; mono?: boolean; capitalize?: boolean }) {
  const hasEvidence = !!evidence?.source_excerpt;
  return (
    <div className="border rounded-md p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        {hasEvidence && <EvidenceTooltip evidence={evidence!} />}
      </div>
      <p className={`text-sm mt-1 ${mono ? "font-mono" : ""} ${capitalize ? "capitalize" : ""}`}>
        {value || <span className="text-muted-foreground">—</span>}
      </p>
    </div>
  );
}

function EvidenceTooltip({ evidence }: { evidence: Evidence }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a href={evidence.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
          <ShieldCheck className="h-3 w-3" />
          fonte
        </a>
      </TooltipTrigger>
      <TooltipContent className="max-w-md">
        <p className="text-xs italic mb-1">"{evidence.source_excerpt}"</p>
        <p className="text-[10px] text-muted-foreground truncate">{evidence.source_url}</p>
      </TooltipContent>
    </Tooltip>
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
