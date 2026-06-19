import LegalPageShell from "@/components/legal/LegalPageShell";

export default function AboutPage() {
  return (
    <LegalPageShell
      title="Sobre a Ásia Peças & Máquinas | Distribuidor Autorizado XCMG"
      description="Conheça a Ásia Peças & Máquinas: distribuidor autorizado de peças originais XCMG com atuação no Brasil, Venezuela e Guiana para mineração, construção e linha pesada."
      canonical="/sobre"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: "Sobre a Ásia Peças & Máquinas",
        url: "https://asiapecas.lovable.app/sobre",
        about: {
          "@type": "Organization",
          name: "Ásia Peças & Máquinas",
          areaServed: ["BR", "VE", "GY"],
          knowsAbout: ["Peças XCMG", "Mineração", "Linha amarela", "Perfuratrizes", "Guindastes", "Caminhões fora de estrada"],
        },
      }}
    >
      <p>
        A Ásia Peças &amp; Máquinas é uma distribuidora especializada em peças originais XCMG, com atuação consolidada no Brasil,
        Venezuela e Guiana. Atendemos operações de mineração, linha amarela, perfuração, içamento e transporte pesado, oferecendo
        peças de reposição, suporte técnico e gestão de pós-venda para frotas de pequeno, médio e grande porte.
      </p>

      <h2>Quem somos</h2>
      <p>
        Atuamos como elo entre a fabricante XCMG e operações industriais da América Latina. Nossa equipe combina experiência em
        comércio internacional, logística aduaneira e engenharia de manutenção, garantindo que cada peça entregue chegue conforme
        especificação técnica e dentro do prazo acordado.
      </p>

      <h2>O que fazemos</h2>
      <ul>
        <li>Comercialização de peças originais XCMG para escavadeiras, carregadeiras, motoniveladoras, rolos compactadores, guindastes, perfuratrizes e caminhões fora de estrada.</li>
        <li>Cotações técnicas com identificação por código, modelo e número de série.</li>
        <li>Apoio à manutenção preventiva e corretiva por meio de planos por máquina.</li>
        <li>Logística internacional para operações no Brasil, Venezuela e Guiana.</li>
        <li>Atendimento consultivo a frotas, mineradoras, construtoras e revendas.</li>
      </ul>

      <h2>Por que peças originais</h2>
      <p>
        Peças originais XCMG são fabricadas sob os mesmos padrões dimensionais, metalúrgicos e de tolerância utilizados na linha de
        montagem. Isso preserva a garantia da máquina, a segurança operacional e o desempenho previsto em catálogo, reduzindo
        retrabalho, paradas não programadas e custo total de propriedade.
      </p>

      <h2>Compromisso com a operação do cliente</h2>
      <p>
        Disponibilidade, rastreabilidade e tempo de resposta são pilares do nosso atendimento. Cada cotação é trabalhada por um
        consultor que acompanha o pedido do orçamento à entrega, com canal direto via WhatsApp e e-mail corporativo.
      </p>

      <h2>Atuação geográfica</h2>
      <p>
        Operamos a partir do Brasil com capilaridade para Venezuela e Guiana. Embarques internacionais são organizados conforme os
        requisitos documentais de cada país, com suporte a Incoterms compatíveis com a necessidade do cliente.
      </p>

      <h2>Fale com a equipe comercial</h2>
      <p>
        Para abrir uma cotação ou conhecer nossas condições corporativas, entre em contato pelo e-mail
        <a href="mailto:vendas@asiapecas.com"> vendas@asiapecas.com</a> ou pelo telefone (31) 99229-3767.
      </p>
    </LegalPageShell>
  );
}
