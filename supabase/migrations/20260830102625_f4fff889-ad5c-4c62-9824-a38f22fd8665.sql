
REVOKE EXECUTE ON FUNCTION public.is_listing_owner(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_listing_public(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.nearby_push_devices(numeric, numeric, numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_listing_rating() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_library_rating() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_vendor_rating() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_vendor_slug() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_listing_slug() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_library_slug() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nearby_listings(numeric, numeric, numeric, text, int) TO anon, authenticated;
