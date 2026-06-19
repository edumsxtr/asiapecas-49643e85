import { InstitutionalLayout } from "@/components/layout/InstitutionalLayout";

export default function WarrantyPage() {
  return (
    <InstitutionalLayout
      title="Política de Garantia"
      description="Cobertura, prazos e procedimentos para acionamento de garantia das peças comercializadas pela Ásia Peças & Máquinas."
      canonical="/garantia"
      crumbs={[{ label: "Garantia" }]}
    >
      <h2 className="font-display text-xl font-semibold">Cobertura</h2>
      <p>
        Todas as peças originais XCMG comercializadas pela Ásia Peças & Máquinas contam com garantia
        contra defeitos de fabricação, observadas as condições de aplicação e manutenção
        recomendadas pelo fabricante.
      </p>

      <h2 className="font-display text-xl font-semibold mt-6">Prazos</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Peças de desgaste: 90 dias a contar da emissão da nota fiscal.</li>
        <li>Componentes hidráulicos, elétricos e estruturais: 6 meses ou 1.000 horas de operação, o que ocorrer primeiro.</li>
        <li>Itens com garantia estendida do fabricante: prazo conforme contrato específico.</li>
      </ul>

      <h2 className="font-display text-xl font-semibold mt-6">Acionamento</h2>
      <p>
        A abertura do chamado deve ser feita pelo e-mail <a href="mailto:contato@asiapecas.com.br" className="text-primary hover:underline">contato@asiapecas.com.br</a>
        contendo nota fiscal, descrição do defeito, fotos e número de série do equipamento.
        Nossa equipe técnica analisa o caso em até 5 dias úteis.
      </p>

      <h2 className="font-display text-xl font-semibold mt-6">Exclusões</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Aplicação incorreta da peça ou em equipamentos não homologados.</li>
        <li>Falta de manutenção preventiva ou uso de fluidos fora de especificação.</li>
        <li>Violação, reparo por terceiros não autorizados ou avarias por agentes externos.</li>
      </ul>
    </InstitutionalLayout>
  );
}
