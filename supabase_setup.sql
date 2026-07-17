-- Supabase Setup Script for Equipment and Bookings
-- Please copy and run this in your Supabase project's SQL Editor (https://supabase.com)

-- 1. Disable Row Level Security (RLS) on equipment tables
-- This allows the frontend to read and write directly to these tables
ALTER TABLE public.equipment DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_equipment DISABLE ROW LEVEL SECURITY;

-- 2. Grant permissions to public (anon) and authenticated roles
GRANT ALL ON public.equipment TO anon, authenticated;
GRANT ALL ON public.booking_equipment TO anon, authenticated;
GRANT ALL ON public.equipment TO service_role;
GRANT ALL ON public.booking_equipment TO service_role;

-- 3. Make constraints nullable on booking_equipment table
-- This allows standalone equipment bookings to be inserted without requiring a studio booking or direct equipment UUID mapping
ALTER TABLE public.booking_equipment ALTER COLUMN booking_id DROP NOT NULL;
ALTER TABLE public.booking_equipment ALTER COLUMN equipment_id DROP NOT NULL;
ALTER TABLE public.booking_equipment ALTER COLUMN price DROP NOT NULL;

-- 4. Enable schema cache reload
NOTIFY pgrst, 'reload schema';
