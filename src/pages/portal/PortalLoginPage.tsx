import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { SEO } from "@/lib/seo";
import asiaLogo from "@/assets/asia-logo.png";

export default function PortalLoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Bem-vindo de volta");
    navigate("/minhas-cotacoes");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEO title="Entrar | Portal do Cliente — Ásia Peças" description="Acesse sua conta para acompanhar suas cotações." canonical="/portal/login" />
      <Card className="w-full max-w-md">
        <CardContent className="p-8 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <img src={asiaLogo} alt="Ásia Peças" className="h-12 w-auto" />
            <h1 className="text-xl font-bold font-display">Acessar minha conta</h1>
            <p className="text-xs text-muted-foreground text-center">Acompanhe o status das suas cotações em tempo real.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>E-mail</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
            <div><Label>Senha</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
            <Button type="submit" disabled={loading} className="w-full">{loading ? "Entrando..." : "Entrar"}</Button>
          </form>
          <p className="text-xs text-center text-muted-foreground">
            Não tem conta? <Link to="/portal/cadastro" className="text-primary font-semibold hover:underline">Criar agora</Link>
          </p>
          <p className="text-xs text-center"><Link to="/cotacao" className="text-muted-foreground hover:text-foreground">Voltar ao portal</Link></p>
        </CardContent>
      </Card>
    </div>
  );
}
