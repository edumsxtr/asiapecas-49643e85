import LegalPageShell from "@/components/legal/LegalPageShell";

export default function ContactPage() {
  return (
    <LegalPageShell
      title="Contato | Ásia Peças & Máquinas"
      description="Fale com a Ásia Peças & Máquinas. Atendimento comercial e técnico para peças XCMG no Brasil, Venezuela e Guiana. WhatsApp, e-mail e telefone direto."
      canonical="/contato"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: "Contato — Ásia Peças & Máquinas",
        url: "https://asiapecas.lovable.app/contato",
        mainEntity: {
          "@type": "Organization",
          name: "Ásia Peças & Máquinas",
          email: "contato@asiapecas.com.br",
          telephone: "+55-95-97400-9289",
          areaServed: ["BR", "VE", "GY"],
          contactPoint: [{
            "@type": "ContactPoint",
            telephone: "+55-95-97400-9289",
            contactType: "sales",
            availableLanguage: ["Portuguese", "Spanish", "English"],
          }],
        },
      }}
    >
      <p>
        A Ásia Peças &amp; Máquinas mantém atendimento comercial e técnico em horário comercial, com suporte multilíngue para
        clientes do Brasil, Venezuela e Guiana. Selecione o canal mais adequado ao seu pedido.
      </p>

      <h2>Atendimento comercial</h2>
      <ul>
        <li><strong>E-mail:</strong> <a href="mailto:contato@asiapecas.com.br">contato@asiapecas.com.br</a></li>
        <li><strong>Telefone e WhatsApp:</strong> <a href="https://wa.me/5595974009289">+55 (95) 9 7400-9289</a></li>
        <li><strong>Horário:</strong> segunda a sexta, das 08h às 18h (horário de Brasília).</li>
      </ul>

      <h2>Cotações</h2>
      <p>
        Para agilizar o orçamento, envie código da peça, modelo da máquina e número de série quando disponível. Acesse o portal
        público em <a href="/cotacao">/cotacao</a> para montar uma lista de itens diretamente do catálogo.
      </p>

      <h2>Pós-venda e garantia</h2>
      <p>
        Para acionamento de garantia, devoluções e suporte técnico, utilize o mesmo canal comercial informando o número do pedido
        e a nota fiscal correspondente. Consulte também nossas páginas de
        <a href="/garantia"> Garantia</a> e <a href="/trocas-e-devolucoes">Trocas e Devoluções</a>.
      </p>

      <h2>Endereço para correspondência</h2>
      <p>
        Endereço completo, CNPJ e dados fiscais são fornecidos mediante solicitação formal pelo e-mail comercial. Isso permite
        adequar a documentação ao país e ao regime tributário do cliente.
      </p>

      <h2>Imprensa e parcerias</h2>
      <p>
        Para propostas de parceria comercial, fornecimento, mídia e patrocínio, escreva para
        <a href="mailto:contato@asiapecas.com.br"> contato@asiapecas.com.br</a> identificando assunto e empresa.
      </p>
    </LegalPageShell>
  );
}
