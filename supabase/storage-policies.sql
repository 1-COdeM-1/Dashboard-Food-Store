-- =============================================================================
-- REQUIRED: Run this once in Supabase Dashboard → SQL Editor → New query
-- Project: irfovbxdujtccvztsfyb
-- Bucket:  products IMAGES
--
-- Without these policies, uploads fail with:
--   "new row violates row-level security policy"
-- =============================================================================

-- Make sure the bucket exists and is public (for getPublicUrl)
INSERT INTO storage.buckets (id, name, public)
VALUES ('products IMAGES', 'products IMAGES', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Remove older/conflicting policies on this bucket (safe if they don't exist)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        qual::text ILIKE '%products IMAGES%'
        OR with_check::text ILIKE '%products IMAGES%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- SELECT: anyone can read (storefront + admin image previews)
CREATE POLICY "product_images_public_select"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'products IMAGES');

-- INSERT: logged-in admin can upload
CREATE POLICY "product_images_authenticated_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products IMAGES');

-- UPDATE: logged-in admin can replace
CREATE POLICY "product_images_authenticated_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'products IMAGES')
WITH CHECK (bucket_id = 'products IMAGES');

-- DELETE: logged-in admin can remove
CREATE POLICY "product_images_authenticated_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'products IMAGES');
