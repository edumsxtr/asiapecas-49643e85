import { Navigate } from "react-router-dom";

// O cadastro foi unificado na página de login (abas Entrar / Criar conta).
export default function PortalSignupPage() {
  return <Navigate to="/portal/login?tab=registro" replace />;
}
