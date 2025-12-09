-- Create library_images table for multiple images per library
CREATE TABLE public.library_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  library_id UUID NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.library_images ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view library images"
ON public.library_images
FOR SELECT
USING (true);

CREATE POLICY "Owners can manage their library images"
ON public.library_images
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.libraries
    WHERE libraries.id = library_images.library_id
    AND libraries.owner_id = auth.uid()
  )
);

-- Create user_memberships table for student memberships
CREATE TABLE public.user_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  library_id UUID NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  seat_id UUID REFERENCES public.seats(id),
  shift_id UUID NOT NULL REFERENCES public.shifts(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_price NUMERIC NOT NULL,
  payment_status public.payment_status DEFAULT 'pending',
  payment_reference TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;

-- Policies for user_memberships
CREATE POLICY "Users can view their memberships"
ON public.user_memberships
FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.libraries
    WHERE libraries.id = user_memberships.library_id
    AND libraries.owner_id = auth.uid()
  ) OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can create memberships"
ON public.user_memberships
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners and admins can update memberships"
ON public.user_memberships
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.libraries
    WHERE libraries.id = user_memberships.library_id
    AND libraries.owner_id = auth.uid()
  ) OR
  public.has_role(auth.uid(), 'admin')
);

-- Add needs_onboarding column to profiles for Google users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS needs_onboarding BOOLEAN DEFAULT false;

-- Create storage bucket for library images
INSERT INTO storage.buckets (id, name, public) VALUES ('library-images', 'library-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view library images storage"
ON storage.objects
FOR SELECT
USING (bucket_id = 'library-images');

CREATE POLICY "Authenticated users can upload library images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'library-images' AND auth.role() = 'authenticated');

CREATE POLICY "Owners can delete their library images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'library-images' AND auth.role() = 'authenticated');

-- Create index for performance
CREATE INDEX idx_library_images_library ON public.library_images(library_id);
CREATE INDEX idx_user_memberships_library ON public.user_memberships(library_id);
CREATE INDEX idx_user_memberships_user ON public.user_memberships(user_id);