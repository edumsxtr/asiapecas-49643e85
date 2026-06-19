import LegalPageShell from "@/components/legal/LegalPageShell";

export default function CookiesPage() {
  return (
    <LegalPageShell
      title="Política de Cookies | Ásia Peças & Máquinas"
      description="Como a Ásia Peças & Máquinas utiliza cookies essenciais e de medição, como você pode gerenciar suas preferências e quais dados são coletados em cada categoria."
      canonical="/politica-de-cookies"
      updatedAt="19 de junho de 2026"
    >
      <p>
        Cookies são pequenos arquivos armazenados no dispositivo do usuário para permitir o funcionamento de páginas, lembrar
        preferências e medir o desempenho de conteúdos. Esta política descreve quais cookies utilizamos e como gerenciá-los.
      </p>

      <h2>1. Categorias utilizadas</h2>
      <ul>
        <li><strong>Essenciais:</strong> indispensáveis ao funcionamento do portal, como manutenção de sessão, segurança e carrinho de cotação. Não exigem consentimento.</li>
        <li><strong>Preferências:</strong> armazenam idioma escolhido e ajustes de exibição.</li>
        <li><strong>Medição e desempenho:</strong> permitem analisar páginas visitadas, tempo de permanência e origem do tráfego, sem identificar individualmente o usuário. Dependem de consentimento.</li>
      </ul>

      <h2>2. Consentimento</h2>
      <p>
        Ao acessar o portal pela primeira vez, é exibido um aviso permitindo aceitar ou recusar cookies não essenciais. A
        preferência fica armazenada no próprio dispositivo e pode ser alterada a qualquer momento, limpando os cookies do
        navegador ou ajustando suas configurações.
      </p>

      <h2>3. Cookies de terceiros</h2>
      <p>
        Eventuais serviços de medição operados por terceiros podem definir cookies próprios. Esses fornecedores tratam dados sob
        suas políticas e estão sujeitos a contratos que exigem aderência à LGPD.
      </p>

      <h2>4. Como gerenciar</h2>
      <p>
        Todos os navegadores modernos permitem visualizar, bloquear e excluir cookies. Desativar cookies essenciais pode prejudicar
        funcionalidades como envio de cotação ou troca de idioma.
      </p>

      <h2>5. Mais informações</h2>
      <p>
        Consulte a <a href="/politica-de-privacidade">Política de Privacidade</a> para detalhes sobre o tratamento de dados pessoais
        ou escreva para <a href="mailto:vendas@asiapecas.com">vendas@asiapecas.com</a>.
      </p>
    </LegalPageShell>
  );
}
