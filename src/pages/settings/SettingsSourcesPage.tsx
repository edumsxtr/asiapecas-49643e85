import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Database, Package, Users, Layers, Brain, ChevronRight } from "lucide-react";

const sources = [
  { slug: "estoque", title: "Importações de Estoque", description: "Histórico de planilhas de estoque importadas. Edite metadados, reprocesse ou reverta.", icon: Package },
  { slug: "clientes", title: "Importações de Clientes", description: "Relatórios das importações da base de clientes.", icon: Users },
  { slug: "catalogo", title: "Catálogo (Limpeza em Massa)", description: "Filtros para zerar estoque ou excluir peças do catálogo em lote.", icon: Layers },
  { slug: "pesquisas", title: "Cache de Pesquisas IA / Mercado", description: "Limpeza de cache de pesquisa de mercado e compatibilidade IA.", icon: Brain },
];

export default function SettingsSourcesPage() {
  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/configuracoes">Configurações</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Fontes de Dados</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Fontes de Dados</h1>
            <p className="text-sm text-muted-foreground">Escolha uma fonte para gerenciar registros, paginação e CRUD.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sources.map((s) => (
            <Link key={s.slug} to={`/configuracoes/fontes/${s.slug}`} className="group">
              <Card className="h-full transition-colors hover:border-primary/40 hover:shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                        <s.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base group-hover:text-primary transition-colors">{s.title}</CardTitle>
                        <CardDescription className="text-xs mt-1">{s.description}</CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
