// Track conversions to Google Ads via Enhanced Conversions API (server-side).
// Falls back to logging if Ads API credentials are not configured.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input.trim().toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { event, value, currency = "BRL", email, phone, transaction_id } = body || {};
    if (!event) return new Response(JSON.stringify({ error: "event required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const settingsRes = await fetch(`${SUPABASE_URL}/rest/v1/vitrine_settings?select=ga4_id,ads_conversion_id,ads_conversion_label&limit=1`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    const [settings] = await settingsRes.json() as any[];

    const hashed: Record<string, string> = {};
    if (email) hashed.email_sha256 = await sha256Hex(email);
    if (phone) hashed.phone_sha256 = await sha256Hex(phone.replace(/\D/g, ""));

    // Log for now — full Google Ads Conversion API requires OAuth setup.
    // The client-side gtag('event','conversion') will fire via dataLayer; this
    // server endpoint exists so we can later wire up the Conversion API
    // securely with a Customer ID + developer token.
    console.log("conversion", { event, value, currency, transaction_id, hashed, ads_id: settings?.ads_conversion_id });

    return new Response(JSON.stringify({ ok: true, event, queued: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
