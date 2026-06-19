
-- ===== cart_sessions: replace permissive policies with RPCs =====
DROP POLICY IF EXISTS "Anyone can insert cart session" ON public.cart_sessions;
DROP POLICY IF EXISTS "Anyone can read their cart session" ON public.cart_sessions;
DROP POLICY IF EXISTS "Anyone can update cart session" ON public.cart_sessions;

-- Keep RLS enabled with no permissive policies (table becomes inaccessible directly)
-- Service role bypasses RLS, RPCs below use SECURITY DEFINER.

CREATE OR REPLACE FUNCTION public.cart_get(p_session_id text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT items FROM public.cart_sessions WHERE session_id = p_session_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.cart_upsert(p_session_id text, p_items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_session_id IS NULL OR length(p_session_id) < 16 OR length(p_session_id) > 128 THEN
    RAISE EXCEPTION 'invalid session id';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'items must be an array';
  END IF;
  IF jsonb_array_length(p_items) > 200 THEN
    RAISE EXCEPTION 'too many items';
  END IF;
  INSERT INTO public.cart_sessions (session_id, items, updated_at)
  VALUES (p_session_id, p_items, now())
  ON CONFLICT (session_id)
  DO UPDATE SET items = EXCLUDED.items, updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.cart_get(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cart_upsert(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cart_get(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cart_upsert(text, jsonb) TO anon, authenticated;

-- ===== maintenance_machines: admin-only writes =====
DROP POLICY IF EXISTS "Authenticated insert maintenance_machines" ON public.maintenance_machines;
DROP POLICY IF EXISTS "Authenticated update maintenance_machines" ON public.maintenance_machines;
DROP POLICY IF EXISTS "Authenticated delete maintenance_machines" ON public.maintenance_machines;

CREATE POLICY "Admins insert maintenance_machines" ON public.maintenance_machines
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update maintenance_machines" ON public.maintenance_machines
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete maintenance_machines" ON public.maintenance_machines
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ===== maintenance_plan_items: admin-only writes =====
DROP POLICY IF EXISTS "Authenticated insert maintenance_plan_items" ON public.maintenance_plan_items;
DROP POLICY IF EXISTS "Authenticated update maintenance_plan_items" ON public.maintenance_plan_items;
DROP POLICY IF EXISTS "Authenticated delete maintenance_plan_items" ON public.maintenance_plan_items;

CREATE POLICY "Admins insert maintenance_plan_items" ON public.maintenance_plan_items
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update maintenance_plan_items" ON public.maintenance_plan_items
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete maintenance_plan_items" ON public.maintenance_plan_items
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ===== pricing_settings: admin-only writes =====
DROP POLICY IF EXISTS "Authenticated can insert pricing_settings" ON public.pricing_settings;
DROP POLICY IF EXISTS "Authenticated can update pricing_settings" ON public.pricing_settings;

CREATE POLICY "Admins insert pricing_settings" ON public.pricing_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update pricing_settings" ON public.pricing_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ===== proposal_settings: admin-only writes =====
DROP POLICY IF EXISTS "Authenticated can insert proposal_settings" ON public.proposal_settings;
DROP POLICY IF EXISTS "Authenticated can update proposal_settings" ON public.proposal_settings;

CREATE POLICY "Admins insert proposal_settings" ON public.proposal_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update proposal_settings" ON public.proposal_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ===== subcategory_taxonomy: admin-only insert/update =====
DROP POLICY IF EXISTS "Authenticated insert taxonomy" ON public.subcategory_taxonomy;
DROP POLICY IF EXISTS "Authenticated update taxonomy" ON public.subcategory_taxonomy;

CREATE POLICY "Admins insert taxonomy" ON public.subcategory_taxonomy
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update taxonomy" ON public.subcategory_taxonomy
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
