# Vamo Builder — Agent Task Breakdown

This document divides the Vamo competition spec into **agent-assignable tasks**. Give each agent one or more task IDs. Dependencies are listed so you know execution order. Tasks with no dependencies on each other can run in parallel.

---

## Current status & run order (as of implementation)

**Run tasks in this order.** Complete one phase before moving to the next. Verify the app runs (`npm run build` and key flows) after each task.

| Phase | Task IDs | Status | Notes |
|-------|----------|--------|--------|
| 1 Foundation | T1, T2, T3, T4 | ✅ Done | Next.js, shadcn, Supabase, migrations, auth, middleware, README |
| 2 Core | T5, T6, T7 | ✅ Done | Projects list/new, builder layout, settings/URL |
| 3 Builder | T8, T9, T10, T11, T12, T13 | ✅ Done | Chat, chat API, UI Preview, Business panel, links API, header actions |
| 4 Rewards | T14, T15 | ✅ Done | Reward engine, wallet, redemption |
| 5 Marketplace | T16, T17 | ✅ Done | Listings, marketplace page; detail view in progress |
| 6 Offers | T18 | ✅ Done | Instant offer API & dialog |
| 7 Timeline/Analytics | T19, T20 | ✅ Done | Timeline page, analytics lib |
| 8 Admin | T21 | ✅ Done | Dashboard, users, redemptions, actions |
| 9 Polish | T22, T23 | 🔄 In progress | Loading states, DoD checklist, README |

**Single-agent run order (sequential):**  
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12 → T13 → T14 → T15 → T16 → T17 → T18 → T19 → T20 → T21 → T22 → T23

**Multi-agent parallel hints:**  
- Agent A: T1, T2, T3, T4 (then hand off)  
- Agent B: T5, T6, T7 (after A)  
- Agent C: T8, T10, T11, T13 (after B); Agent D: T9, T12, T14, T18 (after B)  
- Agent E: T15, T16, T17 (after C, D)  
- Agent F: T19, T20, T21 (after E)  
- Agent G: T22, T23 (last)

---

## Dependency Overview

```
Phase 1 (Foundation)     →  T1, T2, T3, T4   [run first; T2 depends on T1]
Phase 2 (Core App)       →  T5, T6, T7       [depends on Phase 1]
Phase 3 (Builder)        →  T8, T9, T10, T11, T12, T13  [depends on T5,T6,T7]
Phase 4 (Rewards/Wallet) →  T14, T15         [T14 needed by chat/links; T15 needs T14]
Phase 5 (Marketplace)    →  T16, T17         [depends on T11]
Phase 6 (Offers)         →  T18             [depends on T11]
Phase 7 (Timeline/Analytics) → T19, T20     [depends on T11]
Phase 8 (Admin)         →  T21              [depends on T14, T15, T20]
Phase 9 (Polish/Docs)    →  T22, T23         [last]
```

---

## Phase 1 — Foundation

### T1 — Project setup & stack

**Spec ref:** §2 Stack & Tooling  
**Deliverables:** Next.js 14 (App Router), Tailwind, shadcn/ui init, Supabase client, `.env.local.example`.

