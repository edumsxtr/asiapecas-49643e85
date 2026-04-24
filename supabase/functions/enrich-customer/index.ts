import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";
const SCRAPE_TIMEOUT_MS = 12000;

// ---------- helpers ----------
function normalize(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(ltda|s\/?a|sa|me|epp|eireli|cia|companhia|comercial|industria|industrial)\b/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameTokens(name: string): string[] {
  const norm = normalize(name);
  return norm.split(" ").filter((t) => t.length >= 4);
}

function contentMatchesCompany(markdown: string, companyName: string): { ok: boolean; excerpt: string } {
  if (!markdown || !companyName) return { ok: false, excerpt: "" };
  const md = markdown.toLowerCase();
  const tokens = nameTokens(companyName);
  if (tokens.length === 0) return { ok: false, excerpt: "" };
  // Need at least 2 distinctive tokens to match (or the full normalized name as substring)
  const fullNorm = normalize(companyName);
  if (fullNorm.length >= 6 && md.includes(fullNorm)) {
    const idx = md.indexOf(fullNorm);
    return { ok: true, excerpt: markdown.slice(Math.max(0, idx - 80), idx + 200) };
  }
  let hits = 0;
  let firstIdx = -1;
  for (const t of tokens) {
    const i = md.indexOf(t);
    if (i >= 0) {
      hits++;
      if (firstIdx < 0) firstIdx = i;
    }
  }
  const need = tokens.length >= 3 ? 2 : tokens.length;
  if (hits >= need && firstIdx >= 0) {
    return { ok: true, excerpt: markdown.slice(Math.max(0, firstIdx - 80), firstIdx + 200) };
  }
  return { ok: false, excerpt: "" };
}

function isJunkUrl(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes("/search?") ||
    u.includes("/busca") ||
    u.includes("google.com/search") ||
    u.endsWith(".pdf") ||
    u.includes("youtube.com") ||
    u.includes("facebook.com/sharer")
  );
}

async function firecrawlSearch(apiKey: string, query: string, limit = 6): Promise<Array<{ url: string; title?: string; description?: string }>> {
  try {
    const res = await fetch(`${FIRECRAWL_V2}/search`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit, lang: "pt", country: "br" }),
    });
    if (!res.ok) {
      console.warn("firecrawl search failed", res.status, query);
      return [];
    }
    const data = await res.json();
    const arr = (data.web || data.data || []) as Array<{ url: string; title?: string; description?: string }>;
    return arr.filter((r) => r?.url && !isJunkUrl(r.url));
  } catch (e) {
    console.warn("firecrawl search error", e);
    return [];
  }
}

async function firecrawlScrape(apiKey: string, url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), SCRAPE_TIMEOUT_MS);
  try {
    const res = await fetch(`${FIRECRAWL_V2}/scrape`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    const md: string | undefined = data.markdown || data.data?.markdown;
    if (!md) return null;
    return md.slice(0, 200_000);
  } catch (_e) {
    clearTimeout(t);
    return null;
  }
}

