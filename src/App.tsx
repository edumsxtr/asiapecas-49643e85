import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import CatalogPage from "./pages/CatalogPage";
import StockPage from "./pages/StockPage";
import CustomersPage from "./pages/CustomersPage";
import SalesPage from "./pages/SalesPage";
import AfterSalesPage from "./pages/AfterSalesPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import MarketResearchPage from "./pages/MarketResearchPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/catalogo" element={<CatalogPage />} />
          <Route path="/estoque" element={<StockPage />} />
          <Route path="/clientes" element={<CustomersPage />} />
          <Route path="/vendas" element={<SalesPage />} />
          <Route path="/pos-venda" element={<AfterSalesPage />} />
          <Route path="/pesquisa-mercado" element={<MarketResearchPage />} />
          <Route path="/assistente" element={<ComingSoonPage title="IA Assistente" />} />
          <Route path="/configuracoes" element={<ComingSoonPage title="Configurações" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
