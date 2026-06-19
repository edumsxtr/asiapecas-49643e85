import { InstitutionalLayout } from "@/components/layout/InstitutionalLayout";

export default function AboutPage() {
  return (
    <InstitutionalLayout
      title="Sobre a Ásia Peças & Máquinas"
      description="Distribuidor autorizado de peças originais XCMG com atuação no Brasil, Venezuela e Guiana. Conheça a estrutura, missão e compromisso com a disponibilidade da frota."
      canonical="/sobre"
      crumbs={[{ label: "Sobre" }]}
    >
      <p>
        A Ásia Peças & Máquinas é especializada em peças originais e compatíveis para equipamentos
        XCMG aplicados em mineração, linha amarela, perfuração, guindastes e caminhões elétricos.
        Operamos em Boa Vista (RR) e atendemos clientes em todo o Brasil, na Venezuela e na Guiana,
        com foco em prazo, rastreabilidade e suporte técnico.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">Nossa missão</h2>
      <p>
        Manter a frota dos nossos clientes em operação. Trabalhamos com estoque real, processos de
        importação consolidados e atendimento técnico especializado para reduzir paradas não
        programadas e custos com manutenção corretiva.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">Estrutura</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>Centro de distribuição em Boa Vista (RR) com cobertura para a região Norte e países vizinhos.</li>
        <li>Equipe comercial bilíngue (português, espanhol e inglês) para operações de comércio exterior.</li>
        <li>Pesquisa técnica de compatibilidade apoiada por inteligência artificial.</li>
        <li>Catálogo digital com mais de cinco mil itens auditados.</li>
      </ul>

      <h2 className="font-display text-xl font-semibold mt-8">Compromisso</h2>
      <p>
        Atuamos como parceiros de longo prazo das operações de mineração e construção pesada. Cada
        cotação passa por verificação técnica antes do envio, e cada peça entregue carrega
        rastreabilidade de origem e garantia formal.
      </p>
    </InstitutionalLayout>
  );
}
