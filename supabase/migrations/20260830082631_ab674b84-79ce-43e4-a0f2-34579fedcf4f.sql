CREATE TABLE public.push_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  platform text NOT NULL DEFAULT 'web',
  user_agent text,
  lat numeric,
  lng numeric,
  city text,
  is_active boolean NOT NULL DEFAULT true,
  topics text[] NOT NULL DEFAULT ARRAY['all']::text[],
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_devices TO authenticated;
GRANT INSERT, UPDATE ON public.push_devices TO anon;
GRANT ALL ON public.push_devices TO service_role;

ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register a device"
  ON public.push_devices FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Anyone can refresh their device row"
  ON public.push_devices FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can view their own devices"
  ON public.push_devices FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own devices"
  ON public.push_devices FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_push_devices_updated_at
  BEFORE UPDATE ON public.push_devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_push_devices_user ON public.push_devices(user_id);
CREATE INDEX idx_push_devices_active ON public.push_devices(is_active);

CREATE TABLE public.push_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL,
  banner_url text,
  icon_url text,
  tag text,
  action_url text,
  audience text NOT NULL DEFAULT 'all',
  audience_city text,
  audience_lat numeric,
  audience_lng numeric,
  radius_km integer NOT NULL DEFAULT 30,
  source text NOT NULL DEFAULT 'admin',
  status text NOT NULL DEFAULT 'draft',
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.push_campaigns TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_campaigns TO authenticated;
GRANT ALL ON public.push_campaigns TO service_role;

ALTER TABLE public.push_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sent campaigns"
  ON public.push_campaigns FOR SELECT TO anon, authenticated
  USING (status = 'sent');

CREATE POLICY "Admins manage campaigns"
  ON public.push_campaigns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_push_campaigns_updated_at
  BEFORE UPDATE ON public.push_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.nearby_push_devices(_lat numeric, _lng numeric, _radius_km numeric DEFAULT 30)
RETURNS TABLE (id uuid, token text, user_id uuid, distance_km numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.id, d.token, d.user_id,
    (6371 * acos(
      least(1, greatest(-1,
        cos(radians(_lat)) * cos(radians(d.lat)) * cos(radians(d.lng) - radians(_lng))
        + sin(radians(_lat)) * sin(radians(d.lat))
      ))
    ))::numeric AS distance_km
  FROM public.push_devices d
  WHERE d.is_active
    AND d.lat IS NOT NULL
    AND d.lng IS NOT NULL
    AND (6371 * acos(
      least(1, greatest(-1,
        cos(radians(_lat)) * cos(radians(d.lat)) * cos(radians(d.lng) - radians(_lng))
        + sin(radians(_lat)) * sin(radians(d.lat))
      ))
    )) <= _radius_km
$$;