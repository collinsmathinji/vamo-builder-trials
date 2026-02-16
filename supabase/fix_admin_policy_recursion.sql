-- Fix "infinite recursion detected in policy for relation profiles"
-- Run this in Supabase SQL Editor if you already have tables and hit the recursion error.

-- 1. Helper function: check admin without triggering RLS on profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), false);
$$;

-- 2. Replace policies that query profiles (causing recursion) with is_admin()
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
CREATE POLICY "Admins can view all projects" ON projects FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all ledger" ON reward_ledger;
CREATE POLICY "Admins can view all ledger" ON reward_ledger FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all redemptions" ON redemptions;
CREATE POLICY "Admins can view all redemptions" ON redemptions FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update redemptions" ON redemptions;
CREATE POLICY "Admins can update redemptions" ON redemptions FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view analytics" ON analytics_events;
CREATE POLICY "Admins can view analytics" ON analytics_events FOR SELECT USING (public.is_admin());
