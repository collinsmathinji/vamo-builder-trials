# Enabling Realtime for the Business Panel

The Business Panel uses **Supabase Realtime** (Postgres Changes) so it can refetch when new `activity_events` are inserted, without waiting for the 5s poll.

## Where to enable it

Realtime is **not** under **Database → Replication**. That page is for streaming to external data warehouses (BigQuery, Iceberg, etc.).

Realtime for `postgres_changes` is controlled by the **`supabase_realtime` publication**.

### Option 1: Dashboard

1. In the Supabase Dashboard, open **Database** in the left sidebar.
2. Under **DATABASE MANAGEMENT**, click **Publications**.
3. Open the **supabase_realtime** publication.
4. Toggle **on** the `activity_events` table (or add it to the publication).

### Option 2: SQL Editor

Run in the Supabase SQL Editor:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE activity_events;
```

(If the table is already in the publication, you’ll get an error; that’s fine.)

## If Realtime is not enabled

The Business Panel still stays up to date via:

- **5s polling** during the session
- **Refresh after chat** (when a prompt is sent and the response is received)
- **Refresh after linking** an asset (LinkedIn, GitHub, Website)

So enabling Realtime is optional; it only makes updates appear sooner.
