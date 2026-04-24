import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import CatalogPage from "./pages/CatalogPage";
import CategoriesPage from "./pages/CategoriesPage";
import StockPage from "./pages/StockPage";
import CustomersPage from "./pages/CustomersPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import SalesPage from "./pages/SalesPage";
import AfterSalesPage from "./pages/AfterSalesPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import MarketResearchPage from "./pages/MarketResearchPage";
import AssistantPage from "./pages/AssistantPage";
import NewOrderPage from "./pages/NewOrderPage";
import ProspectionPage from "./pages/ProspectionPage";
import ReportPage from "./pages/ReportPage";
import QuotePage from "./pages/QuotePage";
import PartDetailPublicPage from "./pages/PartDetailPublicPage";
import CategoryPublicPage from "./pages/CategoryPublicPage";
import ModelPublicPage from "./pages/ModelPublicPage";
import CategoriesIndexPage from "./pages/CategoriesIndexPage";
import ModelsIndexPage from "./pages/ModelsIndexPage";
import AdminVitrinePage from "./pages/AdminVitrinePage";
import TrainingPage from "./pages/TrainingPage";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { captureUtm } from "@/lib/utm";
import { initAnalytics } from "@/lib/analytics";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => { captureUtm(); initAnalytics(); }, []);
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/cotacao" element={<QuotePage />} />
              <Route path="/cotacao/categorias" element={<CategoriesIndexPage />} />
              <Route path="/cotacao/modelos" element={<ModelsIndexPage />} />
              <Route path="/cotacao/c/:slug" element={<CategoryPublicPage />} />
              <Route path="/cotacao/m/:slug" element={<ModelPublicPage />} />
              <Route path="/cotacao/p/:material" element={<PartDetailPublicPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected routes */}
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/admin/vitrine" element={<ProtectedRoute><AdminVitrinePage /></ProtectedRoute>} />
              <Route path="/catalogo" element={<ProtectedRoute><CatalogPage /></ProtectedRoute>} />
              <Route path="/catalogo/categorias" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
              <Route path="/estoque" element={<ProtectedRoute><StockPage /></ProtectedRoute>} />
              <Route path="/clientes" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
              <Route path="/clientes/:id" element={<ProtectedRoute><CustomerDetailPage /></ProtectedRoute>} />
              <Route path="/vendas" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
              <Route path="/pos-venda" element={<ProtectedRoute><AfterSalesPage /></ProtectedRoute>} />
              <Route path="/pedidos/novo" element={<ProtectedRoute><NewOrderPage /></ProtectedRoute>} />
              <Route path="/prospeccao" element={<ProtectedRoute><ProspectionPage /></ProtectedRoute>} />
              <Route path="/pesquisa-mercado" element={<ProtectedRoute><MarketResearchPage /></ProtectedRoute>} />
              <Route path="/assistente" element={<ProtectedRoute><AssistantPage /></ProtectedRoute>} />
              <Route path="/relatorio" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
              <Route path="/treinamento" element={<ProtectedRoute><TrainingPage /></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute><ComingSoonPage title="Configurações" /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
