import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { captureUtm } from "@/lib/utm";
import { initAnalytics } from "@/lib/analytics";

// Home — eager (entrada principal / LCP)
import QuotePage from "./pages/QuotePage";

// Demais páginas — lazy (cada rota vira um chunk separado)
const PartsPage = lazy(() => import("./pages/PartsPage"));
const ModelsIndexPage = lazy(() => import("./pages/ModelsIndexPage"));
const MachineModelPage = lazy(() => import("./pages/MachineModelPage"));
const VitrinePage = lazy(() => import("./pages/portal/VitrinePage"));
const PartDetailPublicPage = lazy(() => import("./pages/PartDetailPublicPage"));
const CategoryPublicPage = lazy(() => import("./pages/CategoryPublicPage"));
const ModelPublicPage = lazy(() => import("./pages/ModelPublicPage"));
const BlogIndexPage = lazy(() => import("./pages/BlogIndexPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const BannersPage = lazy(() => import("./pages/portal/BannersPage"));
const PortalLoginPage = lazy(() => import("./pages/portal/PortalLoginPage"));
const PortalSignupPage = lazy(() => import("./pages/portal/PortalSignupPage"));
const MyQuotesPage = lazy(() => import("./pages/portal/MyQuotesPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Institucional / legal — lazy
const AboutPage = lazy(() => import("./pages/legal/AboutPage"));
const ContactPage = lazy(() => import("./pages/legal/ContactPage"));
const PrivacyPage = lazy(() => import("./pages/legal/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/legal/TermsPage"));
const CookiesPage = lazy(() => import("./pages/legal/CookiesPage"));
const WarrantyPage = lazy(() => import("./pages/legal/WarrantyPage"));
const ReturnsPage = lazy(() => import("./pages/legal/ReturnsPage"));
const CompliancePage = lazy(() => import("./pages/legal/CompliancePage"));

// Painel interno — lazy (recharts, jspdf, xlsx ficam fora do bundle público)
const Index = lazy(() => import("./pages/Index"));
const CatalogPage = lazy(() => import("./pages/CatalogPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const StockPage = lazy(() => import("./pages/StockPage"));
const CustomersPage = lazy(() => import("./pages/CustomersPage"));
const CustomerDetailPage = lazy(() => import("./pages/CustomerDetailPage"));
const SalesPage = lazy(() => import("./pages/SalesPage"));
const AfterSalesPage = lazy(() => import("./pages/AfterSalesPage"));
const MarketResearchPage = lazy(() => import("./pages/MarketResearchPage"));
const AssistantPage = lazy(() => import("./pages/AssistantPage"));
const NewOrderPage = lazy(() => import("./pages/NewOrderPage"));
const ProspectionPage = lazy(() => import("./pages/ProspectionPage"));
const ReportPage = lazy(() => import("./pages/ReportPage"));
const AdminVitrinePage = lazy(() => import("./pages/AdminVitrinePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const SettingsSourcesPage = lazy(() => import("./pages/settings/SettingsSourcesPage"));
const SettingsSourceDetailPage = lazy(() => import("./pages/settings/SettingsSourceDetailPage"));
const SettingsBlogPage = lazy(() => import("./pages/settings/SettingsBlogPage"));
const TrainingPage = lazy(() => import("./pages/TrainingPage"));
const MaintenancePage = lazy(() => import("./pages/MaintenancePage"));
const CotacoesPage = lazy(() => import("./pages/CotacoesPage"));
const CotacaoDetailPage = lazy(() => import("./pages/CotacaoDetailPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

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
            <Suspense fallback={<PageFallback />}>
            <Routes>
              {/* Public routes — root is the customer portal */}
              <Route path="/" element={<QuotePage />} />
              <Route path="/pecas" element={<PartsPage />} />
              <Route path="/maquinas" element={<ModelsIndexPage />} />
              <Route path="/maquinas/:categoria/:slug" element={<MachineModelPage />} />
              <Route path="/catalogos" element={<VitrinePage />} />
              <Route path="/cotacao" element={<Navigate to="/" replace />} />
              <Route path="/cotacao/banners" element={<BannersPage />} />
              {/* Redirects das URLs antigas → URLs limpas */}
              <Route path="/cotacao/vitrine" element={<Navigate to="/catalogos" replace />} />
              <Route path="/cotacao/categorias" element={<Navigate to="/pecas" replace />} />
              <Route path="/cotacao/modelos" element={<Navigate to="/maquinas" replace />} />
              <Route path="/cotacao/c/:slug" element={<CategoryPublicPage />} />
              <Route path="/cotacao/m/:slug" element={<ModelPublicPage />} />
              <Route path="/cotacao/p/:material" element={<PartDetailPublicPage />} />
              <Route path="/blog" element={<BlogIndexPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/portal/login" element={<PortalLoginPage />} />
              <Route path="/portal/cadastro" element={<PortalSignupPage />} />
              <Route path="/minhas-cotacoes" element={<MyQuotesPage />} />

              {/* Institutional & legal */}
              <Route path="/sobre" element={<AboutPage />} />
              <Route path="/contato" element={<ContactPage />} />
              <Route path="/politica-de-privacidade" element={<PrivacyPage />} />
              <Route path="/termos-de-uso" element={<TermsPage />} />
              <Route path="/politica-de-cookies" element={<CookiesPage />} />
              <Route path="/garantia" element={<WarrantyPage />} />
              <Route path="/trocas-e-devolucoes" element={<ReturnsPage />} />
              <Route path="/seguranca-e-compliance" element={<CompliancePage />} />
              <Route path="/configuracoes/banners" element={<ProtectedRoute><AdminVitrinePage /></ProtectedRoute>} />

              {/* Internal dashboard (auth) */}
              <Route path="/painel" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/admin/vitrine" element={<ProtectedRoute><AdminVitrinePage /></ProtectedRoute>} />
              <Route path="/admin/fontes" element={<Navigate to="/configuracoes/fontes" replace />} />
              <Route path="/configuracoes" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/configuracoes/fontes" element={<ProtectedRoute><SettingsSourcesPage /></ProtectedRoute>} />
              <Route path="/configuracoes/fontes/:tipo" element={<ProtectedRoute><SettingsSourceDetailPage /></ProtectedRoute>} />
              <Route path="/configuracoes/blog" element={<ProtectedRoute><SettingsBlogPage /></ProtectedRoute>} />
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
              <Route path="/manutencao" element={<ProtectedRoute><MaintenancePage /></ProtectedRoute>} />
              <Route path="/cotacoes" element={<ProtectedRoute><CotacoesPage /></ProtectedRoute>} />
              <Route path="/cotacoes/:id" element={<ProtectedRoute><CotacaoDetailPage /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
