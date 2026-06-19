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

    const { import_id } = await req.json();
    if (!import_id) {
      return new Response(JSON.stringify({ error: "import_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Paginate over items (supabase default limit is 1000)
    const pageSize = 1000;
    const materialMap = new Map<string, any>();
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from("stock_import_items")
        .select("material, description, stock, estimated_price, machine_model, manufacturer, supplier, last_entry_time, is_mineracao, is_linha_amarela, is_perfuratriz, is_caminhao_eletrico, is_guindaste")
        .eq("import_id", import_id)
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      for (const row of data) {
        const key = row.material;
        if (!key) continue;
        const existing = materialMap.get(key);
        if (existing) {
          existing.stock += row.stock || 0;
          existing.estimated_price = Math.max(existing.estimated_price, row.estimated_price || 0);
          if (row.machine_model && !existing.models.includes(row.machine_model)) existing.models.push(row.machine_model);
        } else {
          materialMap.set(key, {
            material: key, description: row.description, stock: row.stock || 0,
            estimated_price: row.estimated_price || 0,
            machine_model: row.machine_model || null, manufacturer: row.manufacturer || null,
            supplier: row.supplier || null, last_entry_time: row.last_entry_time || null,
            is_mineracao: row.is_mineracao || false, is_linha_amarela: row.is_linha_amarela || false,
            is_perfuratriz: row.is_perfuratriz || false, is_caminhao_eletrico: row.is_caminhao_eletrico || false,
            is_guindaste: row.is_guindaste || false,
            models: row.machine_model ? [row.machine_model] : [],
          });
        }
      }
      if (data.length < pageSize) break;
      from += pageSize;
    }

    let inserted = 0, updated = 0, errors = 0;
    for (const entry of materialMap.values()) {
      const partData: any = {
        description: entry.description, stock: entry.stock, estimated_price: entry.estimated_price,
        is_mineracao: entry.is_mineracao, is_linha_amarela: entry.is_linha_amarela,
        is_perfuratriz: entry.is_perfuratriz, is_caminhao_eletrico: entry.is_caminhao_eletrico,
        is_guindaste: entry.is_guindaste,
      };
      if (entry.machine_model) partData.machine_model = entry.machine_model;
      if (entry.manufacturer) partData.manufacturer = entry.manufacturer;
      if (entry.supplier) partData.supplier = entry.supplier;
      if (entry.last_entry_time) partData.last_entry_time = entry.last_entry_time;
      if (entry.models.length > 0) partData.compatible_models = entry.models;

      const { data: existing } = await supabase.from("parts").select("id").eq("material", entry.material).maybeSingle();
      if (existing) {
        const { error } = await supabase.from("parts").update(partData).eq("id", existing.id);
        if (error) errors++; else updated++;
      } else {
        partData.material = entry.material;
        const { error } = await supabase.from("parts").insert([partData]);
        if (error) errors++; else inserted++;
      }
    }

    const finalStock = Array.from(materialMap.values()).reduce((s, e) => s + e.stock, 0);
    const finalValue = Array.from(materialMap.values()).reduce((s, e) => s + e.stock * e.estimated_price, 0);
    await supabase.from("stock_imports").update({
      status: "completo", total_stock: finalStock, total_value: finalValue,
    }).eq("id", import_id);

    return new Response(JSON.stringify({
      success: true, unique_materials: materialMap.size, inserted, updated, errors,
      total_stock: finalStock, total_value: finalValue,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
