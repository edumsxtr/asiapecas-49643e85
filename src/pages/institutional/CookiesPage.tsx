import { InstitutionalLayout } from "@/components/layout/InstitutionalLayout";

export default function CookiesPage() {
  return (
    <InstitutionalLayout
      title="Política de Cookies"
      description="Categorias de cookies utilizados pelo portal da Ásia Peças & Máquinas, finalidades e formas de gerenciamento."
      canonical="/politica-de-cookies"
      crumbs={[{ label: "Cookies" }]}
    >
      <p>
        Cookies são pequenos arquivos de texto armazenados pelo navegador quando você visita um site.
        Eles ajudam a manter a sessão, lembrar preferências e medir o desempenho do portal.
      </p>

      <h2 className="font-display text-xl font-semibold mt-6">Categorias utilizadas</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Estritamente necessários:</strong> sustentam o funcionamento do carrinho de cotação, autenticação e segurança. Não podem ser desativados.</li>
        <li><strong>Desempenho:</strong> medem páginas mais acessadas e tempo de carregamento, de forma agregada e anônima.</li>
        <li><strong>Funcionais:</strong> guardam idioma, filtros e preferências de exibição.</li>
      </ul>

      <h2 className="font-display text-xl font-semibold mt-6">Gerenciamento</h2>
      <p>
        Você pode aceitar ou recusar o uso de cookies não essenciais por meio do banner de
        consentimento exibido no primeiro acesso. As configurações do navegador também permitem
        bloquear ou apagar cookies a qualquer tempo, ressaltando que a desativação pode afetar a
        experiência de navegação.
      </p>

      <h2 className="font-display text-xl font-semibold mt-6">Atualizações</h2>
      <p>
        Esta política pode ser atualizada periodicamente para refletir mudanças tecnológicas ou
        legais. A data da última revisão será sempre exibida na parte superior do documento.
      </p>
    </InstitutionalLayout>
  );
}
