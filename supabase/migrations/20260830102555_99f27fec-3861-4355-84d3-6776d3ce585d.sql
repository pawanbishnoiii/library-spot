
-- fix mutable search_path on legacy functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.generate_library_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base_slug TEXT; final_slug TEXT; counter INTEGER := 1;
BEGIN
  base_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.libraries WHERE slug = final_slug AND id != NEW.id) LOOP
    final_slug := base_slug || '-' || counter; counter := counter + 1;
  END LOOP;
  NEW.slug := final_slug; RETURN NEW;
END; $$;

-- revoke direct API execution on internal helpers (RLS + triggers still work)
REVOKE EXECUTE ON FUNCTION public.is_listing_owner(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_listing_public(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.nearby_push_devices(numeric, numeric, numeric) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_listing_rating() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_library_rating() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_vendor_rating() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_vendor_slug() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_listing_slug() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_library_slug() FROM anon, authenticated;
