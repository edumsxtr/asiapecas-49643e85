const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://asiapecas.lovable.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    // Static URLs
    const urls: { loc: string; lastmod?: string; priority?: string }[] = [
      { loc: `${SITE}/cotacao`, priority: "1.0" },
    ];

    // All in-stock parts
    const partsRes = await fetch(`${SUPABASE_URL}/rest/v1/parts?select=material,updated_at&stock=gt.0&limit=5000`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    const parts = await partsRes.json() as any[];
    for (const p of parts) {
      urls.push({
        loc: `${SITE}/cotacao/p/${encodeURIComponent(p.material)}`,
        lastmod: p.updated_at?.split("T")[0],
        priority: "0.8",
      });
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}${u.priority ? `\n    <priority>${u.priority}</priority>` : ""}
  </url>`).join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
    });
  } catch (err) {
    return new Response(`<!-- error: ${err instanceof Error ? err.message : "unknown"} -->`, {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  }
});
