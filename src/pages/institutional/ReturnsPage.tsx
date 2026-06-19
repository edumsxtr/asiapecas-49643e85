import { InstitutionalLayout } from "@/components/layout/InstitutionalLayout";

export default function ReturnsPage() {
  return (
    <InstitutionalLayout
      title="Trocas e Devoluções"
      description="Condições, prazos e procedimentos para troca e devolução de peças adquiridas na Ásia Peças & Máquinas."
      canonical="/trocas-e-devolucoes"
      crumbs={[{ label: "Trocas e Devoluções" }]}
    >
      <h2 className="font-display text-xl font-semibold">Direito de arrependimento</h2>
      <p>
        Para pessoas físicas, em compras realizadas fora do estabelecimento comercial, é assegurado o
        prazo de 7 dias corridos para devolução, contados do recebimento, conforme o Código de
        Defesa do Consumidor.
      </p>

      <h2 className="font-display text-xl font-semibold mt-6">Trocas comerciais</h2>
      <p>
        Trocas decorrentes de divergência de aplicação ou erro de pedido podem ser realizadas em até
        30 dias da emissão da nota fiscal, desde que a peça esteja lacrada, sem indícios de uso e
        acompanhada da embalagem original.
      </p>

      <h2 className="font-display text-xl font-semibold mt-6">Procedimento</h2>
      <ol className="list-decimal pl-6 space-y-1">
        <li>Envie a solicitação para <a href="mailto:contato@asiapecas.com.br" className="text-primary hover:underline">contato@asiapecas.com.br</a> informando número da nota fiscal e motivo.</li>
        <li>Nossa equipe avalia em até 3 dias úteis e emite a autorização de logística reversa quando aplicável.</li>
        <li>Após o recebimento e inspeção da peça, o crédito é processado em até 10 dias úteis.</li>
      </ol>

      <h2 className="font-display text-xl font-semibold mt-6">Itens não elegíveis</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Peças sob encomenda ou customizadas.</li>
        <li>Itens com sinais de instalação ou uso.</li>
        <li>Componentes elétricos com lacre rompido.</li>
      </ul>
    </InstitutionalLayout>
  );
}
