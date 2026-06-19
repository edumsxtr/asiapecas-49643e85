import { InstitutionalLayout } from "@/components/layout/InstitutionalLayout";

export default function PrivacyPage() {
  return (
    <InstitutionalLayout
      title="Política de Privacidade"
      description="Como a Ásia Peças & Máquinas coleta, utiliza, armazena e protege dados pessoais em conformidade com a LGPD (Lei nº 13.709/2018)."
      canonical="/politica-de-privacidade"
      crumbs={[{ label: "Privacidade" }]}
    >
      <p>Última atualização: {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}.</p>

      <h2 className="font-display text-xl font-semibold mt-6">1. Controlador dos dados</h2>
      <p>
        A Ásia Peças & Máquinas é a controladora dos dados pessoais tratados em seus canais digitais.
        Dúvidas e solicitações devem ser encaminhadas para <a href="mailto:contato@asiapecas.com.br" className="text-primary hover:underline">contato@asiapecas.com.br</a>.
      </p>

      <h2 className="font-display text-xl font-semibold mt-6">2. Dados coletados</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Dados de identificação fornecidos voluntariamente em formulários (nome, e-mail, telefone, empresa).</li>
        <li>Informações de navegação e dispositivo coletadas por cookies estritamente necessários e de medição.</li>
        <li>Histórico de cotações e pedidos vinculados ao seu cadastro.</li>
      </ul>

      <h2 className="font-display text-xl font-semibold mt-6">3. Finalidades do tratamento</h2>
      <p>
        Utilizamos os dados para responder a cotações, executar contratos de fornecimento, emitir notas
        fiscais, prestar suporte técnico, atender obrigações legais e melhorar nossos serviços.
      </p>

      <h2 className="font-display text-xl font-semibold mt-6">4. Base legal</h2>
      <p>
        O tratamento é realizado com fundamento em execução de contrato, cumprimento de obrigação legal,
        legítimo interesse e consentimento, conforme o caso, em observância ao art. 7º da LGPD.
      </p>

      <h2 className="font-display text-xl font-semibold mt-6">5. Compartilhamento</h2>
      <p>
        Compartilhamos dados apenas com transportadoras, operadores logísticos, instituições financeiras
        e autoridades públicas quando necessário à execução do serviço ou à observância da lei.
      </p>

      <h2 className="font-display text-xl font-semibold mt-6">6. Direitos do titular</h2>
      <p>
        Você pode solicitar a confirmação da existência de tratamento, acesso, correção, anonimização,
        portabilidade, eliminação dos dados e revogação do consentimento por meio do e-mail indicado
        acima. A solicitação é atendida em até 15 dias úteis.
      </p>

      <h2 className="font-display text-xl font-semibold mt-6">7. Segurança</h2>
      <p>
        Adotamos controles técnicos e administrativos compatíveis com a sensibilidade dos dados,
        incluindo criptografia em trânsito, segregação de acessos e registros de auditoria.
      </p>

      <h2 className="font-display text-xl font-semibold mt-6">8. Retenção</h2>
      <p>
        Os dados são retidos pelo prazo necessário ao cumprimento das finalidades descritas e às
        obrigações legais aplicáveis, sendo descartados de forma segura após esse período.
      </p>
    </InstitutionalLayout>
  );
}
