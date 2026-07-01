import { useState, FormEvent, ChangeEvent, InputHTMLAttributes } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { SEO } from "@/lib/seo";
import AuthIllustration from "@/components/auth/AuthIllustration";

/* ─── Helpers de máscara ─── */
const onlyDigits = (s: string) => s.replace(/\D/g, "");

function maskCpfCnpj(v: string) {
  const d = onlyDigits(v).slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2}\.\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}
function maskFixo(v: string) {
  return onlyDigits(v).slice(0, 10)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
}
function maskCelular(v: string) {
  return onlyDigits(v).slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}
function maskDate(v: string) {
  return onlyDigits(v).slice(0, 8)
    .replace(/^(\d{2})(\d)/, "$1/$2")
    .replace(/^(\d{2}\/\d{2})(\d)/, "$1/$2");
}

/* ─── Força da senha ─── */
function passwordStrength(pw: string) {
  if (!pw) return { label: "Sem senha", barClass: "bg-muted", textClass: "text-muted-foreground", pct: 0 };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const levels = [
    { label: "Muito fraca", barClass: "bg-destructive", textClass: "text-destructive", pct: 25 },
    { label: "Fraca", barClass: "bg-warning", textClass: "text-warning", pct: 50 },
    { label: "Média", barClass: "bg-accent", textClass: "text-foreground", pct: 75 },
    { label: "Forte", barClass: "bg-success", textClass: "text-success", pct: 100 },
  ];
  return levels[Math.max(0, Math.min(3, s - 1))];
}

/* ─── Captcha (client-side, anti-bot leve) ─── */
function genCaptcha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let r = "";
  for (let i = 0; i < 5; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return r;
}

/* ─── Campo reutilizável (definido fora do componente p/ não remontar) ─── */
function Field({
  id, label, ...rest
}: { id: string; label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-[11px] font-medium whitespace-nowrap">{label}</Label>
      <Input id={id} {...rest} className="h-9" />
    </div>
  );
}

