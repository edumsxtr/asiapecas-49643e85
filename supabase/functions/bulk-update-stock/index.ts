import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { updates } = await req.json();
  // updates: [{material, stock, price}, ...]

  if (!updates || !updates.length) {
    return new Response(JSON.stringify({ error: "No updates" }), { headers: corsHeaders, status: 400 });
  }

  // Build VALUES clause
  const values = updates.map((u: any) =>
    `('${u.material.replace(/'/g, "''")}', ${u.stock}, ${u.price})`
  ).join(",");

  const sql = `UPDATE parts SET stock = v.s, estimated_price = v.p FROM (VALUES ${values}) AS v(m, s, p) WHERE parts.material = v.m;`;

  const { error } = await supabase.rpc("execute_raw_sql", { sql_query: sql }).single();

  if (error) {
    // Try direct approach via postgres
    const { error: err2 } = await supabase.from("parts").select("id").limit(0);
    // Fallback: update one by one
    let updated = 0;
    let errors = 0;
    for (const u of updates) {
      const { error: e } = await supabase
        .from("parts")
        .update({ stock: u.stock, estimated_price: u.price })
        .eq("material", u.material);
      if (e) errors++;
      else updated++;
    }
    return new Response(JSON.stringify({ updated, errors, method: "individual" }), { headers: corsHeaders });
  }

  return new Response(JSON.stringify({ updated: updates.length, method: "bulk" }), { headers: corsHeaders });
});
