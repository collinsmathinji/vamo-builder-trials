-- Project screenshot bucket: public read, authenticated upload under own folder
-- Used as fallback in UI Preview when website URL cannot be embedded.
-- Upload path: project-screenshots/{user_id}/{project_id}/{filename}

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-screenshots', 'project-screenshots', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public read project screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-screenshots');

CREATE POLICY "Users upload own project screenshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users update own project screenshots"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING ((storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'project-screenshots');

CREATE POLICY "Users delete own project screenshots"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
