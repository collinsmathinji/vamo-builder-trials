-- Fix: "insert or update on table projects violates foreign key constraint projects_owner_id_fkey"
-- This happens when a user exists in auth.users but has no row in public.profiles (e.g. signed up before the trigger existed).
-- Run this once in Supabase SQL Editor.

-- Create profiles for any auth user that doesn't have one
INSERT INTO public.profiles (id, email, full_name, avatar_url)
SELECT
  id,
  email,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
