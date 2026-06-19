import { InstitutionalLayout } from "@/components/layout/InstitutionalLayout";

export default function ShippingPage() {
  return (
    <InstitutionalLayout
      title="Entrega e Frete"
      description="Cobertura logística, prazos e modais de transporte praticados pela Ásia Peças & Máquinas."
      canonical="/entrega-e-frete"
      crumbs={[{ label: "Entrega e Frete" }]}
    >
      <h2 className="font-display text-xl font-semibold">Cobertura</h2>
      <p>
        Operamos em todo o território nacional e exportamos para Venezuela e Guiana. Para outros
        destinos da América Latina, condições logísticas são avaliadas caso a caso.
      </p>

      <h2 className="font-display text-xl font-semibold mt-6">Prazos</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Peças em estoque: separação e expedição em até 48 horas úteis.</li>
        <li>Entrega doméstica: 3 a 10 dias úteis, conforme região e modal escolhido.</li>
        <li>Importação sob demanda: prazo médio de 15 a 45 dias, sujeito a confirmação no momento da cotação.</li>
      </ul>

      <h2 className="font-display text-xl font-semibold mt-6">Modais</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Rodoviário (carga consolidada e fechada).</li>
        <li>Aéreo doméstico para urgências operacionais.</li>
        <li>Internacional aéreo e rodoviário para Venezuela e Guiana.</li>
      </ul>

      <h2 className="font-display text-xl font-semibold mt-6">Seguro e rastreamento</h2>
      <p>
        Toda carga acima de R$ 5.000 segue com seguro de transporte. O cliente recebe o código de
        rastreamento por e-mail ou WhatsApp logo após a expedição.
      </p>
    </InstitutionalLayout>
  );
}
