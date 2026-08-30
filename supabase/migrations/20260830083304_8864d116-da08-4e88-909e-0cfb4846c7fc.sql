-- CATEGORIES
CREATE TABLE public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_categories TO anon, authenticated;
GRANT ALL ON public.service_categories TO service_role;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active categories" ON public.service_categories
  FOR SELECT TO anon, authenticated USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage categories" ON public.service_categories
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.service_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);
GRANT SELECT ON public.service_subcategories TO anon, authenticated;
GRANT ALL ON public.service_subcategories TO service_role;
ALTER TABLE public.service_subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subcategories" ON public.service_subcategories
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage subcategories" ON public.service_subcategories
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- VENDORS
CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.service_categories(id) ON DELETE SET NULL,
  business_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  tagline text,
  description text,
  logo_url text,
  banner_url text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  address text,
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  pincode text,
  map_lat numeric,
  map_lng numeric,
  contact_phone text,
  whatsapp_number text,
  contact_email text,
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  opening_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo_title text,
  seo_description text,
  upi_id text,
  status library_status NOT NULL DEFAULT 'pending',
  is_featured boolean NOT NULL DEFAULT false,
  average_rating numeric NOT NULL DEFAULT 0,
  total_reviews integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vendors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view approved vendors" ON public.vendors
  FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "Vendors view own store" ON public.vendors
  FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vendors create own store" ON public.vendors
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Vendors update own store" ON public.vendors
  FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete vendors" ON public.vendors
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_vendors_category ON public.vendors(category_id);
CREATE INDEX idx_vendors_city ON public.vendors(city);

CREATE OR REPLACE FUNCTION public.generate_vendor_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base_slug text; final_slug text; counter integer := 1;
BEGIN
  base_slug := trim(both '-' from lower(regexp_replace(NEW.business_name, '[^a-zA-Z0-9]+', '-', 'g')));
  IF base_slug = '' THEN base_slug := 'vendor'; END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.vendors WHERE slug = final_slug AND id <> NEW.id) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  NEW.slug := final_slug;
  RETURN NEW;
END; $$;
CREATE TRIGGER generate_vendor_slug_trigger BEFORE INSERT OR UPDATE OF business_name ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.generate_vendor_slug();

-- VENDOR SERVICES
CREATE TABLE public.vendor_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  subcategory_id uuid REFERENCES public.service_subcategories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  price_unit text NOT NULL DEFAULT 'per service',
  discount_percent integer NOT NULL DEFAULT 0,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vendor_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_services TO authenticated;
GRANT ALL ON public.vendor_services TO service_role;
ALTER TABLE public.vendor_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view services of approved vendors" ON public.vendor_services
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.status = 'approved'));
CREATE POLICY "Vendors manage own services" ON public.vendor_services
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND (v.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND (v.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE TRIGGER update_vendor_services_updated_at BEFORE UPDATE ON public.vendor_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ORDERS
CREATE TABLE public.vendor_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.vendor_services(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_for timestamptz,
  quantity integer NOT NULL DEFAULT 1,
  amount numeric NOT NULL DEFAULT 0,
  status booking_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  notes text,
  address text,
  contact_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.vendor_orders TO authenticated;
GRANT ALL ON public.vendor_orders TO service_role;
ALTER TABLE public.vendor_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers view own orders" ON public.vendor_orders
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_id = auth.uid()));
CREATE POLICY "Customers create orders" ON public.vendor_orders
  FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Vendor or customer update order" ON public.vendor_orders
  FOR UPDATE TO authenticated
  USING (customer_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_id = auth.uid()))
  WITH CHECK (customer_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_id = auth.uid()));
CREATE TRIGGER update_vendor_orders_updated_at BEFORE UPDATE ON public.vendor_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- REVIEWS (verified buyers only)
CREATE TABLE public.vendor_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.vendor_orders(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, user_id)
);
GRANT SELECT ON public.vendor_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_reviews TO authenticated;
GRANT ALL ON public.vendor_reviews TO service_role;
ALTER TABLE public.vendor_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read approved reviews" ON public.vendor_reviews
  FOR SELECT TO anon, authenticated USING (is_approved OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Verified buyers can review" ON public.vendor_reviews
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.vendor_orders o
    WHERE o.vendor_id = vendor_reviews.vendor_id
      AND o.customer_id = auth.uid()
      AND o.status = 'completed'));
