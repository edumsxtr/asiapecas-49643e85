import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import asiaLogo from "@/assets/asia-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, LogIn, UserPlus } from "lucide-react";

// Módulos reais do ERP — viram a "assinatura" do painel-console (plaquetas com tique âmbar).
const MODULES = ["Catálogo", "Estoque", "Clientes", "Vendas", "Pós-venda"];

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setLoading(false);
    if (error) {
      toast.error("Não foi possível entrar: " + error.message);
    } else {
      navigate("/painel", { replace: true });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword !== signupConfirm) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (signupPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    const { error } = await signUp(signupEmail, signupPassword);
    setLoading(false);
    if (error) {
      toast.error("Não foi possível cadastrar: " + error.message);
    } else {
      toast.success("Cadastro criado. Verifique seu email para confirmar a conta.");
    }
  };

  const fieldLabel = "text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground";
  const tabTrigger =
    "rounded-none border-b-2 border-transparent bg-transparent px-1 py-2 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none";

  return (
    <div className="min-h-screen bg-background text-foreground grid lg:grid-cols-[1.05fr_1fr]">
      {/* ── Painel-console (identidade) ── */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-foreground p-12 text-background">
        {/* malha blueprint sutil */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 0 39px, hsl(var(--background)/0.06) 39px 40px), repeating-linear-gradient(90deg, transparent 0 39px, hsl(var(--background)/0.06) 39px 40px)",
          }}
        />
        {/* brilho cobalto */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <img src={asiaLogo} alt="" className="h-11 w-auto rounded-sm" />
          <div className="leading-tight">
            <p className="font-display text-sm font-bold tracking-tight">Ásia Peças &amp; Máquinas</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-background/50">Peças &amp; Máquinas XCMG</p>
          </div>
        </div>

        <div className="relative">
          <p className="mb-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
            <span className="h-3 w-1 rounded-[1px] bg-accent" /> Sistema de Gestão
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight">
            Console de<br />operação interna.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-background/60">
            Estoque, catálogo e comercial da Ásia em um só lugar. Acesso restrito à equipe.
          </p>

          {/* plaquetas dos módulos — assinatura */}
          <ul className="mt-8 flex flex-wrap gap-2">
            {MODULES.map((m) => (
              <li
                key={m}
                className="inline-flex items-center gap-1.5 rounded-sm border border-background/15 bg-background/[0.04] px-2.5 py-1 font-mono text-[11px] tracking-tight text-background/80"
              >
                <span className="h-3 w-1 rounded-[1px] bg-accent" />
                {m}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative font-mono text-[10px] uppercase tracking-[0.22em] text-background/40">
          Ásia Peças · v1.0 · Acesso monitorado
        </p>
      </aside>

      {/* ── Formulário ── */}
      <main className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          {/* marca no mobile */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src={asiaLogo} alt="Ásia Peças & Máquinas" className="h-10 w-auto rounded-sm" />
            <p className="font-display text-sm font-bold tracking-tight">Ásia Peças &amp; Máquinas</p>
          </div>

          <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <span className="h-3 w-1 rounded-[1px] bg-accent" /> Acesso interno
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground">
            Entrar no sistema
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Use suas credenciais da equipe para abrir o painel.
          </p>

          <Tabs defaultValue="login" className="mt-8 w-full">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-6 rounded-none border-b border-border bg-transparent p-0">
              <TabsTrigger value="login" className={tabTrigger}>Entrar</TabsTrigger>
              <TabsTrigger value="signup" className={tabTrigger}>Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-7">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className={fieldLabel}>Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="voce@asiapecas.com"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className={fieldLabel}>Senha</Label>
                    <Link to="/reset-password" className="font-mono text-[11px] uppercase tracking-wider text-primary hover:underline">
                      Esqueci a senha
                    </Link>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button type="submit" className="w-full font-semibold" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                  Entrar no painel
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-7">
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className={fieldLabel}>Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="voce@asiapecas.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className={fieldLabel}>Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm" className={fieldLabel}>Confirmar senha</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={signupConfirm}
                    onChange={(e) => setSignupConfirm(e.target.value)}
                    placeholder="Repita a senha"
                  />
                </div>
                <Button type="submit" className="w-full font-semibold" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  Criar acesso
                </Button>
                <p className="text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Após o cadastro, confirme pelo email
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
