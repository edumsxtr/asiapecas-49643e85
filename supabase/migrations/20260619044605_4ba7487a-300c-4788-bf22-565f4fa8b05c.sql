
CREATE TABLE public.category_media (
  category text PRIMARY KEY,
  image_url text,
  headline text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.category_media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.category_media TO authenticated;
GRANT ALL ON public.category_media TO service_role;

ALTER TABLE public.category_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read category media"
  ON public.category_media FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert category media"
  ON public.category_media FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update category media"
  ON public.category_media FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete category media"
  ON public.category_media FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER category_media_updated_at
  BEFORE UPDATE ON public.category_media
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
