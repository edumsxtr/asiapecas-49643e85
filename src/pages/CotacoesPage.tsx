import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import { KanbanBoard } from "@/components/cotacoes/KanbanBoard";
import { DashboardCotacoes } from "@/components/cotacoes/DashboardCotacoes";
import { HistoricoPNPanel } from "@/components/cotacoes/HistoricoPNPanel";
import { NovaCotacaoDialog } from "@/components/cotacoes/NovaCotacaoDialog";
import { BuscaGlobalPN } from "@/components/cotacoes/BuscaGlobalPN";
import { useNavigate } from "react-router-dom";

export default function CotacoesPage() {
  const [nova, setNova] = useState(false);
  const [busca, setBusca] = useState(false);
  const nav = useNavigate();

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold">Cotações</h1>
            <p className="text-sm text-muted-foreground">Pipeline de cotações XCMG · atendimento rápido</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBusca(true)}>
              <Search className="h-4 w-4 mr-1" /> Buscar PN
            </Button>
            <Button onClick={() => setNova(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nova cotação
            </Button>
          </div>
        </div>

        <Tabs defaultValue="kanban">
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="historico">Histórico por PN</TabsTrigger>
          </TabsList>
          <TabsContent value="kanban" className="mt-4"><KanbanBoard /></TabsContent>
          <TabsContent value="dashboard" className="mt-4"><DashboardCotacoes /></TabsContent>
          <TabsContent value="historico" className="mt-4"><HistoricoPNPanel /></TabsContent>
        </Tabs>

        <NovaCotacaoDialog open={nova} onOpenChange={setNova} onCreated={(id) => nav(`/cotacoes/${id}`)} />
        <BuscaGlobalPN open={busca} onOpenChange={setBusca} />
      </div>
    </AppLayout>
  );
}
