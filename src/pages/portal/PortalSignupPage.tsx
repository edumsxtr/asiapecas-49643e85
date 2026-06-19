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

export default function PortalSignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Use no mínimo 8 caracteres.");
    if (password !== confirm) return toast.error("As senhas não coincidem.");
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Conta criada. Você já pode acessar suas cotações.");
    navigate("/minhas-cotacoes");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEO title="Criar conta | Portal do Cliente — Ásia Peças" description="Crie sua conta para acompanhar suas cotações e propostas." canonical="/portal/cadastro" />
      <Card className="w-full max-w-md">
        <CardContent className="p-8 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <img src={asiaLogo} alt="Ásia Peças" className="h-12 w-auto" />
            <h1 className="text-xl font-bold font-display">Criar conta</h1>
            <p className="text-xs text-muted-foreground text-center">Acompanhe propostas, histórico de cotações e respostas dos consultores.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>E-mail</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
            <div><Label>Senha</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} /></div>
            <div><Label>Confirmar senha</Label><Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8} /></div>
            <Button type="submit" disabled={loading} className="w-full">{loading ? "Criando..." : "Criar conta"}</Button>
          </form>
          <p className="text-xs text-center text-muted-foreground">
            Já tem conta? <Link to="/portal/login" className="text-primary font-semibold hover:underline">Entrar</Link>
          </p>
          <p className="text-xs text-center"><Link to="/cotacao" className="text-muted-foreground hover:text-foreground">Voltar ao portal</Link></p>
        </CardContent>
      </Card>
    </div>
  );
}
