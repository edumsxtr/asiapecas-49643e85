import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { import_id, delete_parts } = await req.json();
    if (!import_id) {
      return new Response(JSON.stringify({ error: "import_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get materials of this import
    const { data: items, error: itemsErr } = await supabase
      .from("stock_import_items")
      .select("material")
      .eq("import_id", import_id);
    if (itemsErr) throw itemsErr;

    const materials = Array.from(new Set((items || []).map((i: any) => i.material).filter(Boolean)));

    let zeroed = 0, deleted = 0;

    if (delete_parts && materials.length > 0) {
      // For each material: check if it appears in OTHER imports. If not → delete the part.
      // If it does → just zero the stock (the other import is still a source).
      // Process in chunks of 200 to keep payload reasonable.
      const chunk = 200;
      for (let i = 0; i < materials.length; i += chunk) {
        const slice = materials.slice(i, i + chunk);
        const { data: otherItems } = await supabase
          .from("stock_import_items")
          .select("material")
          .in("material", slice)
          .neq("import_id", import_id);

        const stillReferenced = new Set((otherItems || []).map((x: any) => x.material));
        const toDelete = slice.filter((m) => !stillReferenced.has(m));
        const toZero = slice.filter((m) => stillReferenced.has(m));

        if (toDelete.length) {
          const { error: delErr, count } = await supabase
            .from("parts").delete({ count: "exact" }).in("material", toDelete);
          if (!delErr) deleted += count || 0;
        }
        if (toZero.length) {
          const { error: zErr, count } = await supabase
            .from("parts").update({ stock: 0 }, { count: "exact" }).in("material", toZero);
          if (!zErr) zeroed += count || 0;
        }
      }
    }

    // Finally delete the import (cascade kills stock_import_items)
    const { error: delImpErr } = await supabase.from("stock_imports").delete().eq("id", import_id);
    if (delImpErr) throw delImpErr;

    return new Response(JSON.stringify({
      success: true, materials: materials.length, parts_deleted: deleted, parts_zeroed: zeroed,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
