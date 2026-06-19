
-- =========================
-- PART IMAGES
-- =========================
CREATE TABLE public.part_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id uuid NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  url text NOT NULL,
  storage_path text,
  position integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  alt_text text,
  width integer,
  height integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.part_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.part_images TO authenticated;
GRANT ALL ON public.part_images TO service_role;

ALTER TABLE public.part_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "part_images public read" ON public.part_images FOR SELECT USING (true);
CREATE POLICY "part_images auth insert" ON public.part_images FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "part_images auth update" ON public.part_images FOR UPDATE TO authenticated USING (true);
CREATE POLICY "part_images auth delete" ON public.part_images FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_part_images_part_id ON public.part_images(part_id, position);

CREATE TRIGGER trg_part_images_updated_at BEFORE UPDATE ON public.part_images
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- BLOG CATEGORIES
-- =========================
CREATE TABLE public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.blog_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_categories TO authenticated;
GRANT ALL ON public.blog_categories TO service_role;

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_categories public read" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "blog_categories auth manage" ON public.blog_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_blog_categories_updated_at BEFORE UPDATE ON public.blog_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.blog_categories (slug, name, description) VALUES
('manutencao','Manutenção','Dicas e guias de manutenção de máquinas pesadas'),
('pecas-xcmg','Peças XCMG','Tudo sobre peças originais XCMG'),
('mineracao','Mineração','Equipamentos e peças para mineração'),
('linha-amarela','Linha Amarela','Escavadeiras, pás carregadeiras e tratores'),
('dicas-tecnicas','Dicas Técnicas','Conhecimento técnico para operadores e mecânicos');

-- =========================
-- BLOG POSTS
-- =========================
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content_md text NOT NULL DEFAULT '',
  cover_url text,
  cover_storage_path text,
  author_id uuid,
  author_name text,
  category_slug text REFERENCES public.blog_categories(slug) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_at timestamptz,
  tags text[] NOT NULL DEFAULT '{}',
  related_part_ids uuid[] NOT NULL DEFAULT '{}',
  seo_title text,
  seo_description text,
  views integer NOT NULL DEFAULT 0,
  ai_generated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_posts public read published" ON public.blog_posts
  FOR SELECT USING (status = 'published');
CREATE POLICY "blog_posts auth read all" ON public.blog_posts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "blog_posts auth manage" ON public.blog_posts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_blog_posts_status_pub ON public.blog_posts(status, published_at DESC);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category_slug);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);

CREATE TRIGGER trg_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
