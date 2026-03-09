# PRD - ChitraKalakar Commissioning Feature

## Original Problem Statement
Implement commissioning artwork flow in existing chitrakalakar framework: interactive price calculator (medium/size/skill/detail/subjects), request submission with reference upload + instructions + deadline + framing, admin intake (DB + dashboard + email notification), artist WIP status updates, and user dashboard tracking with statuses: Requested → Accepted → In Progress → WIP Shared → Completed → Delivered. Also provide required tables and image bucket/folder strategy, and pricing matrix coverage for existing artwork categories.

## Architecture Decisions
- Continued with existing stack: React frontend + FastAPI backend + Supabase/Postgres data model patterns + existing signed upload API.
- Added commission domain in backend (`commissions`, `commission_updates`) with status timeline.
- Reused existing upload route and introduced dedicated folders (`commission-refs`, `commission-wips`) to support user references and artist WIP images.
- Added optional SMTP-based admin email notification on commission creation (env-driven, non-breaking if missing).
- Added dedicated pages for request flow and role-based commission management routes.

## What Has Been Implemented
1. Backend APIs
- Added calculator config endpoint: `GET /api/public/commission-config`
- Added commission APIs:
  - `POST /api/commissions`
  - `GET /api/user/commissions`
  - `GET /api/artist/commissions`
  - `GET /api/admin/commissions`
  - `POST /api/artist/commissions/{commission_id}/update`
  - `POST /api/admin/commissions/action`
- Added server-side pricing logic for all required mediums and multipliers.
- Added admin email notification trigger for new commission requests.

2. Frontend Features
- New page: `/commission/request` (interactive price calculator + request form)
- New page: `/user-dashboard/commissions` (user tracking view)
- New page: `/dashboard/commissions` (artist queue + WIP uploader)
- New page: `/admin/commissions` (admin intake + assign/status actions)
- Added status timeline component and WIP uploader component.
- Updated artist detail CTA to open commission request with preferred artist context.
- Added navigation/menu links to commission flows by role.
- Added required `data-testid` attributes across newly added interactive/critical UI elements.

3. Data/Infra Documentation
- Added SQL migration: `/app/scripts/commissioning_feature_migration.sql`
- Added setup doc: `/app/docs/COMMISSIONING_SETUP.md`
  - Tables to add
  - Bucket/folder plan
  - Existing framework categories
  - Pricing matrix applied for all categories

## Prioritized Backlog
### P0
- Run `/app/scripts/commissioning_feature_migration.sql` on production Supabase.
- Confirm SMTP env variables for real admin email delivery:
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `ADMIN_NOTIFICATION_FROM_EMAIL`
- Verify authenticated flows end-to-end with real role accounts (user/artist/admin).

### P1
- Add dashboard count widgets for commissions inside existing monolithic dashboard tabs.
- Add status transition guardrails (prevent invalid jump transitions by role).
- Add file upload retry/error-state UX for reference and WIP images.

### P2
- Add commission chat/thread between user and artist.
- Add SLA alerts and overdue deadline highlighting.
- Add downloadable commission transcript/report per order.

## Next Tasks
- Execute DB migration + storage setup in production.
- Validate role-specific journeys with real test users.
- Tune admin workflow for assignment and approvals based on team process.
