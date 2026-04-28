
CREATE TABLE public.maintenance_machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  model text NOT NULL,
  serial text,
  notes text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category, model)
);

CREATE TABLE public.maintenance_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid NOT NULL REFERENCES public.maintenance_machines(id) ON DELETE CASCADE,
  group_name text NOT NULL DEFAULT 'Geral',
  description text NOT NULL,
  material text NOT NULL,
  substitute_codes text[] NOT NULL DEFAULT '{}',
  quantity int NOT NULL DEFAULT 1,
  interval_hours int NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (machine_id, material, interval_hours)
);

CREATE INDEX idx_maint_items_machine ON public.maintenance_plan_items(machine_id);
CREATE INDEX idx_maint_items_material ON public.maintenance_plan_items(material);
CREATE INDEX idx_maint_items_interval ON public.maintenance_plan_items(interval_hours);
CREATE INDEX idx_maint_machines_category ON public.maintenance_machines(category);

ALTER TABLE public.maintenance_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read maintenance_machines" ON public.maintenance_machines FOR SELECT USING (true);
CREATE POLICY "Authenticated insert maintenance_machines" ON public.maintenance_machines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update maintenance_machines" ON public.maintenance_machines FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete maintenance_machines" ON public.maintenance_machines FOR DELETE TO authenticated USING (true);

CREATE POLICY "Public read maintenance_plan_items" ON public.maintenance_plan_items FOR SELECT USING (true);
CREATE POLICY "Authenticated insert maintenance_plan_items" ON public.maintenance_plan_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update maintenance_plan_items" ON public.maintenance_plan_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete maintenance_plan_items" ON public.maintenance_plan_items FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_maint_machines_updated BEFORE UPDATE ON public.maintenance_machines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_maint_items_updated BEFORE UPDATE ON public.maintenance_plan_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
