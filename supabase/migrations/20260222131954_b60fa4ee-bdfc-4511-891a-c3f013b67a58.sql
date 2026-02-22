
-- Fix visitor_views INSERT to restrict to authenticated or limit
DROP POLICY IF EXISTS "Anyone can insert views" ON public.visitor_views;
CREATE POLICY "Authenticated users can insert views" ON public.visitor_views FOR INSERT TO authenticated WITH CHECK (true);

-- Fix notifications INSERT policy (pre-existing)
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Authenticated can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
