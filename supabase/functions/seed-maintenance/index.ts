// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import data from "./data.json" with { type: "json" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let machinesUpserted = 0;
    let itemsUpserted = 0;
    let itemsSkipped = 0;

    for (let mi = 0; mi < (data as any[]).length; mi++) {
      const [category, model, serial, items] = (data as any[])[mi];

      const { data: mach, error: mErr } = await supabase
        .from("maintenance_machines")
        .upsert({ category, model, serial, sort_order: mi }, { onConflict: "category,model" })
        .select("id")
        .single();
      if (mErr) {
        console.error("machine upsert error", category, model, mErr);
        continue;
      }
      machinesUpserted++;

      // Bulk upsert items in chunks of 500
      const rows = (items as any[]).map(([group_name, description, material, substitute_codes, quantity, interval_hours, sort_order]) => ({
        machine_id: mach.id,
        group_name: group_name || "Geral",
        description: (description || "").slice(0, 300),
        material: String(material),
        substitute_codes: substitute_codes || [],
        quantity: quantity || 1,
        interval_hours,
        sort_order,
      }));

      for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        const { error: iErr } = await supabase
          .from("maintenance_plan_items")
          .upsert(chunk, { onConflict: "machine_id,material,interval_hours" });
        if (iErr) {
          console.error("items upsert error", iErr);
          itemsSkipped += chunk.length;
        } else {
          itemsUpserted += chunk.length;
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, machinesUpserted, itemsUpserted, itemsSkipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
