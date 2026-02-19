-- Timeline integrity (20.5): activity_events is append-only for regular users.
-- There are no UPDATE or DELETE RLS policies on activity_events, so only INSERT and SELECT
-- are allowed for owners (and SELECT for admins). This prevents modification of historical events.

COMMENT ON TABLE activity_events IS 'Append-only. No UPDATE/DELETE RLS policies for regular users.';
