-- ============================================================
-- Vamo Builder — run this once in Supabase SQL Editor
-- Dashboard → SQL Editor → New query → paste all → Run
-- ============================================================

-- Helper: check if current user is admin (avoids RLS recursion on profiles)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), false);
$$;

-- 1. profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  pineapple_balance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Enable insert for auth" ON profiles;
CREATE POLICY "Enable insert for auth" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  screenshot_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'listed', 'sold', 'archived')),
  progress_score INTEGER DEFAULT 0,
  valuation_low INTEGER DEFAULT 0,
  valuation_high INTEGER DEFAULT 0,
  why_built TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner can select own projects" ON projects;
CREATE POLICY "Owner can select own projects" ON projects FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can insert projects" ON projects;
CREATE POLICY "Owner can insert projects" ON projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can update own projects" ON projects;
CREATE POLICY "Owner can update own projects" ON projects FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can delete own projects" ON projects;
CREATE POLICY "Owner can delete own projects" ON projects FOR DELETE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Public can view listed projects" ON projects;
CREATE POLICY "Public can view listed projects" ON projects FOR SELECT USING (status = 'listed');
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
CREATE POLICY "Admins can view all projects" ON projects FOR SELECT USING (public.is_admin());

-- 3. messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  extracted_intent TEXT,
  tag TEXT CHECK (tag IN ('feature', 'customer', 'revenue', 'ask', 'general', NULL)),
  pineapples_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner can select own messages" ON messages;
CREATE POLICY "Owner can select own messages" ON messages FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Owner can insert messages" ON messages;
CREATE POLICY "Owner can insert messages" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. activity_events (project_id nullable for reward_redeemed)
CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'project_created', 'prompt', 'update', 'link_linkedin', 'link_github',
    'link_website', 'feature_shipped', 'customer_added',
    'revenue_logged', 'listing_created', 'offer_received',
    'reward_earned', 'reward_redeemed'
  )),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner can select own events" ON activity_events;
CREATE POLICY "Owner can select own events" ON activity_events FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Owner can insert events" ON activity_events;
CREATE POLICY "Owner can insert events" ON activity_events FOR INSERT WITH CHECK (auth.uid() = user_id);
-- If you already had activity_events with NOT NULL project_id, run: ALTER TABLE activity_events ALTER COLUMN project_id DROP NOT NULL;

-- 5. reward_ledger
CREATE TABLE IF NOT EXISTS reward_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  reward_amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE reward_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner can view own ledger" ON reward_ledger;
CREATE POLICY "Owner can view own ledger" ON reward_ledger FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Owner can insert own ledger" ON reward_ledger;
CREATE POLICY "Owner can insert own ledger" ON reward_ledger FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all ledger" ON reward_ledger;
CREATE POLICY "Admins can view all ledger" ON reward_ledger FOR SELECT USING (public.is_admin());

-- 6. redemptions
CREATE TABLE IF NOT EXISTS redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  reward_type TEXT NOT NULL DEFAULT 'uber_eats',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  fulfilled_at TIMESTAMPTZ
);
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner can view own redemptions" ON redemptions;
CREATE POLICY "Owner can view own redemptions" ON redemptions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Owner can insert redemptions" ON redemptions;
CREATE POLICY "Owner can insert redemptions" ON redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all redemptions" ON redemptions;
CREATE POLICY "Admins can view all redemptions" ON redemptions FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can update redemptions" ON redemptions;
CREATE POLICY "Admins can update redemptions" ON redemptions FOR UPDATE USING (public.is_admin());

-- 7. listings
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  asking_price_low INTEGER,
  asking_price_high INTEGER,
  timeline_snapshot JSONB,
  screenshots JSONB DEFAULT '[]',
  metrics JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'withdrawn')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner can select own listings" ON listings;
CREATE POLICY "Owner can select own listings" ON listings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Owner can insert listings" ON listings;
CREATE POLICY "Owner can insert listings" ON listings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Owner can update own listings" ON listings;
CREATE POLICY "Owner can update own listings" ON listings FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Public can view active listings" ON listings;
CREATE POLICY "Public can view active listings" ON listings FOR SELECT USING (status = 'active');

-- 8. offers
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offer_low INTEGER NOT NULL,
  offer_high INTEGER NOT NULL,
  reasoning TEXT,
  signals JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'accepted')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner can view own offers" ON offers;
CREATE POLICY "Owner can view own offers" ON offers FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Owner can insert offers" ON offers;
CREATE POLICY "Owner can insert offers" ON offers FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Owner can update own offers" ON offers;
CREATE POLICY "Owner can update own offers" ON offers FOR UPDATE USING (auth.uid() = user_id);

-- 9. analytics_events
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own analytics" ON analytics_events;
CREATE POLICY "Users can insert own analytics" ON analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view analytics" ON analytics_events;
CREATE POLICY "Admins can view analytics" ON analytics_events FOR SELECT USING (public.is_admin());

-- 10. trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- activity_events append-only (20.5)
COMMENT ON TABLE activity_events IS 'Append-only. No UPDATE/DELETE RLS policies for regular users.';

-- redeem_pineapples RPC: atomic balance check + deduct + ledger (20.6)
CREATE OR REPLACE FUNCTION public.redeem_pineapples(
  p_user_id uuid,
  p_amount int,
  p_reward_type text DEFAULT 'uber_eats'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance int;
  v_balance_after int;
  v_redemption_id uuid;
  v_idempotency_key text;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_amount IS NULL OR p_amount < 50 THEN
    RAISE EXCEPTION 'Amount must be at least 50';
  END IF;

  SELECT pineapple_balance INTO v_balance
  FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  v_balance_after := v_balance - p_amount;
  v_idempotency_key := 'redeem-' || p_user_id::text || '-' || gen_random_uuid()::text;

  UPDATE profiles SET pineapple_balance = v_balance_after WHERE id = p_user_id;

  INSERT INTO redemptions (user_id, amount, reward_type, status)
  VALUES (p_user_id, p_amount, COALESCE(NULLIF(trim(p_reward_type), ''), 'uber_eats'), 'pending')
  RETURNING id INTO v_redemption_id;

  INSERT INTO reward_ledger (user_id, project_id, event_type, reward_amount, balance_after, idempotency_key)
  VALUES (p_user_id, NULL, 'reward_redeemed', -p_amount, v_balance_after, v_idempotency_key);

  INSERT INTO activity_events (project_id, user_id, event_type, description, metadata)
  VALUES (NULL, p_user_id, 'reward_redeemed', 'Redeemed ' || p_amount || ' pineapples (' || COALESCE(NULLIF(trim(p_reward_type), ''), 'uber_eats') || ')', jsonb_build_object('amount', p_amount, 'reward_type', COALESCE(NULLIF(trim(p_reward_type), ''), 'uber_eats')));

  RETURN v_redemption_id;
END;
$$;
