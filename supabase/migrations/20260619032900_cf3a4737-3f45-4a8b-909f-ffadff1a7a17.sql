
-- part-images bucket policies
CREATE POLICY "part-images public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'part-images');
CREATE POLICY "part-images auth insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'part-images');
CREATE POLICY "part-images auth update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'part-images');
CREATE POLICY "part-images auth delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'part-images');

-- blog-images bucket policies
CREATE POLICY "blog-images public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-images');
CREATE POLICY "blog-images auth insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog-images');
CREATE POLICY "blog-images auth update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'blog-images');
CREATE POLICY "blog-images auth delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'blog-images');
