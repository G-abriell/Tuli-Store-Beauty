--------------------------------------------------------------
-- Migration: Remove coupon/loyalty system
-- Run this script manually in the Supabase SQL Editor.
-- Existing orders are preserved; only coupon data is removed.
--------------------------------------------------------------

-- 1. Fix site_config trigger (was referencing touch_cupom_atualizado_em)
DROP TRIGGER IF EXISTS site_config_touch_atualizado_em ON public.site_config;
CREATE TRIGGER site_config_touch_atualizado_em
BEFORE UPDATE ON public.site_config
FOR EACH ROW EXECUTE FUNCTION public.touch_atualizado_em();

-- 2. Drop RLS policy on cupons_controle
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.cupons_controle;

-- 3. Drop trigger on cupons_controle
DROP TRIGGER IF EXISTS cupons_touch_atualizado_em ON public.cupons_controle;

-- 4. Drop the cupons_controle table (and its RLS)
DROP TABLE IF EXISTS public.cupons_controle;

-- 5. Remove cupom_aplicado column from pedidos
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS cupom_aplicado;

-- 6. Drop the coupon-specific trigger function (no longer needed)
DROP FUNCTION IF EXISTS public.touch_cupom_atualizado_em();

-- 7. Update the default site config banner (replace coupon banner)
-- Only runs if the banner with id "cupom" exists in the JSONB array
UPDATE public.site_config
SET banners = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'id' = 'cupom' THEN
        jsonb_build_object(
          'id', 'novidades',
          'titulo', 'Novidades chegaram',
          'subtitulo', 'Confira os lançamentos e produtos em destaque da semana.',
          'etiqueta', 'Em destaque',
          'imagem', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1600&q=80'
        )
      ELSE elem
    END
  )
  FROM jsonb_array_elements(banners) AS elem
)
WHERE id = 'default'
  AND banners @> '[{"id": "cupom"}]'::jsonb;
