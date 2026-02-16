-- Listing screenshots bucket: public read, authenticated upload under own folder
-- Upload path: listing-screenshots/{user_id}/{project_id}/{uuid}_{filename}

-- Bucket: public read for marketplace; 5MB limit, images only (set in Dashboard if needed)
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-screenshots', 'listing-screenshots', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public can read any object in this bucket (for marketplace listing images)
CREATE POLICY "Public read listing screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-screenshots');

-- Authenticated users can upload only under their own folder: {user_id}/...
CREATE POLICY "Users upload own listing screenshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update/delete their own uploads (same folder prefix)
CREATE POLICY "Users update own listing screenshots"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING ((storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'listing-screenshots');

CREATE POLICY "Users delete own listing screenshots"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
