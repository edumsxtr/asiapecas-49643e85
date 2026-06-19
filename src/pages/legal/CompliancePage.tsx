import LegalPageShell from "@/components/legal/LegalPageShell";

export default function CompliancePage() {
  return (
    <LegalPageShell
      title="Segurança e Compliance | Ásia Peças & Máquinas"
      description="Práticas de segurança da informação, conformidade legal e canal de denúncias da Ásia Peças & Máquinas. Conduta ética e prevenção a fraudes."
      canonical="/seguranca-e-compliance"
      updatedAt="19 de junho de 2026"
    >
      <p>
        A Ásia Peças &amp; Máquinas atua com observância às leis vigentes nos países em que opera, com compromisso explícito de
        integridade, transparência e proteção de dados pessoais e de informações sensíveis de clientes e parceiros.
      </p>

      <h2>1. Segurança da informação</h2>
      <ul>
        <li>Comunicação em trânsito criptografada (HTTPS/TLS).</li>
        <li>Controle de acesso por papéis e princípio do menor privilégio.</li>
        <li>Segregação de ambientes de produção, homologação e análise.</li>
        <li>Monitoramento contínuo de eventos relevantes.</li>
      </ul>

      <h2>2. Proteção de dados pessoais</h2>
      <p>
        O tratamento de dados pessoais segue a <a href="/politica-de-privacidade">Política de Privacidade</a>, em conformidade com
        a LGPD. Solicitações de titulares são respondidas pelo encarregado de dados via
        <a href="mailto:contato@asiapecas.com.br"> contato@asiapecas.com.br</a>.
      </p>

      <h2>3. Prevenção a fraudes</h2>
      <p>
        Recomendamos validar dados bancários e fiscais sempre por canais oficiais. A Ásia Peças &amp; Máquinas não solicita
        pagamentos em contas pessoais e não altera dados bancários por meio de mensagens informais. Em caso de dúvida,
        confirme pelo telefone +55 (95) 9 7400-9289 antes de qualquer transferência.
      </p>

      <h2>4. Conduta comercial</h2>
      <p>
        Repudiamos qualquer prática de corrupção, conflito de interesses, concorrência desleal ou violação de direitos humanos.
        Esperamos a mesma postura de fornecedores, parceiros e clientes.
      </p>

      <h2>5. Canal de denúncias</h2>
      <p>
        Relatos sobre suspeitas de fraude, assédio, conduta inadequada ou descumprimento de obrigações legais podem ser enviados
        para <a href="mailto:contato@asiapecas.com.br">contato@asiapecas.com.br</a>, com o assunto "Canal de denúncias". O
        sigilo é preservado e não toleramos retaliação contra denunciantes de boa-fé.
      </p>

      <h2>6. Continuidade e incidentes</h2>
      <p>
        Em caso de incidente de segurança com impacto sobre dados pessoais, comunicamos titulares e autoridades competentes
        conforme exigido pela legislação aplicável e adotamos medidas para mitigar efeitos e prevenir recorrência.
      </p>

      <h2>7. Atualizações</h2>
      <p>
        Esta página é revisada periodicamente. A versão vigente é sempre a publicada aqui, com indicação da data da última
        atualização.
      </p>
    </LegalPageShell>
  );
}
