-- Helper: aplica o estágio dicionário para UMA subcategoria de cada vez (vetorizado em SQL).
-- Permite executar em pequenos blocos sem prender a transação.
CREATE OR REPLACE FUNCTION public.classify_dict_for(_subcategory text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count int := 0;
  tax RECORD;
  v_neg_pattern text;
  v_syn_pattern text;
BEGIN
  SELECT * INTO tax FROM public.subcategory_taxonomy
  WHERE subcategory = _subcategory AND active LIMIT 1;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Monta um único alternation regex para sinônimos e termos negativos.
  SELECT '(' || string_agg('\m' || s || '\M', '|') || ')'
    INTO v_syn_pattern
  FROM unnest(tax.synonyms_pt || tax.synonyms_en || tax.synonyms_es) s
  WHERE length(s) > 0;

  IF v_syn_pattern IS NULL THEN RETURN 0; END IF;

  IF tax.negative_terms IS NOT NULL AND array_length(tax.negative_terms, 1) > 0 THEN
    SELECT '(' || string_agg(n, '|') || ')'
      INTO v_neg_pattern
    FROM unnest(tax.negative_terms) n WHERE length(n) > 0;
  END IF;

  WITH targets AS (
    SELECT id,
           lower(public.immutable_unaccent(coalesce(description,'') || ' ' || coalesce(material,''))) AS txt
    FROM public.parts
    WHERE subcategory IS NULL
  ),
  matched AS (
    SELECT id FROM targets
    WHERE txt ~* v_syn_pattern
      AND (v_neg_pattern IS NULL OR txt !~* v_neg_pattern)
  )
  UPDATE public.parts p
  SET subcategory = tax.subcategory,
      subcategory_source = 'dict',
      classification_method = 'dict',
      subcategory_confidence = 0.95,
      needs_review = false
  FROM matched m
  WHERE p.id = m.id AND p.subcategory IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END$function$;

-- Roda o estágio 1 vetorizado em ordem de prioridade (mais específico primeiro).
-- Cada subcategoria é uma operação SQL única — rápida e indexável.
DO $$
DECLARE
  s RECORD;
  n int;
BEGIN
  FOR s IN
    SELECT subcategory FROM public.subcategory_taxonomy
    WHERE active ORDER BY priority ASC, subcategory ASC
  LOOP
    n := public.classify_dict_for(s.subcategory);
    RAISE NOTICE 'dict %: % rows', s.subcategory, n;
  END LOOP;
END$$;