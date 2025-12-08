CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'owner',
    'user'
);


--
-- Name: booking_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.booking_status AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'completed'
);


--
-- Name: library_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.library_status AS ENUM (
    'pending',
    'approved',
    'suspended',
    'rejected'
);


--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_type AS ENUM (
    'booking',
    'payment',
    'membership_expiry',
    'approval',
    'general'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);


--
-- Name: generate_library_slug(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_library_slug() RETURNS trigger
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


--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(_user_id uuid) RETURNS public.app_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: update_library_rating(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_library_rating() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: booking_seats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_seats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    seat_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    library_id uuid NOT NULL,
    shift_id uuid NOT NULL,
    booking_date date NOT NULL,
    start_date date NOT NULL,
    end_date date,
    is_monthly boolean DEFAULT false,
    total_amount numeric(10,2) NOT NULL,
    discount_applied numeric(10,2) DEFAULT 0,
    final_amount numeric(10,2) NOT NULL,
    payment_status public.payment_status DEFAULT 'pending'::public.payment_status,
    booking_status public.booking_status DEFAULT 'pending'::public.booking_status,
    payment_reference text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: libraries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.libraries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    banner_url text,
    profile_url text,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    pincode text NOT NULL,
    map_lat numeric(10,8),
    map_lng numeric(11,8),
    contact_phone text,
    contact_email text,
    whatsapp_number text,
    facilities jsonb DEFAULT '[]'::jsonb,
    opening_hours jsonb DEFAULT '{}'::jsonb,
    total_seats integer DEFAULT 0,
    total_rows integer DEFAULT 0,
    seats_per_row integer DEFAULT 0,
    upi_id text,
    status public.library_status DEFAULT 'pending'::public.library_status,
    theme_id uuid,
    average_rating numeric(2,1) DEFAULT 0,
    total_reviews integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: membership_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.membership_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    duration_days integer NOT NULL,
    max_seats integer,
    features jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    type public.notification_type DEFAULT 'general'::public.notification_type,
    is_read boolean DEFAULT false,
    action_url text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: owner_memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owner_memberships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_active boolean DEFAULT true,
    payment_status public.payment_status DEFAULT 'pending'::public.payment_status,
    payment_reference text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    library_id uuid NOT NULL,
    user_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    is_approved boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: seat_themes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seat_themes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    seat_shape text DEFAULT 'rounded'::text,
    available_color text DEFAULT '#22c55e'::text,
    booked_color text DEFAULT '#ef4444'::text,
    selected_color text DEFAULT '#3b82f6'::text,
    prebooked_color text DEFAULT '#eab308'::text,
    disabled_color text DEFAULT '#6b7280'::text,
    seat_spacing integer DEFAULT 4,
    row_spacing integer DEFAULT 8,
    config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: seats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    library_id uuid NOT NULL,
    row_label text NOT NULL,
    seat_number integer NOT NULL,
    is_disabled boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: shifts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shifts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    library_id uuid NOT NULL,
    name text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    price_per_seat numeric(10,2) NOT NULL,
    monthly_price numeric(10,2),
    discount_percent integer DEFAULT 0,
    discount_amount numeric(10,2) DEFAULT 0,
    discount_valid_until timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: staff; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    library_id uuid NOT NULL,
    name text NOT NULL,
    role text DEFAULT 'Staff'::text,
    phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: booking_seats booking_seats_booking_id_seat_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_seats
    ADD CONSTRAINT booking_seats_booking_id_seat_id_key UNIQUE (booking_id, seat_id);


--
-- Name: booking_seats booking_seats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_seats
    ADD CONSTRAINT booking_seats_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: libraries libraries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.libraries
    ADD CONSTRAINT libraries_pkey PRIMARY KEY (id);


--
-- Name: libraries libraries_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.libraries
    ADD CONSTRAINT libraries_slug_key UNIQUE (slug);


--
-- Name: membership_plans membership_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membership_plans
    ADD CONSTRAINT membership_plans_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: owner_memberships owner_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owner_memberships
    ADD CONSTRAINT owner_memberships_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_library_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_library_id_user_id_key UNIQUE (library_id, user_id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: seat_themes seat_themes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seat_themes
    ADD CONSTRAINT seat_themes_pkey PRIMARY KEY (id);


--
-- Name: seats seats_library_id_row_label_seat_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seats
    ADD CONSTRAINT seats_library_id_row_label_seat_number_key UNIQUE (library_id, row_label, seat_number);


--
-- Name: seats seats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seats
    ADD CONSTRAINT seats_pkey PRIMARY KEY (id);


--
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (id);


--
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: libraries generate_library_slug_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER generate_library_slug_trigger BEFORE INSERT OR UPDATE OF name ON public.libraries FOR EACH ROW EXECUTE FUNCTION public.generate_library_slug();


--
-- Name: bookings update_bookings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: libraries update_libraries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_libraries_updated_at BEFORE UPDATE ON public.libraries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reviews update_library_rating_on_review; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_library_rating_on_review AFTER INSERT OR DELETE OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_library_rating();


--
-- Name: membership_plans update_membership_plans_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_membership_plans_updated_at BEFORE UPDATE ON public.membership_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: owner_memberships update_owner_memberships_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_owner_memberships_updated_at BEFORE UPDATE ON public.owner_memberships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reviews update_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: shifts update_shifts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: booking_seats booking_seats_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_seats
    ADD CONSTRAINT booking_seats_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: booking_seats booking_seats_seat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_seats
    ADD CONSTRAINT booking_seats_seat_id_fkey FOREIGN KEY (seat_id) REFERENCES public.seats(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_library_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_library_id_fkey FOREIGN KEY (library_id) REFERENCES public.libraries(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: libraries libraries_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.libraries
    ADD CONSTRAINT libraries_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: libraries libraries_theme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.libraries
    ADD CONSTRAINT libraries_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.seat_themes(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: owner_memberships owner_memberships_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owner_memberships
    ADD CONSTRAINT owner_memberships_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: owner_memberships owner_memberships_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owner_memberships
    ADD CONSTRAINT owner_memberships_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.membership_plans(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_library_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_library_id_fkey FOREIGN KEY (library_id) REFERENCES public.libraries(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: seats seats_library_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seats
    ADD CONSTRAINT seats_library_id_fkey FOREIGN KEY (library_id) REFERENCES public.libraries(id) ON DELETE CASCADE;


--
-- Name: shifts shifts_library_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_library_id_fkey FOREIGN KEY (library_id) REFERENCES public.libraries(id) ON DELETE CASCADE;


--
-- Name: staff staff_library_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_library_id_fkey FOREIGN KEY (library_id) REFERENCES public.libraries(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: libraries Admins can delete libraries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete libraries" ON public.libraries FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: membership_plans Admins can manage plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage plans" ON public.membership_plans USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: membership_plans Anyone can view active plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active plans" ON public.membership_plans FOR SELECT USING (((is_active = true) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: libraries Anyone can view approved libraries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view approved libraries" ON public.libraries FOR SELECT USING (((status = 'approved'::public.library_status) OR (owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: reviews Anyone can view approved reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view approved reviews" ON public.reviews FOR SELECT USING (((is_approved = true) OR (user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: booking_seats Anyone can view booking seats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view booking seats" ON public.booking_seats FOR SELECT USING (true);


--
-- Name: seats Anyone can view seats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view seats" ON public.seats FOR SELECT USING (true);


--
-- Name: shifts Anyone can view shifts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view shifts" ON public.shifts FOR SELECT USING (true);


--
-- Name: staff Anyone can view staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view staff" ON public.staff FOR SELECT USING (true);


--
-- Name: seat_themes Anyone can view themes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view themes" ON public.seat_themes FOR SELECT USING (true);


--
-- Name: owner_memberships Owners can create memberships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can create memberships" ON public.owner_memberships FOR INSERT WITH CHECK ((owner_id = auth.uid()));


--
-- Name: libraries Owners can insert their library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can insert their library" ON public.libraries FOR INSERT WITH CHECK ((owner_id = auth.uid()));


--
-- Name: seats Owners can manage seats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can manage seats" ON public.seats USING ((EXISTS ( SELECT 1
   FROM public.libraries
  WHERE ((libraries.id = seats.library_id) AND (libraries.owner_id = auth.uid())))));


--
-- Name: shifts Owners can manage shifts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can manage shifts" ON public.shifts USING ((EXISTS ( SELECT 1
   FROM public.libraries
  WHERE ((libraries.id = shifts.library_id) AND (libraries.owner_id = auth.uid())))));


--
-- Name: staff Owners can manage their staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can manage their staff" ON public.staff USING ((EXISTS ( SELECT 1
   FROM public.libraries
  WHERE ((libraries.id = staff.library_id) AND (libraries.owner_id = auth.uid())))));


--
-- Name: libraries Owners can update their library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can update their library" ON public.libraries FOR UPDATE USING (((owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: owner_memberships Owners can view their memberships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can view their memberships" ON public.owner_memberships FOR SELECT USING (((owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: profiles Public profiles are viewable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public profiles are viewable" ON public.profiles FOR SELECT USING (true);


--
-- Name: notifications System can create notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);


--
-- Name: bookings Users and owners can update bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users and owners can update bookings" ON public.bookings FOR UPDATE USING (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.libraries
  WHERE ((libraries.id = bookings.library_id) AND (libraries.owner_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: booking_seats Users can create booking seats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create booking seats" ON public.booking_seats FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.bookings
  WHERE ((bookings.id = booking_seats.booking_id) AND (bookings.user_id = auth.uid())))));


--
-- Name: bookings Users can create bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: reviews Users can create reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: reviews Users can delete their reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their reviews" ON public.reviews FOR DELETE USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: notifications Users can update their notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: reviews Users can update their reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their reviews" ON public.reviews FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: bookings Users can view their bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their bookings" ON public.bookings FOR SELECT USING (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.libraries
  WHERE ((libraries.id = bookings.library_id) AND (libraries.owner_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: notifications Users can view their notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: booking_seats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_seats ENABLE ROW LEVEL SECURITY;

--
-- Name: bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: libraries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.libraries ENABLE ROW LEVEL SECURITY;

--
-- Name: membership_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: owner_memberships; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.owner_memberships ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: seat_themes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seat_themes ENABLE ROW LEVEL SECURITY;

--
-- Name: seats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;

--
-- Name: shifts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

--
-- Name: staff; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


