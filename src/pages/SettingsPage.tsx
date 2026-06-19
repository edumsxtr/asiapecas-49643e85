import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Settings, Database, Users, ShoppingCart, FileText, Sparkles, Wrench, GraduationCap, ShieldCheck, Tags, TrendingUp, BarChart3, BookOpen,
} from "lucide-react";

type Section = {
  title: string;
  description: string;
  icon: any;
  to: string;
  badge?: string;
};

const sections: { group: string; items: Section[] }[] = [
  {
    group: "Dados & Importações",
    items: [
      { title: "Fontes de Dados", description: "Gerencie planilhas de estoque, clientes, catálogo e cache de pesquisas.", icon: Database, to: "/configuracoes/fontes" },
      { title: "Estoque", description: "Análise e relatórios da base de peças.", icon: TrendingUp, to: "/estoque" },
      { title: "Categorias", description: "Taxonomia de categorias e modelos.", icon: Tags, to: "/catalogo/categorias" },
    ],
  },
  {
    group: "Comercial",
    items: [
      { title: "Vendas", description: "Pedidos, propostas e status comercial.", icon: ShoppingCart, to: "/vendas" },
      { title: "Clientes", description: "Cadastro, contatos e equipamentos.", icon: Users, to: "/clientes" },
      { title: "Templates de Proposta", description: "Pagamento, garantia e identidade visual.", icon: FileText, to: "/vendas?config=1" },
    ],
  },
  {
    group: "Operação & Conteúdo",
    items: [
      { title: "Blog", description: "Posts SEO com geração por IA. Apareça melhor no Google.", icon: BookOpen, to: "/configuracoes/blog" },
      { title: "Banners e Vitrine", description: "Banners do hero, coleções em destaque e SEO do portal público.", icon: Sparkles, to: "/configuracoes/banners" },
      { title: "Manutenção", description: "Planos de manutenção por máquina.", icon: Wrench, to: "/manutencao" },
      { title: "Relatório Executivo", description: "Indicadores consolidados.", icon: BarChart3, to: "/relatorio" },
    ],
  },
  {
    group: "Segurança",
    items: [
      { title: "Usuários & Permissões", description: "Em breve — gestão de papéis e acessos.", icon: ShieldCheck, to: "/configuracoes" },
    ],
  },
];

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <header className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Configurações</h1>
            <p className="text-sm text-muted-foreground">Hub central para gerenciar dados, comercial, conteúdo e segurança.</p>
          </div>
        </header>

        {sections.map((s) => (
          <section key={s.group} className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{s.group}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {s.items.map((item) => (
                <Link key={item.title} to={item.to} className="group">
                  <Card className="h-full transition-colors hover:border-primary/40 hover:shadow-sm">
                    <CardHeader className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
                          <item.icon className="h-4 w-4 text-primary" />
                        </div>
                        <CardTitle className="text-base group-hover:text-primary transition-colors">{item.title}</CardTitle>
                      </div>
                      <CardDescription className="text-xs">{item.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppLayout>
  );
}
