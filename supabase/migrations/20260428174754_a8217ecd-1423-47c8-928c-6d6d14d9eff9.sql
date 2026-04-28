ALTER TABLE public.maintenance_machines ADD COLUMN IF NOT EXISTS image_url TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('machine-images', 'machine-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public read machine-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'machine-images');

CREATE POLICY "Auth upload machine-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'machine-images');

CREATE POLICY "Auth update machine-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'machine-images');

CREATE POLICY "Auth delete machine-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'machine-images');