-- First, check if tenants table exists and what columns it has
-- Run this to see the table structure:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tenants';

-- If tenants table doesn't exist, create it
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Create permissive policy
DROP POLICY IF EXISTS "Enable all for authenticated users on tenants" ON public.tenants;
CREATE POLICY "Enable all for authenticated users on tenants"
ON public.tenants FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Insert Demo Hotel tenant with required fields
INSERT INTO public.tenants (id, name, subdomain)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Demo Hotel',
  'demo-hotel'
)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  subdomain = EXCLUDED.subdomain;

-- Verify it was created
SELECT * FROM public.tenants;
