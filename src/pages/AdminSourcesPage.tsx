import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockImportsTab } from "@/components/admin/sources/StockImportsTab";
import { CustomerImportsTab } from "@/components/admin/sources/CustomerImportsTab";
import { PartsBulkTab } from "@/components/admin/sources/PartsBulkTab";
import { ResearchCacheTab } from "@/components/admin/sources/ResearchCacheTab";
import { Database } from "lucide-react";

export default function AdminSourcesPage() {
  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <header className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Fontes de Dados</h1>
            <p className="text-sm text-muted-foreground">Gerencie planilhas, importações e caches que alimentam o sistema.</p>
          </div>
        </header>

        <Tabs defaultValue="stock">
          <TabsList>
            <TabsTrigger value="stock">Estoque</TabsTrigger>
            <TabsTrigger value="customers">Clientes</TabsTrigger>
            <TabsTrigger value="parts">Catálogo</TabsTrigger>
            <TabsTrigger value="research">Pesquisas IA/Mercado</TabsTrigger>
          </TabsList>
          <TabsContent value="stock" className="mt-4"><StockImportsTab /></TabsContent>
          <TabsContent value="customers" className="mt-4"><CustomerImportsTab /></TabsContent>
          <TabsContent value="parts" className="mt-4"><PartsBulkTab /></TabsContent>
          <TabsContent value="research" className="mt-4"><ResearchCacheTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
