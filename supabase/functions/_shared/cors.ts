// CORS com allowlist de origens para funções internas.
// Reflete a origem na resposta apenas se ela estiver na allowlist
// (domínio de produção, previews do Lovable e localhost em dev);
// caso contrário usa o domínio de produção (bloqueia origens desconhecidas).
const STATIC_ALLOWED = [
  "https://asiapecas.com",
  "https://www.asiapecas.com",
];

export function corsFromReq(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowed =
    STATIC_ALLOWED.includes(origin) ||
    /\.lovable\.app$/.test(origin) ||
    /\.lovableproject\.com$/.test(origin) ||
    /^http:\/\/localhost(:\d+)?$/.test(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : STATIC_ALLOWED[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Vary": "Origin",
  };
}
