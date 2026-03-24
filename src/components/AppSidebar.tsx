import {
  LayoutDashboard,
  Package,
  Users,
  MessageSquare,
  ShoppingCart,
  Settings,
  TrendingUp,
  Truck,
  Search,
  ClipboardList,
  Radar,
  FileBarChart,
  FileText,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import eliteLogo from "@/assets/elite-logo.png";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Catálogo", url: "/catalogo", icon: Package },
  { title: "Estoque", url: "/estoque", icon: TrendingUp },
];

const crmItems = [
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Vendas", url: "/vendas", icon: ShoppingCart },
  { title: "Novo Pedido", url: "/pedidos/novo", icon: ClipboardList },
  { title: "Prospecção", url: "/prospeccao", icon: Radar },
  { title: "Pós-Venda", url: "/pos-venda", icon: Truck },
];

const toolItems = [
  { title: "Pesquisa de Mercado", url: "/pesquisa-mercado", icon: Search },
  { title: "Relatório Executivo", url: "/relatorio", icon: FileBarChart },
  { title: "Portal do Cliente", url: "/cotacao", icon: FileText },
  { title: "IA Assistente", url: "/assistente", icon: MessageSquare },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const renderItems = (items: typeof mainItems) =>
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end={item.url === "/"}
            className="hover:bg-sidebar-accent/50 transition-colors"
            activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
          >
            <item.icon className="mr-2 h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <div className="flex items-center gap-3">
          <img src={eliteLogo} alt="Elite Peças XCMG" className="h-9 w-auto rounded-lg shrink-0" />
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-display font-bold text-sm text-sidebar-foreground truncate">
                Elite Peças XCMG
              </p>
              <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">
                Distribuidor XCMG
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest">
            Comercial
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(crmItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest">
            Ferramentas
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(toolItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
        {!collapsed && (
          <p className="text-[10px] text-sidebar-foreground/30">
            v1.0 · Fase 1
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