**Instructions for agent:**
- Create Next.js 14 app with `app/` directory (no Pages Router).
- Run `npx shadcn-ui@latest init` and use Tailwind. No custom CSS unless necessary.
- Install `@supabase/supabase-js`. Create `lib/supabase/client.ts` and `lib/supabase/server.ts` (browser vs server) using **anon key only** from `NEXT_PUBLIC_SUPABASE_ANON_KEY`. No service role key anywhere.
- Add `.env.local.example` with: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`. Document each.
- Ensure all buttons, inputs, dialogs, cards, etc. use shadcn components (Button, Input, Textarea, Card, Dialog, Sheet, Tabs, Badge, Skeleton, etc.).

**Acceptance:** `npm run build` succeeds; env example is complete; no service role key in repo.

---

### T2 — Database migrations & RLS

**Spec ref:** §5 Database Schema & RLS, §5.1–5.9, trigger  
**Depends on:** T1 (project exists)  
**Deliverables:** Numbered SQL files in `supabase/migrations/`.

**Instructions for agent:**
- Create migration files in order:  
  `001_profiles.sql`, `002_projects.sql`, `003_messages.sql`, `004_activity_events.sql`, `005_reward_ledger.sql`, `006_redemptions.sql`, `007_listings.sql`, `008_offers.sql`, `009_analytics_events.sql`, `010_handle_new_user.sql`.
- Copy the exact schema from the spec for each table (including all RLS policies). Enable RLS on every table.
- Implement the `handle_new_user()` trigger that inserts into `profiles` on `auth.users` insert.
- Do not add any policy or table that uses the service role; all access is anon + JWT + RLS.

**Acceptance:** Migrations run in order without errors; RLS enabled on all tables; trigger creates profile on signup.

---

### T3 — Auth (Supabase Auth + middleware)

**Spec ref:** §4 Authentication & Authorization  
**Depends on:** T1, T2  
**Deliverables:** Login/signup pages, session handling, `middleware.ts`, protected routes.

**Instructions for agent:**
- **Auth:** Email/password signup and login using Supabase Auth. Optional: Google OAuth. Use `onAuthStateChange` on the client for session. Profile creation is done by DB trigger (T2).
- **Middleware:** Create `middleware.ts` at project root. Check Supabase session (e.g. via getSession or cookie). Redirect unauthenticated users to `/login`. Allow public routes: `/`, `/login`, `/signup`, `/marketplace`. All other routes require auth. For `/admin`, additionally ensure the user has `profiles.is_admin = true` (fetch profile in middleware or in admin layout); if not admin, redirect to `/projects`.
- **Pages:** Implement `/login` and `/signup` with shadcn form components. After signup/login, redirect to `/projects` or dashboard.

**Acceptance:** Sign up → profile created; login/logout works; unauthenticated access to `/projects` or `/builder/xxx` redirects to `/login`; non-admin cannot access `/admin`.

---

### T4 — Profile & env docs

**Spec ref:** §4 (profile), Submission (README, .env.example)  
**Depends on:** T1  
**Deliverables:** README setup section, `.env.local.example` (if not in T1), “how to set admin” and “no service role” notes.

**Instructions for agent:**
- README: Setup (clone, install, env vars), Supabase setup (run migrations in order, enable Email auth, optional Google), how to set yourself as admin (set `is_admin = true` in `profiles` in Supabase dashboard), confirmation that no service role key is used.
- Ensure `.env.local.example` lists all required variables with short descriptions.

**Acceptance:** New developer can follow README to run app and become admin; env example is complete.

---

## Phase 2 — Core app & project CRUD

### T5 — Projects list & creation

**Spec ref:** §6 Project Creation  
**Depends on:** T3  
**Deliverables:** `/projects` (list), `/projects/new` (form), redirect to `/builder/[projectId]`.

**Instructions for agent:**
- **List:** `/projects` — fetch projects where `owner_id = auth.uid()`. Display in a grid/list with shadcn Card. Link each to `/builder/[projectId]`.
- **New project:** Route `/projects/new`. Form with: Project Name (required, max 100), Description (optional, max 500), External URL (optional, valid URL), Why did you build this? (optional, max 1000). Use shadcn Card, Input, Textarea, Button. Validation: name non-empty after trim; URL if present must be valid (http/https). Inline validation errors. On submit: insert into `projects`, insert `activity_events` with `event_type = 'project_created'` (or ensure this event exists — spec says “One row in activity_events with event_type = 'project_created'”; if that event type is not in the schema CHECK, add it or use a generic event type and document). Redirect to `/builder/[projectId]`. On Supabase error, show toast (Sonner or shadcn Toast). Do not create project if user is not authenticated.

**Acceptance:** User can create a project and is redirected to builder; validation and error toasts work.

---

### T6 — Builder layout shell (3-panel)

**Spec ref:** §7 Builder Workspace Layout  
**Depends on:** T3, T5  
**Deliverables:** `/builder/[projectId]` layout with header and three panels; responsive behavior.

**Instructions for agent:**
- **Layout:** Header: project name (editable inline), pineapple balance badge, “List for Sale” (only if `progress_score >= 20`), “Get Vamo Offer” (only if `progress_score >= 10`). Three panels: Left = Builder Chat, Center = UI Preview, Right = Business Panel.
- **Desktop (≥1280px):** Three panels side by side; left ~300px, center flexible, right ~360px.
- **Tablet (768–1279px):** Chat in a slide-out shadcn Sheet; center + right visible.
- **Mobile (<768px):** shadcn Tabs to switch between Chat, Preview, Business.
- Create placeholder content for each panel so layout is testable. Wire header project name to project data and balance to `profiles.pineapple_balance`.

**Acceptance:** Layout works at all breakpoints; header shows project name and balance; conditional buttons appear by progress_score.

---

### T7 — Project settings & URL

**Spec ref:** §6 (URL), §9 (link project URL)  
**Depends on:** T5  
**Deliverables:** Way to set/edit `projects.url` (and optionally screenshot); used by UI Preview.

**Instructions for agent:**
- Provide project settings (e.g. `/builder/[projectId]/settings` or a dialog) where user can set `projects.url` and optionally `screenshot_url`. Save via Supabase with RLS. Business panel “Link a project URL” can link here or open the same form.

**Acceptance:** User can set project URL; UI Preview can read it (T9 will consume).

---

## Phase 3 — Builder panels

### T8 — Builder Chat (left panel)

**Spec ref:** §8 Builder Chat  
**Depends on:** T6, T11 (reward engine for pineapples)  
**Deliverables:** `ChatPanel.tsx`, message list, input, tag selector, call to `/api/chat`.

**Instructions for agent:**
- **UI:** Message list (scroll to bottom on new message). Each message: role avatar (user/AI), content, tag badge (feature, customer, revenue, ask) if present, relative timestamp, pineapple indicator if earned. Bottom: shadcn Textarea (auto-resize), Send button, optional tag selector (Feature, Customer, Revenue, Ask).
- **Flow:** On send: (1) Insert user message into `messages`. (2) POST `/api/chat` with `{ projectId, message, tag }`. (3) Append assistant message from response; show pineapple toast if rewarded; trigger business panel refresh (e.g. callback or invalidate).
- **Errors:** If API fails, show fallback: “I couldn’t process that right now. Your update has been saved.” Keep message in input on Supabase insert failure; show error toast.

**Acceptance:** User can send a message, get AI reply, see tag and pineapple; errors handled without losing input.

---

### T9 — Chat API & OpenAI

**Spec ref:** §8 Chat Flow (API Route)  
**Depends on:** T2, T14 (rewards)  
**Deliverables:** `POST /api/chat` route.

**Instructions for agent:**
- Load last 20 messages and current project (name, description, why_built, progress_score). Call OpenAI with system prompt from spec (Vamo co-pilot, extract intent, return JSON: `reply`, `intent`, `business_update` with `progress_delta`, `traction_signal`, `valuation_adjustment`). Parse response. Insert assistant message into `messages` with intent/tag. Insert `activity_events` with `event_type = 'prompt'`. Call reward engine (e.g. POST `/api/rewards` or internal) for “prompt” with idempotency key. If `business_update.progress_delta > 0`, update `projects.progress_score`. Return reply + metadata to client. Use `OPENAI_API_KEY` from env. On OpenAI failure, return fallback message but still save user message and award pineapple (per spec).

**Acceptance:** Chat response returns in <3s; intent and business_update applied; progress_score and rewards updated.

---

### T10 — UI Preview (center panel)

**Spec ref:** §9 UI Preview  
**Depends on:** T6, T7  
**Deliverables:** `UIPreview.tsx` with iframe, fallback, toolbar.

**Instructions for agent:**
- If `projects.url` set: render iframe with `sandbox="allow-scripts allow-same-origin allow-forms"`. Show shadcn Skeleton while loading. If iframe fails (e.g. X-Frame-Options): show `screenshot_url` if set, else placeholder “Preview unavailable. [Open in new tab ↗]” with link to URL.
- If no URL: empty state “Link a project URL to see a live preview” and button to open project settings.
- Toolbar: Refresh (reload iframe), “Open in new tab”, device toggle (Desktop/Tablet/Mobile) that adjusts iframe width. Load/fallback visible in <3s.

**Acceptance:** Iframe shows when URL set; fallback and empty state work; toolbar works.

---

### T11 — Business panel (right panel)

**Spec ref:** §10 Business Panel  
**Depends on:** T6, T19 (timeline), T8 (refresh trigger)  
**Deliverables:** `BusinessPanel.tsx` with all sections; re-fetch after chat/link/update.

**Instructions for agent:**
- **Sections:** (1) Valuation: `projects.valuation_low`–`valuation_high` as “$X – $Y” or “Not yet estimated”. (2) Why I Built This: `projects.why_built`, editable inline (textarea, save on blur/Enter, max 1000, character counter). (3) Progress score: circular or linear bar 0–100, color 0–25 red, 26–50 yellow, 51–75 green, 76–100 blue; label Early Stage / Building / Traction / Growth. (4) Traction signals: list from `activity_events` where `event_type IN ('feature_shipped','customer_added','revenue_logged')`; icon, description, timestamp; empty state if none. (5) Linked assets: LinkedIn, GitHub, Website; link/unlink state; “Link” opens dialog to paste URL; on link, create `activity_event` and award pineapples (call rewards API). (6) Mini activity timeline: last 10 events; “View full timeline” link to full timeline (T19). Use Supabase Realtime or polling every 5s to keep panel fresh after chat/link/update.

**Acceptance:** All sections render; why_built editable; traction and timeline update; linking assets creates events and rewards.

---

### T12 — Links API & activity events for links

**Spec ref:** §10.5 Linked Assets, §11 Reward Schedule  
**Depends on:** T14  
**Deliverables:** API or logic to “link” LinkedIn/GitHub/Website; insert activity_event; award 5/5/3 pineapples.

**Instructions for agent:**
- Endpoint or server action: accept projectId, linkType (linkedin|github|website), url. Validate URL. Insert `activity_events` with `event_type = 'link_linkedin'|'link_github'|'link_website'`. Call reward engine with appropriate event type and idempotency key. Return success so Business panel can refresh.

**Acceptance:** Linking each asset type creates event and awards correct pineapples.

---

### T13 — Header actions (List for Sale, Get Offer)

**Spec ref:** §7 Header, §13 Marketplace, §14 Instant Offer  
**Depends on:** T6, T16 (listing dialog), T18 (offer API)  
**Deliverables:** “List for Sale” opens listing flow; “Get Vamo Offer” calls offer API and shows result in dialog.

**Instructions for agent:**
- “List for Sale” (visible when `progress_score >= 20`): opens listing creation dialog (T16). “Get Vamo Offer” (visible when `progress_score >= 10`): POST `/api/offer` with `{ projectId }`, show offer in dialog (range, reasoning, signals, disclaimer); buttons Dismiss / “List for Sale”. Wire to existing APIs from T16 and T18.

**Acceptance:** Buttons open correct flows; offer dialog shows and links to listing.

---

## Phase 4 — Rewards & wallet

### T14 — Pineapple reward engine (API + idempotency + rate limit)

**Spec ref:** §11 Pineapple Reward Engine, §20.1, §20.2  
**Depends on:** T2  
**Deliverables:** `POST /api/rewards` with idempotency and 60/hour rate limit.

**Instructions for agent:**
- **Input:** `{ userId, projectId, eventType, idempotencyKey }`. Get user from session (do not trust client for userId). **Idempotency:** If `idempotency_key` exists in `reward_ledger`, return existing record (no duplicate). **Rate limit:** Max 60 rewarded “prompt” events per project per hour; after that, prompts still processed but award 0 pineapples. **Logic:** Compute amount from spec (prompt=1, tag bonus +1, link_linkedin/github=5, link_website=3, feature_shipped=3, customer_added=5, revenue_logged=10). Get current `profiles.pineapple_balance`. Insert `reward_ledger` with `balance_after = current + amount`. Update `profiles.pineapple_balance`. Insert `activity_events` with `event_type = 'reward_earned'`. Return `{ rewarded, amount, newBalance }`. Never use service role; use anon + user JWT; RLS must allow insert/select for own user.

**Acceptance:** Duplicate idempotency key returns existing; no double credit; after 60 prompts/hour, amount is 0; balance and ledger stay in sync.

---

### T15 — Wallet page & redemption

**Spec ref:** §12 Pineapple Wallet & Redemption  
**Depends on:** T14  
**Deliverables:** `/wallet` page, reward history, redemption dialog, `POST /api/redeem`.

**Instructions for agent:**
- **Wallet UI:** Balance card (large), “Redeem” button (disabled if balance < 50). Reward history: table of `reward_ledger` (Date, Event, Project, Amount, Balance After), sorted recent first, paginated 20 per page. Redemption history: table of `redemptions` (Date, Amount, Reward Type, Status) with badges Pending/Fulfilled/Failed.
- **Redemption flow:** Dialog: current balance, amount (min 50, max balance), reward type “Uber Eats Credit”. On confirm: POST `/api/redeem`. API: verify balance, deduct `profiles.pineapple_balance`, insert `redemptions` (status pending), insert `reward_ledger` (negative amount), insert `activity_event` (reward_redeemed). Use transaction or RPC for atomicity. Success toast: “Redemption submitted! You’ll receive your reward within 48 hours.”

**Acceptance:** Balance and histories correct; redemption only when balance ≥ 50; balance and ledger stay consistent.

---

## Phase 5 — Marketplace & offers

### T16 — Listings (create + marketplace page)

**Spec ref:** §13 Marketplace  
**Depends on:** T2, T11  
**Deliverables:** Listing creation dialog, `POST /api/listings` (or similar), `/marketplace` public page.

**Instructions for agent:**
- **Create listing:** From “List for Sale”: dialog with title (pre-filled project name), description (AI-generated from project + activity or editable), asking price range (from valuation), timeline snapshot (frozen copy of activity_events), screenshots (upload or URLs), metrics (progress_score, prompt count, traction count). On publish: insert `listings`, set `projects.status = 'listed'`, insert `activity_event` listing_created, track analytics.
- **Marketplace:** `/marketplace` — public (no auth). Grid of active listings (shadcn Card): title, description excerpt, asking price range, progress score, screenshot thumbnail. Click → detail (page or modal).

**Acceptance:** User can publish listing; marketplace shows it; public can view without login.

---

### T17 — Listing detail & discovery

**Spec ref:** §13 (detail view)  
**Depends on:** T16  
**Deliverables:** Listing detail view (page or modal) with full description, metrics, timeline snapshot.

**Instructions for agent:**
- When user clicks a listing card, show full detail: title, description, price range, metrics, screenshots, timeline snapshot. Use shadcn Dialog or `/marketplace/[id]` page. Public read via RLS “Public can view active listings”.

**Acceptance:** Detail view shows all listing data; works for unauthenticated users.

---

### T18 — Instant offer API & UI

**Spec ref:** §14 Instant Offer Engine  
**Depends on:** T2, T11  
**Deliverables:** `POST /api/offer`, offer dialog (range, reasoning, signals).

**Instructions for agent:**
- **API:** Input `{ projectId }`. Load project + activity_events, message count, traction count, links. Call OpenAI: “startup valuation engine”, user message = JSON of project + activity summary. Expected JSON: `offer_low`, `offer_high`, `reasoning`, `signals_used`. Insert into `offers`; insert `activity_event` offer_received. When creating new offer, set previous offers for that project to status `expired`. Return offer.
- **UI:** Dialog shows range (currency), reasoning, signals list, disclaimer “Non-binding estimate based on logged activity.” Buttons Dismiss / “List for Sale” (pre-fill listing with offer). Used by T13 in header.

**Acceptance:** New offer reflects current data; old offers marked expired; dialog matches spec.

---

## Phase 6 — Timeline & analytics

### T19 — Activity timeline (mini + full)

**Spec ref:** §15 Activity Timeline  
**Depends on:** T11 (mini in Business panel)  
**Deliverables:** Mini timeline in Business panel (last 10); full timeline page/modal with search and filter.

**Instructions for agent:**
- **Mini:** Last 10 `activity_events` for project, most recent first; icon by event_type, description, relative time; “View full timeline” link.
- **Full:** Page or modal with all events; sort by `created_at` (asc for “chronological” full view or desc for “newest first” — spec says ascending in full view). Search by description text. Filter by `event_type` (shadcn ToggleGroup or dropdown). Each item: icon, description, relative timestamp, metadata if any. No edit/delete for users (RLS already has no UPDATE/DELETE for non-admins).

**Acceptance:** Mini shows last 10; full timeline is searchable and filterable; immutable for users.

---

### T20 — Analytics tracking

**Spec ref:** §16 Analytics & Event Tracking  
**Depends on:** T2  
**Deliverables:** `lib/analytics.ts` with `trackEvent(eventName, properties)`; call from key actions.

**Instructions for agent:**
- Implement `trackEvent(eventName, properties)` that inserts into `analytics_events` using authenticated Supabase client (anon + user JWT). RLS: users insert own events. Document which events to send: project_created, prompt_sent, reward_earned, reward_redeemed, listing_created, offer_requested, link_added, page_view (path). Wire these in the app where each action occurs.

**Acceptance:** Events appear in `analytics_events` for the listed actions; only own events inserted.

---

## Phase 7 — Admin

### T21 — Admin panel

**Spec ref:** §17 Admin Panel  
**Depends on:** T3 (admin check), T14, T15, T20  
**Deliverables:** `/admin` with dashboard, users table, pending redemptions, analytics, projects list.

**Instructions for agent:**
- **Gate:** Redirect to `/projects` if `profiles.is_admin` is not true (middleware or layout).
- **Overview:** Cards with totals: users, projects, prompts (all time), pineapples earned, pineapples redeemed, active listings.
- **Users:** Table of profiles (email, name, pineapple balance, project count, joined). Click → user detail (projects + activity) if desired.
- **Pending redemptions:** Table where status = pending; columns User Email, Amount, Reward Type, Requested Date. Actions: “Mark Fulfilled” / “Mark Failed” (update status and `fulfilled_at`). Use RLS “Admins can update redemptions”.
- **Analytics:** Table of `analytics_events`; filter by event name and date range; pagination.
- **Projects:** List all projects (Name, Owner, Status, Progress, Created); click to view detail. All reads/updates via anon key + admin profile; no service role.

**Acceptance:** Admin sees correct counts; can fulfill/fail redemptions; can view users, analytics, projects.

---

## Phase 8 — Polish & submission

### T22 — Loading states & error handling

**Spec ref:** §18 Required Loading States  
**Deliverables:** Skeleton/loading for every async path; no raw spinners unless appropriate.

**Instructions for agent:**
- Chat: typing indicator or skeleton while waiting for AI. Business panel: skeleton on refresh. UI Preview: skeleton while iframe loads. Wallet: skeleton for balance and history. Forms: button disabled + spinner on submit. Use shadcn Skeleton. Ensure no console errors in production build.

**Acceptance:** Every async operation has a loading state; production build has no console errors.

---

### T23 — Definition of Done & submission checklist

**Spec ref:** §19 Definition of Done, Submission Requirements  
**Deliverables:** README updated with setup, Supabase, admin, no service role, limitations; `.env.local.example`; checklist of acceptance tests.

**Instructions for agent:**
- README: clone, install, env, run; Supabase migrations order, RLS, trigger; set admin; confirm no service role; known limitations; deploy (Vercel). Add a short “Acceptance” or “Definition of Done” section that mirrors §19 (brand new user can sign up, create project, use builder, chat, timeline, pineapples, tags, link GitHub, progress score, traction, why built, preview, wallet, redeem, offer, list for sale, marketplace, admin dashboard, pending redemptions, fulfill redemption, responsive, no console errors, RLS). Ensure `.env.local.example` is complete and not committed with real keys.

**Acceptance:** README and env example allow a judge to run and verify the app; submission checklist matches §19.

---

## Quick reference — which agent does what

| Agent A (Foundation)     | T1, T2, T3, T4 |
| Agent B (Core + Layout)  | T5, T6, T7 |
| Agent C (Builder UX)     | T8, T10, T11, T13 |
| Agent D (Backend/AI)     | T9, T12, T14, T18 |
| Agent E (Wallet/Market)  | T15, T16, T17 |
| Agent F (Timeline/Admin) | T19, T20, T21 |
| Agent G (Polish)         | T22, T23 |

Run order: A → B → C,D (C and D in parallel where possible) → E (after D for T15) → F → G. T13 and T18/T16 can be integrated when E and D are done.

---

## Spec section index (for copy-paste to agents)

- §2 Stack & Tooling  
- §4 Auth & Authorization  
- §5 Database Schema & RLS (5.1–5.9 + trigger)  
- §6 Project Creation  
- §7 Builder Workspace Layout  
- §8 Builder Chat  
- §9 UI Preview  
- §10 Business Panel  
- §11 Pineapple Reward Engine  
- §12 Wallet & Redemption  
- §13 Marketplace  
- §14 Instant Offer Engine  
- §15 Activity Timeline  
- §16 Analytics  
- §17 Admin Panel  
- §18 Loading States  
- §19 Definition of Done  
- §20 Critical Engineering Risks  
- Submission Requirements (README, env, deploy)

Give each agent the full spec (or the sections above) plus their task IDs and this file so they know dependencies and deliverables.
