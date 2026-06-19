
-- ============== 1. GRANTS on vitrine tables ==============
GRANT SELECT ON public.vitrine_banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vitrine_banners TO authenticated;
GRANT ALL ON public.vitrine_banners TO service_role;

GRANT SELECT ON public.vitrine_featured_parts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vitrine_featured_parts TO authenticated;
GRANT ALL ON public.vitrine_featured_parts TO service_role;

GRANT SELECT ON public.vitrine_collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vitrine_collections TO authenticated;
GRANT ALL ON public.vitrine_collections TO service_role;

GRANT SELECT ON public.vitrine_collection_parts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vitrine_collection_parts TO authenticated;
GRANT ALL ON public.vitrine_collection_parts TO service_role;

GRANT SELECT ON public.part_promotions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.part_promotions TO authenticated;
GRANT ALL ON public.part_promotions TO service_role;

GRANT SELECT ON public.vitrine_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vitrine_settings TO authenticated;
GRANT ALL ON public.vitrine_settings TO service_role;

-- ============== 2. Bootstrap admin RPC ==============
CREATE OR REPLACE FUNCTION public.bootstrap_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'admin')
    ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.bootstrap_admin() TO authenticated;

-- ============== 3. Extend quote_requests ==============
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_payload jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS final_proposal_sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_quote_requests_auth_user ON public.quote_requests(auth_user_id);

-- Allow authenticated customer to see own quote requests
DROP POLICY IF EXISTS "Customers read own quotes" ON public.quote_requests;
CREATE POLICY "Customers read own quotes" ON public.quote_requests
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- Allow public (anon) insert with auth_user_id null OR matching uid
DROP POLICY IF EXISTS "Public can insert quote_requests" ON public.quote_requests;
CREATE POLICY "Public can insert quote_requests" ON public.quote_requests
  FOR INSERT TO public
  WITH CHECK (auth_user_id IS NULL OR auth_user_id = auth.uid());

GRANT SELECT, INSERT ON public.quote_requests TO anon;
GRANT SELECT, INSERT, UPDATE ON public.quote_requests TO authenticated;
GRANT ALL ON public.quote_requests TO service_role;

-- ============== 4. Trigger to sync sale status -> quote_request ==============
CREATE OR REPLACE FUNCTION public.sync_quote_from_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qr_id uuid;
BEGIN
  SELECT id INTO v_qr_id FROM public.quote_requests
    WHERE final_proposal_sale_id = NEW.id OR converted_sale_id = NEW.id
    LIMIT 1;
  IF v_qr_id IS NULL THEN RETURN NEW; END IF;
  UPDATE public.quote_requests
    SET status = CASE
      WHEN NEW.status = 'enviado' THEN 'proposta_enviada'
      WHEN NEW.status = 'aprovado' THEN 'aprovado'
      WHEN NEW.status = 'cancelado' THEN 'recusado'
      WHEN NEW.status = 'concluido' THEN 'concluido'
      ELSE status END,
    status_history = status_history || jsonb_build_object(
      'at', now(), 'status', NEW.status, 'sale_id', NEW.id
    )
    WHERE id = v_qr_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_quote_from_sale ON public.sales;
CREATE TRIGGER trg_sync_quote_from_sale
  AFTER UPDATE OF status ON public.sales
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.sync_quote_from_sale();
