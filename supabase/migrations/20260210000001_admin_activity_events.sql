-- Allow admins to view all activity_events (for admin user detail page).
CREATE POLICY "Admins can view all activity_events"
  ON activity_events FOR SELECT
  USING (public.is_admin());
