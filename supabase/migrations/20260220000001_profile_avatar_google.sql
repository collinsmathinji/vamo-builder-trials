-- Use Google's "picture" when "avatar_url" is not set (e.g. Google OAuth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill avatar_url from auth.users for existing profiles (e.g. Google signups)
UPDATE public.profiles p
SET avatar_url = COALESCE(
  (SELECT raw_user_meta_data->>'avatar_url' FROM auth.users u WHERE u.id = p.id),
  (SELECT raw_user_meta_data->>'picture' FROM auth.users u WHERE u.id = p.id)
)
WHERE p.avatar_url IS NULL
  AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id AND (u.raw_user_meta_data->>'avatar_url' IS NOT NULL OR u.raw_user_meta_data->>'picture' IS NOT NULL));
