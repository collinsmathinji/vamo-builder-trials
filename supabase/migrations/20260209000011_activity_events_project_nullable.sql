-- Allow activity_events without a project (e.g. reward_redeemed)
ALTER TABLE activity_events
  ALTER COLUMN project_id DROP NOT NULL;