export default function PortalLoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") === "registro" ? "registro" : "login");

  /* Login */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  /* Registro */
  const [reg, setReg] = useState({
    cpf: "", nome: "", sobrenome: "", nascimento: "", fixo: "", celular: "",
    email: "", senha: "", confirma: "",
  });
  const [captcha, setCaptcha] = useState(genCaptcha);
  const [captchaInput, setCaptchaInput] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const refreshCaptcha = () => { setCaptcha(genCaptcha()); setCaptchaInput(""); };

  const setMasked = (key: keyof typeof reg, mask?: (v: string) => string) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setReg((s) => ({ ...s, [key]: mask ? mask(e.target.value) : e.target.value }));

  const strength = passwordStrength(reg.senha);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Bem-vindo de volta");
    navigate("/minhas-cotacoes");
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    const cpfDigits = onlyDigits(reg.cpf);
    if (cpfDigits.length !== 11 && cpfDigits.length !== 14) return toast.error("Informe um CPF ou CNPJ válido.");
    if (!reg.nome.trim() || !reg.sobrenome.trim()) return toast.error("Informe nome e sobrenome.");
    if (reg.nascimento.length !== 10) return toast.error("Informe a data de nascimento (DD/MM/AAAA).");
    if (onlyDigits(reg.celular).length < 11) return toast.error("Informe um celular válido com DDD.");
    if (reg.senha.length < 8) return toast.error("A senha deve ter ao menos 8 caracteres.");
    if (reg.senha !== reg.confirma) return toast.error("As senhas não coincidem.");
    if (captchaInput.trim().toUpperCase() !== captcha) { toast.error("Captcha incorreto. Tente novamente."); refreshCaptcha(); return; }

    setRegLoading(true);
    const { error } = await signUp(reg.email, reg.senha, {
      cpf_cnpj: reg.cpf,
      nome: reg.nome,
      sobrenome: reg.sobrenome,
      full_name: `${reg.nome} ${reg.sobrenome}`.trim(),
      data_nascimento: reg.nascimento,
      telefone_fixo: reg.fixo,
      celular: reg.celular,
    });
    setRegLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Conta criada. Você já pode acessar suas cotações.");
    navigate("/minhas-cotacoes");
  };

  const sectionLabel = "text-[11px] font-bold uppercase tracking-widest text-muted-foreground";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-8">
      <SEO
        title="Entrar ou criar conta | Portal do Cliente — Ásia Peças"
        description="Acesse sua conta ou cadastre-se para acompanhar cotações, propostas e histórico de pedidos XCMG."
        canonical="/portal/login"
      />

      <Card className="w-full max-w-4xl overflow-hidden grid lg:grid-cols-2">
        <AuthIllustration />

        <div className="p-6 md:p-8">
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="registro">Criar conta</TabsTrigger>
            </TabsList>

            {/* ─── Entrar ─── */}
            <TabsContent value="login">
              <div className="mb-5">
                <h1 className="text-xl font-bold font-display tracking-tight">Acessar minha conta</h1>
                <p className="text-xs text-muted-foreground mt-1">Acompanhe o status das suas cotações em tempo real.</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <Field id="login-email" label="E-mail" type="email" placeholder="Informe seu email"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
                <Field id="login-password" label="Senha" type="password" placeholder="Informe sua senha"
                  value={password} onChange={(e) => setPassword(e.target.value)} required />
                <Button type="submit" disabled={loading} className="w-full">{loading ? "Entrando..." : "Entrar"}</Button>
              </form>
              <p className="text-xs text-center text-muted-foreground mt-5">
                Não tem conta?{" "}
                <button type="button" onClick={() => setTab("registro")} className="text-primary font-semibold hover:underline">
                  Criar agora
                </button>
              </p>
            </TabsContent>

            {/* ─── Criar conta ─── */}
            <TabsContent value="registro">
              <form onSubmit={handleRegister} className="space-y-3">
                {/* Informação Pessoal */}
                <fieldset className="space-y-2">
                  <legend className={sectionLabel}>Informação Pessoal</legend>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <Field id="reg-cpf" label="CPF / CNPJ" placeholder="CPF ou CNPJ" inputMode="numeric"
                      value={reg.cpf} onChange={setMasked("cpf", maskCpfCnpj)} required />
                    <Field id="reg-nome" label="Nome" placeholder="Seu nome"
                      value={reg.nome} onChange={setMasked("nome")} required />
                    <Field id="reg-sobrenome" label="Sobrenome" placeholder="Seu sobrenome"
                      value={reg.sobrenome} onChange={setMasked("sobrenome")} required />
                    <Field id="reg-nascimento" label="Data de Nascimento" placeholder="DD/MM/AAAA" inputMode="numeric"
                      value={reg.nascimento} onChange={setMasked("nascimento", maskDate)} required />
                    <Field id="reg-fixo" label="Telefone Fixo" placeholder="(__) ____-____" inputMode="numeric"
                      value={reg.fixo} onChange={setMasked("fixo", maskFixo)} />
                    <Field id="reg-celular" label="Celular" placeholder="(__) _____-____" inputMode="numeric"
                      value={reg.celular} onChange={setMasked("celular", maskCelular)} required />
                  </div>
                </fieldset>

                {/* Informação de Login */}
                <fieldset className="space-y-2">
                  <legend className={sectionLabel}>Informação de Login</legend>
                  <Field id="reg-email" label="E-mail" type="email" placeholder="Informe seu email"
                    value={reg.email} onChange={setMasked("email")} required />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label htmlFor="reg-senha" className="text-[11px] font-medium">Senha</Label>
                      <Input id="reg-senha" type="password" placeholder="Informe uma senha"
                        value={reg.senha} onChange={setMasked("senha")} required minLength={8} className="h-9" />
                    </div>
                    <Field id="reg-confirma" label="Confirme a senha" type="password" placeholder="Digite a senha novamente"
                      value={reg.confirma} onChange={setMasked("confirma")} required minLength={8} />
                  </div>
                  {/* Força da senha (linha fina) */}
                  <div className="flex items-center gap-2">
                    <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${strength.barClass}`} style={{ width: `${strength.pct}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                      Força: <span className={`font-semibold ${strength.textClass}`}>{strength.label}</span>
                    </p>
                  </div>
                </fieldset>

                {/* Captcha */}
                <fieldset className="space-y-1.5">
                  <legend className="text-[11px] font-medium text-foreground">Por favor digite as letras e números abaixo</legend>
                  <div className="flex items-center gap-2">
                    <div
                      className="select-none flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 bg-muted shrink-0"
                      style={{ backgroundImage: "repeating-linear-gradient(45deg, hsl(var(--foreground)/0.05) 0 2px, transparent 2px 6px)" }}
                      aria-hidden="true"
                    >
                      {captcha.split("").map((c, i) => (
                        <span key={i} className="font-mono text-sm font-bold text-foreground"
                          style={{ display: "inline-block", transform: `rotate(${i % 2 ? 8 : -7}deg)` }}>
                          {c}
                        </span>
                      ))}
                    </div>
                    <button type="button" onClick={refreshCaptcha} aria-label="Gerar novo código"
                      className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <Input id="reg-captcha" aria-label="Código do captcha" placeholder="Digite o código"
                      value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)} required autoComplete="off" className="flex-1 h-9" />
                  </div>
                </fieldset>

                <Button type="submit" disabled={regLoading} className="w-full">
                  {regLoading ? "Criando conta..." : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-center pt-4 mt-4 border-t border-border">
            <Link to="/" className="text-muted-foreground hover:text-foreground">Voltar ao site</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
