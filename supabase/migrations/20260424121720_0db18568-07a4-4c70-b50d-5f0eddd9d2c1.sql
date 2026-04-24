-- Garante índice trigram GIN sobre a descrição normalizada (acelera operador %)
CREATE INDEX IF NOT EXISTS idx_parts_desc_unaccent_trgm
  ON public.parts USING gin (lower(public.immutable_unaccent(description)) gin_trgm_ops);

-- Reescreve classify_parts_v4 com estágio 2 otimizado:
--   1) Materializa unclassified + sinônimos numa CTE.
--   2) Usa o operador % (trigram) como pré-filtro — bate o GIN.
--   3) Só então calcula similarity() nos pares sobreviventes.
--   4) DISTINCT ON pega o melhor sinônimo por (part, subcategory).
CREATE OR REPLACE FUNCTION public.classify_parts_v4(_only_missing boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_stage1 int := 0; v_stage2 int := 0; v_stage3 int := 0; v_stage4 int := 0; v_review int := 0;
  v_total int;
  r RECORD; tax RECORD;
  v_text_norm text;
  v_attrs jsonb; v_match text[]; v_key text; v_pattern text;
BEGIN
  IF NOT _only_missing THEN
    UPDATE public.parts SET subcategory=NULL, subcategory_source=NULL,
      subcategory_confidence=NULL, attributes='{}'::jsonb, needs_review=false,
      classification_method=NULL;
  END IF;

  -- Sobe o limiar do operador % para reduzir candidatos no estágio 2.
  PERFORM set_limit(0.45);

  -- ============ STAGE 1: dictionary ============
  FOR r IN
    SELECT id, description, material FROM public.parts WHERE subcategory IS NULL
  LOOP
    v_text_norm := lower(public.immutable_unaccent(coalesce(r.description,'') || ' ' || coalesce(r.material,'')));

    FOR tax IN
      SELECT * FROM public.subcategory_taxonomy WHERE active ORDER BY priority ASC
    LOOP
      IF tax.negative_terms IS NOT NULL AND array_length(tax.negative_terms,1) > 0 THEN
        IF EXISTS (SELECT 1 FROM unnest(tax.negative_terms) n WHERE v_text_norm ~* n) THEN
          CONTINUE;
        END IF;
      END IF;

      IF EXISTS (
        SELECT 1 FROM unnest(tax.synonyms_pt || tax.synonyms_en || tax.synonyms_es) s
        WHERE v_text_norm ~* ('\m' || s || '\M')
      ) THEN
        v_attrs := '{}'::jsonb;
        FOR v_key, v_pattern IN
          SELECT je.key, je.value FROM jsonb_each_text(coalesce(tax.attribute_extractors,'{}'::jsonb)) je
        LOOP
          v_match := regexp_match(v_text_norm, v_pattern);
          IF v_match IS NOT NULL THEN
            IF v_key LIKE 'tipo_%' THEN
              v_attrs := v_attrs || jsonb_build_object('tipo', initcap(replace(v_key,'tipo_','')));
            ELSIF v_key LIKE 'fluido_%' THEN
              v_attrs := v_attrs || jsonb_build_object('fluido', initcap(replace(v_key,'fluido_','')));
            ELSIF v_key LIKE 'posicao_%' THEN
              v_attrs := v_attrs || jsonb_build_object('posicao', initcap(replace(v_key,'posicao_','')));
            ELSIF v_key LIKE 'componente_%' THEN
              v_attrs := v_attrs || jsonb_build_object('componente', initcap(replace(v_key,'componente_','')));
            ELSIF v_key LIKE 'grandeza_%' THEN
              v_attrs := v_attrs || jsonb_build_object('grandeza', initcap(replace(v_key,'grandeza_','')));
            ELSIF v_key = 'medida_radial' AND array_length(v_match,1) >= 2 THEN
              v_attrs := v_attrs || jsonb_build_object('medida', upper(v_match[1] || 'R' || v_match[2]), 'aro', v_match[2], 'tipo','Radial');
            ELSIF v_key = 'medida_diagonal' AND array_length(v_match,1) >= 2 THEN
              v_attrs := v_attrs || jsonb_build_object('medida', v_match[1] || '-' || v_match[2], 'aro', v_match[2], 'tipo','Diagonal');
            ELSIF v_key = 'medida_metric' AND array_length(v_match,1) >= 3 THEN
              v_attrs := v_attrs || jsonb_build_object('medida', v_match[1] || '/' || v_match[2] || 'R' || v_match[3], 'aro', v_match[3]);
            ELSE
              v_attrs := v_attrs || jsonb_build_object(v_key, upper(v_match[1]));
            END IF;
          END IF;
        END LOOP;

        UPDATE public.parts
        SET subcategory = tax.subcategory, subcategory_source = 'dict',
            classification_method = 'dict', subcategory_confidence = 0.95,
            attributes = coalesce(attributes,'{}'::jsonb) || v_attrs,
            needs_review = false
        WHERE id = r.id;
        v_stage1 := v_stage1 + 1;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;

  -- ============ STAGE 2: fuzzy (otimizado, usa GIN trgm) ============
  WITH unclassified AS (
    SELECT p.id,
           lower(public.immutable_unaccent(p.description)) AS desc_norm
    FROM public.parts p
    WHERE p.subcategory IS NULL
      AND length(p.description) >= 4
  ),
  syns AS (
    SELECT t.subcategory, t.negative_terms, s AS syn
    FROM public.subcategory_taxonomy t
    CROSS JOIN LATERAL unnest(t.synonyms_pt || t.synonyms_en || t.synonyms_es) s
    WHERE t.active AND length(s) >= 4
  ),
  -- Pré-filtro via operador % (índice GIN trgm). Só pares "potencialmente similares" sobrevivem.
  cand AS (
    SELECT u.id, sy.subcategory, sy.negative_terms, sy.syn, u.desc_norm
    FROM unclassified u
    JOIN syns sy ON u.desc_norm % sy.syn
  ),
  -- Aplica negative_terms e calcula similarity real apenas no resíduo.
  scored AS (
    SELECT c.id, c.subcategory,
           similarity(c.desc_norm, c.syn) AS sim
    FROM cand c
    WHERE NOT EXISTS (
      SELECT 1 FROM unnest(c.negative_terms) n WHERE c.desc_norm ~* n
    )
      AND similarity(c.desc_norm, c.syn) > 0.45
  ),
  best AS (
    SELECT DISTINCT ON (id) id, subcategory, sim
    FROM scored
    ORDER BY id, sim DESC
  )
  UPDATE public.parts p
  SET subcategory = b.subcategory, subcategory_source = 'fuzzy',
      classification_method = 'fuzzy', subcategory_confidence = round(b.sim::numeric, 2)
  FROM best b
  WHERE p.id = b.id AND p.subcategory IS NULL;
  GET DIAGNOSTICS v_stage2 = ROW_COUNT;

  -- ============ STAGE 3: inherit from part_category ============
  WITH cat_dom AS (
    SELECT part_category,
           mode() WITHIN GROUP (ORDER BY subcategory) AS dom_sub
    FROM public.parts
    WHERE part_category IS NOT NULL AND part_category <> ''
    GROUP BY part_category
    HAVING count(*) FILTER (WHERE subcategory IS NOT NULL) >= 5
       AND count(*) FILTER (WHERE subcategory IS NOT NULL)::float / count(*) >= 0.6
  )
  UPDATE public.parts p
  SET subcategory = c.dom_sub, subcategory_source = 'inherit',
      classification_method = 'inherit', subcategory_confidence = 0.6
  FROM cat_dom c
  WHERE p.part_category = c.part_category AND p.subcategory IS NULL;
  GET DIAGNOSTICS v_stage3 = ROW_COUNT;

  -- ============ STAGE 4: code prefix cluster ============
  WITH clusters AS (
    SELECT substring(material, 1, 6) AS prefix,
           mode() WITHIN GROUP (ORDER BY subcategory) AS dom_sub
    FROM public.parts
    WHERE length(material) >= 6
    GROUP BY substring(material,1,6)
    HAVING count(*) FILTER (WHERE subcategory IS NOT NULL) >= 3
       AND count(*) FILTER (WHERE subcategory IS NOT NULL)::float / count(*) >= 0.7
  )
  UPDATE public.parts p
  SET subcategory = c.dom_sub, subcategory_source = 'code_cluster',
      classification_method = 'code_cluster', subcategory_confidence = 0.55
  FROM clusters c
  WHERE substring(p.material,1,6) = c.prefix AND p.subcategory IS NULL;
  GET DIAGNOSTICS v_stage4 = ROW_COUNT;

  -- ============ STAGE 5: review queue ============
  UPDATE public.parts SET needs_review = true, classification_method = 'review'
  WHERE subcategory IS NULL;
  GET DIAGNOSTICS v_review = ROW_COUNT;

  SELECT count(*) INTO v_total FROM public.parts;
  RETURN jsonb_build_object(
    'stage1_dict', v_stage1, 'stage2_fuzzy', v_stage2,
    'stage3_inherit', v_stage3, 'stage4_code_cluster', v_stage4,
    'stage5_review', v_review, 'total', v_total,
    'classified', v_total - v_review,
    'coverage_pct', round(((v_total - v_review)::numeric / nullif(v_total,0)) * 100, 2)
  );
END$function$;