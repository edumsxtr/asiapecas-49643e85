import { Link, useParams, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Database } from "lucide-react";
import { StockImportsTab } from "@/components/admin/sources/StockImportsTab";
import { CustomerImportsTab } from "@/components/admin/sources/CustomerImportsTab";
import { PartsBulkTab } from "@/components/admin/sources/PartsBulkTab";
import { ResearchCacheTab } from "@/components/admin/sources/ResearchCacheTab";

const SOURCES: Record<string, { title: string; subtitle: string; Component: () => JSX.Element }> = {
  estoque: { title: "Importações de Estoque", subtitle: "Histórico paginado com CRUD de metadados, reprocessamento e reversão.", Component: StockImportsTab },
  clientes: { title: "Importações de Clientes", subtitle: "Relatórios paginados das cargas de clientes.", Component: CustomerImportsTab },
  catalogo: { title: "Catálogo — Limpeza em Massa", subtitle: "Filtros para zerar estoque ou excluir peças em lote.", Component: PartsBulkTab },
  pesquisas: { title: "Cache de Pesquisas IA / Mercado", subtitle: "Inspecione e limpe o cache de pesquisas.", Component: ResearchCacheTab },
};

export default function SettingsSourceDetailPage() {
  const { tipo } = useParams<{ tipo: string }>();
  const entry = tipo ? SOURCES[tipo] : undefined;
  if (!entry) return <Navigate to="/configuracoes/fontes" replace />;
  const { title, subtitle, Component } = entry;

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/configuracoes">Configurações</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/configuracoes/fontes">Fontes de Dados</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{title}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </header>

        <Component />
      </div>
    </AppLayout>
  );
}
