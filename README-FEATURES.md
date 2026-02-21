## Extra features (beyond scope)

Features added beyond the original Definition of Done:



### User account

- **Settings page** (`/settings`) — account overview (avatar, name, email, join date), quick link to wallet, and logout. Accessible from the main nav when signed in.

### Builder

- **Dedicated project settings page** (`/builder/[projectId]/settings`) — edit project name, description, URL, "Why I Built This", and screenshot in one form (in addition to in-panel editing).
- **Full-page activity timeline** (`/builder/[projectId]/timeline`) — standalone activity timeline view with all project events in one place.

### Wallet

- **Transaction history** — paginated list of reward_ledger entries (earned pineapples per project/event).
- **Redemption history** — list of redemption requests with status badges (pending / fulfilled / failed).
- **Pagination** — wallet page supports `?page=` for browsing long history.

### Marketplace & listings

- **Withdraw listing** — owners can unlist a project (API: `POST /api/listings/withdraw`). Listing status set to `withdrawn` and project status back to `active`.

### Admin (beyond dashboard counts + redemptions)

- **Overview charts** — bar, pie, and area charts (Recharts) for platform stats and 14-day trends (new users, new projects).
- **Activity analytics** — filterable, paginated view of `activity_events` (and analytics events) by event name and date range; Admin nav includes an "Analytics" section.
- **User detail page** (`/admin/users/[userId]`) — profile summary, pineapple balance, all projects (with links to project detail), and recent activity events.
- **Project detail page** (`/admin/projects/[projectId]`) — project metadata, owner info, status, progress score, valuation range, and recent activity for that project.

### Analytics & tracking

- **Client-side event tracking** — `trackEvent()` writes to `analytics_events` (e.g. `page_view`, `prompt_sent`, `reward_earned`, `reward_redeemed`) for product analytics.
- **AnalyticsTracker** — automatic `page_view` events on route change for authenticated users.

### Landing

- **Homepage marketplace section** — featured listings on the landing page with thumbnails, progress badge, and "Browse all" link to `/marketplace`.

### Theme & motion

- **Dark mode** — full dark theme support (e.g. system preference or toggle) so the app can be used in light or dark mode.
- **Animations** — transitions and motion (e.g. step glows, hovers, section transitions) across the app for a more polished feel.

### Validation & chat UX

- **Social media link validation** — validation when entering social/profile links (e.g. GitHub, LinkedIn) in the business panel so invalid or malformed URLs are rejected or corrected, avoiding wrong links.
- **Profile icons in chat** — user and assistant messages in the builder chat show profile/avatar icons for easier differentiation of who said what.