const enrichTool = {
  type: "function",
  function: {
    name: "register_enrichment",
    description: "Extrai dados verificados sobre uma empresa a partir do markdown fornecido. Use null sempre que o dado não estiver explicitamente no texto.",
    parameters: {
      type: "object",
      properties: {
        official_name: { type: ["string", "null"] },
        cnpj_formatted: { type: ["string", "null"], description: "Apenas se o CNPJ aparecer literalmente no texto, formato XX.XXX.XXX/XXXX-XX" },
        cnae: { type: ["string", "null"] },
        company_size: { type: ["string", "null"], enum: ["ME", "EPP", "Medio", "Grande", null] },
        segment: { type: "string", enum: ["mineração", "construção", "logística", "energia", "agronegócio", "geral"] },
        website: { type: ["string", "null"] },
        linkedin: { type: ["string", "null"] },
        instagram: { type: ["string", "null"] },
        alt_phone: { type: ["string", "null"] },
        full_address: { type: ["string", "null"] },
        decision_maker_role: { type: ["string", "null"] },
        commercial_notes: { type: ["string", "null"] },
        evidence: {
          type: "object",
          description: "Para cada campo preenchido (≠ null), informe { source_url, source_excerpt }. Trecho deve aparecer literalmente em uma das fontes.",
          additionalProperties: {
            type: "object",
            properties: {
              source_url: { type: "string" },
              source_excerpt: { type: "string" },
            },
            required: ["source_url", "source_excerpt"],
          },
        },
      },
      required: ["segment", "evidence"],
      additionalProperties: false,
    },
  },
} as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let customer_id: string | null = null;
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    customer_id = body.customer_id;
    if (!customer_id) return new Response(JSON.stringify({ error: "customer_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "Firecrawl não está conectado. Conecte em Connectors para habilitar a pesquisa web verificada." }), {
        status: 412, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: customer, error } = await supabase.from("customers").select("*").eq("id", customer_id).single();
    if (error || !customer) {
      return new Response(JSON.stringify({ error: "Customer not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const companyName = (customer.company || customer.name).trim();
    const cityState = [customer.city, customer.state].filter(Boolean).join(" ");

    // 1. SEARCH — multiple targeted queries
    const queries = [
      `"${companyName}" ${cityState}`.trim(),
      `"${companyName}" CNPJ`,
      `"${companyName}" site oficial contato`,
      `"${companyName}" linkedin`,
    ];
    const searchResults = (await Promise.all(queries.map((q) => firecrawlSearch(FIRECRAWL_API_KEY, q, 4)))).flat();

    // dedupe by URL
    const seen = new Set<string>();
    const candidates = searchResults.filter((r) => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    }).slice(0, 10);

    console.info("enrich-customer firecrawl_hits=", candidates.length, "for", companyName);

    if (candidates.length === 0) {
      await supabase.from("customers").update({
        enrichment_status: "enriched",
        enriched_at: new Date().toISOString(),
        enrichment_data: { confidence: "low", sources: [], evidence: {}, _note: "Nenhum resultado público encontrado" },
      }).eq("id", customer_id);
      return new Response(JSON.stringify({ success: true, enrichment: { confidence: "low", sources: [] }, note: "no_public_results" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. SCRAPE top candidates in parallel and verify content matches the company
    const top = candidates.slice(0, 5);
    const scraped = await Promise.allSettled(top.map(async (c) => {
      const md = await firecrawlScrape(FIRECRAWL_API_KEY, c.url);
      if (!md) return null;
      const m = contentMatchesCompany(md, companyName);
      return m.ok ? { url: c.url, markdown: md, excerpt: m.excerpt } : null;
    }));
    const verified = scraped
      .filter((s): s is PromiseFulfilledResult<{ url: string; markdown: string; excerpt: string } | null> => s.status === "fulfilled")
      .map((s) => s.value)
      .filter((v): v is { url: string; markdown: string; excerpt: string } => v !== null);

    console.info("enrich-customer verified_sources=", verified.length, "dropped=", top.length - verified.length);

    if (verified.length === 0) {
      await supabase.from("customers").update({
        enrichment_status: "enriched",
        enriched_at: new Date().toISOString(),
        enrichment_data: {
          confidence: "low",
          sources: [],
          evidence: {},
          _note: "Resultados encontrados, mas nenhum continha o nome da empresa de forma verificável",
        },
      }).eq("id", customer_id);
      return new Response(JSON.stringify({ success: true, enrichment: { confidence: "low", sources: [] }, note: "no_verified_sources" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Send verified markdown to AI for extraction with evidence
    const sourcesBlock = verified.map((v, i) => `### FONTE ${i + 1}: ${v.url}\n\n${v.markdown.slice(0, 18_000)}`).join("\n\n---\n\n");

    const userPrompt = `Cliente: ${customer.name}
Empresa: ${companyName}
Cidade/UF: ${customer.city || "—"} / ${customer.state || "—"}

Abaixo estão páginas reais já verificadas que mencionam esta empresa. Extraia APENAS dados que aparecem literalmente no texto. Para cada campo preenchido, registre em \`evidence\` o source_url e o trecho exato.

Regras críticas:
- CNPJ: só preencha se aparecer no texto no formato XX.XXX.XXX/XXXX-XX
- Telefone, endereço, redes sociais: só se realmente aparecem
- Nunca chute. Quando não houver evidência, use null.

${sourcesBlock}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: "Você extrai dados de empresas a partir de páginas web reais. Nunca invente dados. Use null para qualquer campo sem evidência literal no texto fornecido." },
          { role: "user", content: userPrompt },
        ],
        tools: [enrichTool],
        tool_choice: { type: "function", function: { name: "register_enrichment" } },
      }),
    });

    if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns minutos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Configurações > Workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured data");
    const args = JSON.parse(toolCall.function.arguments) as Record<string, unknown> & { evidence: Record<string, { source_url: string; source_excerpt: string }> };

    // Validate CNPJ format strictly
    const cnpjRegex = /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/;
    if (args.cnpj_formatted && !cnpjRegex.test(args.cnpj_formatted as string)) {
      args.cnpj_formatted = null;
      delete args.evidence?.cnpj_formatted;
    }

    // Drop fields whose evidence URL is not in our verified set
    const verifiedUrls = new Set(verified.map((v) => v.url));
    const cleanEvidence: Record<string, { source_url: string; source_excerpt: string }> = {};
    for (const [field, ev] of Object.entries(args.evidence || {})) {
      if (ev && verifiedUrls.has(ev.source_url)) cleanEvidence[field] = ev;
      else if (ev) (args as Record<string, unknown>)[field] = null;
    }

    const filledCount = Object.keys(cleanEvidence).length;
    const confidence: "high" | "medium" | "low" = verified.length >= 3 && filledCount >= 4 ? "high" : verified.length >= 1 && filledCount >= 2 ? "medium" : "low";

    const enrichmentData = {
      ...args,
      evidence: cleanEvidence,
      sources: verified.map((v) => v.url),
      confidence,
      _enriched_at: new Date().toISOString(),
    };

    const updates: Record<string, unknown> = {
      enrichment_status: "enriched",
      enriched_at: new Date().toISOString(),
      enrichment_data: enrichmentData,
    };
    if (!customer.company && args.official_name) updates.company = args.official_name;
    if (!customer.cnpj_cpf && args.cnpj_formatted) updates.cnpj_cpf = args.cnpj_formatted;
    if (!customer.phone && args.alt_phone) updates.phone = args.alt_phone;
    if (!customer.address && args.full_address) updates.address = args.full_address;
    if ((!customer.segment || customer.segment === "geral") && args.segment) updates.segment = args.segment;

    await supabase.from("customers").update(updates).eq("id", customer_id);

    return new Response(JSON.stringify({ success: true, enrichment: enrichmentData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("enrich-customer error", err);
    const msg = err instanceof Error ? err.message : "unknown";
    try {
      if (customer_id) {
        const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await supabase.from("customers").update({ enrichment_status: "failed" }).eq("id", customer_id);
      }
    } catch (_) { /* ignore */ }
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
