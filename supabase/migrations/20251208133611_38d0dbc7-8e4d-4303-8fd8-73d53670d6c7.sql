-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'user');

-- Create library_status enum
CREATE TYPE public.library_status AS ENUM ('pending', 'approved', 'suspended', 'rejected');

-- Create payment_status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create booking_status enum
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Create notification_type enum
CREATE TYPE public.notification_type AS ENUM ('booking', 'payment', 'membership_expiry', 'approval', 'general');

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public profiles are viewable"
  ON public.profiles FOR SELECT
  USING (true);

-- ============================================
-- USER ROLES TABLE (Separate for security)
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ============================================
-- MEMBERSHIP PLANS TABLE
-- ============================================
CREATE TABLE public.membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_days INTEGER NOT NULL,
  max_seats INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
  ON public.membership_plans FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage plans"
  ON public.membership_plans FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- SEAT THEMES TABLE
-- ============================================
CREATE TABLE public.seat_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  seat_shape TEXT DEFAULT 'rounded',
  available_color TEXT DEFAULT '#22c55e',
  booked_color TEXT DEFAULT '#ef4444',
  selected_color TEXT DEFAULT '#3b82f6',
  prebooked_color TEXT DEFAULT '#eab308',
  disabled_color TEXT DEFAULT '#6b7280',
  seat_spacing INTEGER DEFAULT 4,
  row_spacing INTEGER DEFAULT 8,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seat_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view themes"
  ON public.seat_themes FOR SELECT
  USING (true);

-- ============================================
-- LIBRARIES TABLE
-- ============================================
CREATE TABLE public.libraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  banner_url TEXT,
  profile_url TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  map_lat DECIMAL(10,8),
  map_lng DECIMAL(11,8),
  contact_phone TEXT,
  contact_email TEXT,
  whatsapp_number TEXT,
  facilities JSONB DEFAULT '[]'::jsonb,
  opening_hours JSONB DEFAULT '{}'::jsonb,
  total_seats INTEGER DEFAULT 0,
  total_rows INTEGER DEFAULT 0,
  seats_per_row INTEGER DEFAULT 0,
  upi_id TEXT,
  status library_status DEFAULT 'pending',
  theme_id UUID REFERENCES public.seat_themes(id),
  average_rating DECIMAL(2,1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.libraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved libraries"
  ON public.libraries FOR SELECT
  USING (status = 'approved' OR owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can insert their library"
  ON public.libraries FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their library"
  ON public.libraries FOR UPDATE
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete libraries"
  ON public.libraries FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- STAFF TABLE
-- ============================================
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Staff',
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view staff"
  ON public.staff FOR SELECT
  USING (true);

CREATE POLICY "Owners can manage their staff"
  ON public.staff FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.libraries 
      WHERE id = library_id AND owner_id = auth.uid()
    )
  );

-- ============================================
-- SHIFTS TABLE
-- ============================================
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  price_per_seat DECIMAL(10,2) NOT NULL,
  monthly_price DECIMAL(10,2),
  discount_percent INTEGER DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shifts"
  ON public.shifts FOR SELECT
  USING (true);

CREATE POLICY "Owners can manage shifts"
  ON public.shifts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.libraries 
      WHERE id = library_id AND owner_id = auth.uid()
    )
  );

-- ============================================
-- SEATS TABLE
-- ============================================
CREATE TABLE public.seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  row_label TEXT NOT NULL,
  seat_number INTEGER NOT NULL,
  is_disabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (library_id, row_label, seat_number)
);

ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seats"
  ON public.seats FOR SELECT
  USING (true);

CREATE POLICY "Owners can manage seats"
  ON public.seats FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.libraries 
      WHERE id = library_id AND owner_id = auth.uid()
    )
  );

-- ============================================
-- BOOKINGS TABLE
-- ============================================
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  library_id UUID NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_monthly BOOLEAN DEFAULT false,
  total_amount DECIMAL(10,2) NOT NULL,
  discount_applied DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  booking_status booking_status DEFAULT 'pending',
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their bookings"
  ON public.bookings FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.libraries 
      WHERE id = library_id AND owner_id = auth.uid()
    ) OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users and owners can update bookings"
  ON public.bookings FOR UPDATE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.libraries 
      WHERE id = library_id AND owner_id = auth.uid()
    ) OR
    public.has_role(auth.uid(), 'admin')
  );

-- ============================================
-- BOOKING SEATS TABLE
-- ============================================
CREATE TABLE public.booking_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES public.seats(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_id, seat_id)
);

ALTER TABLE public.booking_seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view booking seats"
  ON public.booking_seats FOR SELECT
  USING (true);

CREATE POLICY "Users can create booking seats"
  ON public.booking_seats FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- OWNER MEMBERSHIPS TABLE
-- ============================================
CREATE TABLE public.owner_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.membership_plans(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  payment_status payment_status DEFAULT 'pending',
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.owner_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their memberships"
  ON public.owner_memberships FOR SELECT
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can create memberships"
  ON public.owner_memberships FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (library_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reviews"
  ON public.reviews FOR SELECT
  USING (is_approved = true OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their reviews"
  ON public.reviews FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their reviews"
  ON public.reviews FOR DELETE
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type notification_type DEFAULT 'general',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_libraries_updated_at
  BEFORE UPDATE ON public.libraries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_membership_plans_updated_at
  BEFORE UPDATE ON public.membership_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_owner_memberships_updated_at
  BEFORE UPDATE ON public.owner_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update library average rating
CREATE OR REPLACE FUNCTION public.update_library_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.libraries
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.reviews
      WHERE library_id = COALESCE(NEW.library_id, OLD.library_id) AND is_approved = true
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE library_id = COALESCE(NEW.library_id, OLD.library_id) AND is_approved = true
    )
  WHERE id = COALESCE(NEW.library_id, OLD.library_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_library_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_library_rating();

-- Function to generate slug from library name
CREATE OR REPLACE FUNCTION public.generate_library_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  base_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM public.libraries WHERE slug = final_slug AND id != NEW.id) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_library_slug_trigger
  BEFORE INSERT OR UPDATE OF name ON public.libraries
  FOR EACH ROW EXECUTE FUNCTION public.generate_library_slug();

-- Insert default seat themes
INSERT INTO public.seat_themes (name, seat_shape, available_color, booked_color, selected_color, prebooked_color, disabled_color)
VALUES 
  ('Classic', 'rounded', '#22c55e', '#ef4444', '#3b82f6', '#eab308', '#6b7280'),
  ('Modern', 'square', '#10b981', '#f43f5e', '#6366f1', '#f59e0b', '#9ca3af'),
  ('Minimal', 'pill', '#34d399', '#fb7185', '#818cf8', '#fbbf24', '#d1d5db');

-- Insert default membership plans
INSERT INTO public.membership_plans (name, description, price, duration_days, max_seats, features)
VALUES 
  ('Basic', 'Perfect for small libraries', 999, 30, 20, '["Up to 20 seats", "Basic analytics", "Email support"]'),
  ('Pro', 'Best for growing libraries', 2499, 30, 50, '["Up to 50 seats", "Advanced analytics", "Priority support", "Custom themes"]'),
  ('Premium', 'For large libraries', 4999, 30, 100, '["Unlimited seats", "Premium analytics", "24/7 support", "Custom themes", "API access"]');