CREATE POLICY "Users update own review" ON public.vendor_reviews
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users or admins delete review" ON public.vendor_reviews
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_vendor_reviews_updated_at BEFORE UPDATE ON public.vendor_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_vendor_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.vendors SET
    average_rating = (SELECT COALESCE(AVG(rating), 0) FROM public.vendor_reviews WHERE vendor_id = COALESCE(NEW.vendor_id, OLD.vendor_id) AND is_approved),
    total_reviews = (SELECT COUNT(*) FROM public.vendor_reviews WHERE vendor_id = COALESCE(NEW.vendor_id, OLD.vendor_id) AND is_approved)
  WHERE id = COALESCE(NEW.vendor_id, OLD.vendor_id);
  RETURN COALESCE(NEW, OLD);
END; $$;
REVOKE ALL ON FUNCTION public.update_vendor_rating() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER update_vendor_rating_on_review AFTER INSERT OR UPDATE OR DELETE ON public.vendor_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_vendor_rating();

-- SEED CATEGORIES
INSERT INTO public.service_categories (name, slug, icon, description, sort_order) VALUES
  ('Gym & Fitness', 'gym', 'Dumbbell', 'Gyms, fitness studios and personal trainers', 1),
  ('Cafe & Restaurant', 'cafe', 'Coffee', 'Study cafes, restaurants and hangout spots', 2),
  ('Tiffin & Food Service', 'food', 'UtensilsCrossed', 'Tiffin services, home-visit cooks and meal plans', 3),
  ('Furniture on Rent', 'furniture-rent', 'Sofa', 'Beds, tables, chairs, fridge and appliances on rent', 4),
  ('Laundry & Ironing', 'laundry', 'Shirt', 'Washing, dry cleaning and ironing services', 5),
  ('Home & Bathroom Cleaning', 'cleaning', 'Sparkles', 'Deep cleaning for homes, rooms and bathrooms', 6),
  ('Electrician & Repairs', 'electrician', 'Zap', 'Electricians, plumbers and appliance repair', 7);

INSERT INTO public.service_subcategories (category_id, name, slug)
SELECT c.id, s.name, s.slug FROM public.service_categories c
JOIN (VALUES
  ('gym', 'Monthly Membership', 'monthly-membership'),
  ('gym', 'Personal Training', 'personal-training'),
  ('gym', 'Yoga & Zumba', 'yoga-zumba'),
  ('cafe', 'Study Cafe Seat', 'study-cafe-seat'),
  ('cafe', 'Dine In', 'dine-in'),
  ('cafe', 'Takeaway', 'takeaway'),
  ('food', 'Daily Tiffin', 'daily-tiffin'),
  ('food', 'Monthly Meal Plan', 'monthly-meal-plan'),
  ('food', 'Home Visit Cook', 'home-visit-cook'),
  ('furniture-rent', 'Bed & Mattress', 'bed-mattress'),
  ('furniture-rent', 'Study Table & Chair', 'study-table-chair'),
  ('furniture-rent', 'Fridge & Appliances', 'fridge-appliances'),
  ('laundry', 'Wash & Fold', 'wash-fold'),
  ('laundry', 'Dry Cleaning', 'dry-cleaning'),
  ('laundry', 'Ironing Only', 'ironing'),
  ('cleaning', 'Room Deep Clean', 'room-deep-clean'),
  ('cleaning', 'Bathroom Cleaning', 'bathroom-cleaning'),
  ('cleaning', 'Full Home Cleaning', 'full-home-cleaning'),
  ('electrician', 'Electrical Repair', 'electrical-repair'),
  ('electrician', 'Plumbing', 'plumbing'),
  ('electrician', 'AC & Appliance Service', 'ac-appliance-service')
) AS s(cat_slug, name, slug) ON c.slug = s.cat_slug;