
-- 1) parts: hide supplier column from anonymous visitors
REVOKE SELECT ON public.parts FROM anon;
GRANT SELECT (
  id, material, description, last_entry_time, stock, estimated_price,
  manufacturer, machine_model, is_mineracao, is_linha_amarela, is_perfuratriz,
  is_caminhao_eletrico, is_guindaste, compatible_models, created_at, updated_at,
  reviewed_at, part_category, image_url, subcategory, attributes,
  subcategory_source, subcategory_confidence, needs_review, classification_method,
  search_vector, consumer_price
) ON public.parts TO anon;

-- 2) pricing_settings: admin-only read
DROP POLICY IF EXISTS "Authenticated can read pricing_settings" ON public.pricing_settings;
CREATE POLICY "Admins read pricing_settings" ON public.pricing_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) proposal_settings: admin-only read (bank data)
DROP POLICY IF EXISTS "Authenticated can read proposal_settings" ON public.proposal_settings;
CREATE POLICY "Admins read proposal_settings" ON public.proposal_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4) salespeople: keep read for authenticated, writes admin-only
DROP POLICY IF EXISTS "auth all salespeople" ON public.salespeople;
CREATE POLICY "Authenticated read salespeople" ON public.salespeople
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert salespeople" ON public.salespeople
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update salespeople" ON public.salespeople
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete salespeople" ON public.salespeople
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5) conversion_events: allow inserts from public/authenticated for tracking
CREATE POLICY "Anyone insert conversion_events" ON public.conversion_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 6) cart_sessions: lock direct table access; only SECURITY DEFINER fns (cart_get/cart_upsert) can touch it
REVOKE ALL ON public.cart_sessions FROM anon, authenticated;
GRANT ALL ON public.cart_sessions TO service_role;
CREATE POLICY "No direct access cart_sessions" ON public.cart_sessions
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
