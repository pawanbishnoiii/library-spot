
-- Rooms table for PG/Hostel properties
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  library_id UUID NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_type TEXT NOT NULL DEFAULT 'shared',
  max_persons INTEGER NOT NULL DEFAULT 1,
  current_occupancy INTEGER NOT NULL DEFAULT 0,
  price_per_bed NUMERIC NOT NULL DEFAULT 0,
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  floor_number INTEGER DEFAULT 0,
  has_attached_bath BOOLEAN DEFAULT false,
  has_ac BOOLEAN DEFAULT false,
  has_wifi BOOLEAN DEFAULT true,
  has_balcony BOOLEAN DEFAULT false,
  has_wardrobe BOOLEAN DEFAULT true,
  has_study_table BOOLEAN DEFAULT true,
  extra_requirements TEXT,
  permissions TEXT,
  policies TEXT,
  is_available BOOLEAN DEFAULT true,
  is_disabled BOOLEAN DEFAULT false,
  images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Beds within rooms
CREATE TABLE public.beds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  library_id UUID NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  bed_number INTEGER NOT NULL,
  bed_type TEXT DEFAULT 'single',
  is_occupied BOOLEAN DEFAULT false,
  is_disabled BOOLEAN DEFAULT false,
  occupant_id UUID,
  price_override NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Wishlist / Saved properties
CREATE TABLE public.wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  library_id UUID NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, library_id)
);

-- Visitor views tracking
CREATE TABLE public.visitor_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  library_id UUID NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  viewer_id UUID,
  ip_address TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_views ENABLE ROW LEVEL SECURITY;

-- Rooms policies
CREATE POLICY "Anyone can view rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Owners can manage rooms" ON public.rooms FOR ALL USING (
  EXISTS (SELECT 1 FROM libraries WHERE libraries.id = rooms.library_id AND libraries.owner_id = auth.uid())
);

-- Beds policies
CREATE POLICY "Anyone can view beds" ON public.beds FOR SELECT USING (true);
CREATE POLICY "Owners can manage beds" ON public.beds FOR ALL USING (
  EXISTS (SELECT 1 FROM libraries WHERE libraries.id = beds.library_id AND libraries.owner_id = auth.uid())
);

-- Wishlist policies
CREATE POLICY "Users can view their wishlists" ON public.wishlists FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can add to wishlist" ON public.wishlists FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can remove from wishlist" ON public.wishlists FOR DELETE USING (user_id = auth.uid());

-- Visitor views policies
CREATE POLICY "Anyone can insert views" ON public.visitor_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can view their library views" ON public.visitor_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM libraries WHERE libraries.id = visitor_views.library_id AND libraries.owner_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Trigger for rooms updated_at
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add property_type to libraries
ALTER TABLE public.libraries ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'library';
ALTER TABLE public.libraries ADD COLUMN IF NOT EXISTS gender_preference TEXT DEFAULT 'co-ed';
ALTER TABLE public.libraries ADD COLUMN IF NOT EXISTS total_rooms INTEGER DEFAULT 0;
ALTER TABLE public.libraries ADD COLUMN IF NOT EXISTS total_beds INTEGER DEFAULT 0;
