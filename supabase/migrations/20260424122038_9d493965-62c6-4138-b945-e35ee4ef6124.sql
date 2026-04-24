DO $$
DECLARE
  v_stage2 int := 0; v_stage3 int := 0; v_stage4 int := 0; v_review int := 0;
BEGIN
  PERFORM set_limit(0.45);

  -- STAGE 2: fuzzy via GIN trgm (pré-filtro com %)
  WITH unclassified AS (
    SELECT p.id, lower(public.immutable_unaccent(p.description)) AS desc_norm
    FROM public.parts p WHERE p.subcategory IS NULL AND length(p.description) >= 4
  ),
  syns AS (
    SELECT t.subcategory, t.negative_terms, s AS syn
    FROM public.subcategory_taxonomy t
    CROSS JOIN LATERAL unnest(t.synonyms_pt || t.synonyms_en || t.synonyms_es) s
    WHERE t.active AND length(s) >= 4
  ),
  cand AS (
    SELECT u.id, sy.subcategory, sy.negative_terms, sy.syn, u.desc_norm
    FROM unclassified u JOIN syns sy ON u.desc_norm % sy.syn
  ),
  scored AS (
    SELECT c.id, c.subcategory, similarity(c.desc_norm, c.syn) AS sim
    FROM cand c
    WHERE NOT EXISTS (SELECT 1 FROM unnest(c.negative_terms) n WHERE c.desc_norm ~* n)
      AND similarity(c.desc_norm, c.syn) > 0.45
  ),
  best AS (
    SELECT DISTINCT ON (id) id, subcategory, sim FROM scored ORDER BY id, sim DESC
  )
  UPDATE public.parts p
  SET subcategory = b.subcategory, subcategory_source = 'fuzzy',
      classification_method = 'fuzzy', subcategory_confidence = round(b.sim::numeric, 2)
  FROM best b WHERE p.id = b.id AND p.subcategory IS NULL;
  GET DIAGNOSTICS v_stage2 = ROW_COUNT;
  RAISE NOTICE 'stage2_fuzzy: %', v_stage2;

  -- STAGE 3: inherit
  WITH cat_dom AS (
    SELECT part_category, mode() WITHIN GROUP (ORDER BY subcategory) AS dom_sub
    FROM public.parts
    WHERE part_category IS NOT NULL AND part_category <> ''
    GROUP BY part_category
    HAVING count(*) FILTER (WHERE subcategory IS NOT NULL) >= 5
       AND count(*) FILTER (WHERE subcategory IS NOT NULL)::float / count(*) >= 0.6
  )
  UPDATE public.parts p
  SET subcategory = c.dom_sub, subcategory_source = 'inherit',
      classification_method = 'inherit', subcategory_confidence = 0.6
  FROM cat_dom c WHERE p.part_category = c.part_category AND p.subcategory IS NULL;
  GET DIAGNOSTICS v_stage3 = ROW_COUNT;
  RAISE NOTICE 'stage3_inherit: %', v_stage3;

  -- STAGE 4: code cluster
  WITH clusters AS (
    SELECT substring(material, 1, 6) AS prefix,
           mode() WITHIN GROUP (ORDER BY subcategory) AS dom_sub
    FROM public.parts WHERE length(material) >= 6
    GROUP BY substring(material,1,6)
    HAVING count(*) FILTER (WHERE subcategory IS NOT NULL) >= 3
       AND count(*) FILTER (WHERE subcategory IS NOT NULL)::float / count(*) >= 0.7
  )
  UPDATE public.parts p
  SET subcategory = c.dom_sub, subcategory_source = 'code_cluster',
      classification_method = 'code_cluster', subcategory_confidence = 0.55
  FROM clusters c WHERE substring(p.material,1,6) = c.prefix AND p.subcategory IS NULL;
  GET DIAGNOSTICS v_stage4 = ROW_COUNT;
  RAISE NOTICE 'stage4_cluster: %', v_stage4;

  -- STAGE 5: review queue
  UPDATE public.parts SET needs_review = true, classification_method = 'review'
  WHERE subcategory IS NULL;
  GET DIAGNOSTICS v_review = ROW_COUNT;
  RAISE NOTICE 'stage5_review: %', v_review;
END$$;