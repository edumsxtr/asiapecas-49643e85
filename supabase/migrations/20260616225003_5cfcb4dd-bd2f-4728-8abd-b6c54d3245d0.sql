CREATE TABLE IF NOT EXISTS public._xcmg_staging (
  material text PRIMARY KEY,
  description text,
  stock int,
  estimated_price numeric,
  consumer_price numeric,
  manufacturer text
);
GRANT ALL ON public._xcmg_staging TO service_role, authenticated;
ALTER TABLE public._xcmg_staging ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staging_admin" ON public._xcmg_staging FOR ALL TO authenticated USING (true) WITH CHECK (true);