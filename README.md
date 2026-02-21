# Vamo Builder

A Lovable-style builder where founders iterate on startup UI and business progress in parallel. Earn pineapples for real progress; list projects for sale or get instant offers.

## Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** shadcn/ui + Tailwind CSS
- **Backend / DB:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email/password)
- **AI:** OpenAI API
- **Hosting:** Vercel

## Setup instructions (clone, install, env, run)

1. **Clone and install**

   ```bash
   cd "Vamo Builder"
   npm install
   ```

2. **Environment**

   Copy `.env.local.example` to `.env.local` and set:

   - `VITE_SUPABASE_URL` – your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY`) – your Supabase anon (public) key
   - `OPENAI_API_KEY` – your OpenAI API key

   The app uses placeholder Supabase URL/key at build time if env is missing so `next build` succeeds; at runtime (e.g. Vercel or with `.env.local`) you must set the real values.

3. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Supabase setup (migrations, RLS, triggers)

- Create a new project at [supabase.com](https://supabase.com).
- **Migrations:** In the SQL Editor, run the migrations in order from `supabase/migrations/`:
  - `20260209000001_profiles.sql` through `20260209000010_handle_new_user.sql`
  - `20260209000011_activity_events_project_nullable.sql` (allows reward_redeemed activity events)
  - `20260209000012_fix_admin_rls_recursion.sql`
  - `20260210000001_admin_activity_events.sql`
  - `20260211000001_activity_events_append_only.sql`
  - `20260211000002_redeem_pineapples_rpc.sql` (atomic redemption)
  - Alternatively run `supabase/RUN_ALL_MIGRATIONS.sql` if your Supabase project is empty.
- **RLS:** Row Level Security is enabled on all relevant tables by these migrations; policies are created in the migration files.
- **Triggers:** Migrations include triggers (e.g. `handle_new_user` for new auth users). No extra steps needed once migrations are run.
- Enable Email auth in Authentication → Providers.
- (Optional) Enable Google OAuth.

## How to set yourself as admin

In Supabase Dashboard → Table Editor → `profiles`, find your user row (by email) and set `is_admin` to `true`. Then you can access `/admin`.

## Confirmation: no service role key

No service role key is used anywhere in this codebase (client or server). All access is through the Supabase anon key and user JWT, with Row Level Security (RLS) enforcing permissions.

## Known limitations

- UI Preview iframe may be blocked by some sites (X-Frame-Options); fallback shows screenshot or “Open in new tab”.
- Listing description is user-edited; optional AI-generated description can be added later.



## Definition of Done (acceptance)

A new user should be able to: sign up with email/password; create a project; use the 3-panel builder; send a chat prompt and get an AI response; see the prompt in the activity timeline and earn pineapples; tag a prompt (e.g. Feature); link GitHub in the business panel and earn pineapples; see progress score and traction signals update; edit "Why I Built This"; view UI preview (iframe or fallback); open the wallet and redeem if balance ≥ 50; get a Vamo Offer and list for sale; view the public marketplace and listing detail. An admin can open `/admin`, see dashboard counts, pending redemptions (with user email), and mark redemptions fulfilled or failed. All pages are responsive; no service role key is used; RLS protects data.

## Deploy (Vercel)

1. Push to GitHub and import the repo in Vercel.
2. Add the same env vars in Vercel (Supabase URL, anon key, OpenAI key).
3. Deploy. No build command or output directory change needed for default Next.js.
