# PRD - Commissioning Flow (Adjusted to Existing Supabase/S3 Format)

## Original Problem Statement
Adjust commission feature to existing framework without breaking existing Supabase/S3 setup, align pricing by category, support artist matching by budget/category, requests to max 3 artists, first-accept lock, negotiation model, role/RBAC alignment, and strict separate S3 buckets.

## Architecture Decisions
- Kept existing core tables untouched; implemented additive schema only.
- Aligned roles to existing `profiles.role` model (`admin`, `artist`, `user` as buyer).
- Switched commission domain data model to requested names:
  - `artist_categories`, `commission_requests`, `artist_requests`, `commission_deals`
  - plus `commission_updates` for timeline tracking UI.
- Enforced strict bucket-key upload contract for separate S3 buckets:
  - `artist-artworks`, `commission-references`, `commission-deliveries`.
- Pricing moved to category-based matrix with mixed models (`sqft` and `flat`).

## What Has Been Implemented
- Backend:
  - Category-wise pricing engine (flat model ignores width/height for Digital/Illustrations/Sculpture/Photography).
  - `GET /api/public/commission-config`
  - `GET /api/public/commission/matching-artists`
  - `POST /api/commissions` (max 3 artist requests)
  - `GET /api/user/commissions`, `GET /api/artist/commissions`, `GET /api/admin/commissions`
  - `POST /api/artist/commissions/{commission_id}/update`
  - `POST /api/admin/commissions/action`
  - `POST /api/artist/commission-requests/{artist_request_id}/respond` (accept/counter/reject)
  - Upload endpoint now requires `bucket_key` and resolves strict separate bucket envs.
- Frontend:
  - Updated commission request form with budget, negotiation model, pricing type, matching artists, max-3 selection.
  - Artist queue now supports accept/counter/reject for pending requests.
  - Updated pricing UI with category pricing model labels.
  - Updated upload client to send `bucket_key`.
- SQL + Docs:
  - `/app/scripts/commissioning_feature_migration.sql` rewritten to additive/non-breaking schema.
  - `/app/docs/COMMISSIONING_SETUP.md` rewritten to reflect requested table names and bucket policy.

## Prioritized Backlog
### P0
- Run migration SQL in production Supabase.
- Set required envs:
  - `AWS_BUCKET_ARTIST_ARTWORKS`
  - `AWS_BUCKET_COMMISSION_REFERENCES`
  - `AWS_BUCKET_COMMISSION_DELIVERIES`
- Seed `artist_categories` ranges for active artists.

### P1
- Add authenticated e2e validation for upload presign + artist accept/counter/reject flows.
- Add UI for buyer to review counter offers and accept/reject them.
- Add stricter status transition guards by role.

### P2
- Escrow/payment linkage for locked deals.
- Reputation scoring from completion/delivery/reviews.
- SLA alerts for overdue deliveries.

## Next Tasks
1. Apply migration and seed artist category pricing data.
2. Configure strict S3 bucket envs and verify upload path for all media.
3. Run authenticated user+artist+admin scenario tests end-to-end.


## Latest Change Set (Privacy + Dashboard Gating)
- Removed duplicate pricing semantics in commission form: now only **Negotiation Allowed** controls fixed/negotiable behavior.
- Enforced privacy boundary: artist/user contact details are not exposed to each other in commission APIs/UI.
- Moved commission creation flow to dashboard-authenticated path (`/user-dashboard/commissions/new`), with legacy redirect from `/commission/request`.
- Added commissioning authenticity gate: user must be logged in and profile must include `full_name`, `email`, and `phone` before creating commission.
- Added Google/OAuth profile data capture enhancement to auto-fill available name/email/phone metadata into `profiles` when missing.


## Latest Micro-Update (Commissioning FAQ)
- Rewrote FAQ content to reflect current commissioning model: dashboard-only request flow, mandatory profile completion, no user/artist contact sharing, negotiation workflow, max-3 artist requests, first-accept lock, category pricing behavior, and timeline tracking.


## Latest Micro-Update (Artists Page UX)
- Reworked `/artists` page layout to show a top **Featured Artist Spotlight** block (avatar left, profile details, most-viewed artworks right/down responsive).
- Featured spotlight source now uses existing `getFeaturedArtists()` result as primary source, with graceful fallback to first registered artist if featured list is empty.
- Added artwork ordering fallback logic: `views` -> `likes` -> latest.
- Moved **Registered Artists** section below featured block to match requested content hierarchy and improve visual symmetry.


## Latest Micro-Update (Bug Fixes)
- Fixed cart API resilience by adding DB-availability guards and robust exception handling in `/api/cart/add`, `/api/cart`, and `/api/cart/{item_id}`.
- Improved frontend API network error handling to return a clear actionable message instead of raw fetch failure.
- Updated Art Classes enquiry form to use live location autocomplete dropdown while typing (via existing `LocationAutocomplete` + `/api/locations/search`).
- Added offline class location validation to prevent blank location submissions.


## Latest Micro-Update (Mobile/Tablet Responsiveness)
- Optimized whitespace and vertical rhythm for Home/Landing page across small screens by reducing oversized mobile paddings and removing forced full-screen hero behavior on mobile.
- Updated responsive breakpoints to keep layouts balanced and mostly single-column on tablets (per preference), while preserving richer multi-column desktop layouts.
- Applied responsive spacing/grid improvements on `/artists`, `/paintings`, and `/art-classes` for better content density and visual consistency.


## Latest Micro-Update (Bucket Key Alignment)
- Updated upload bucket key mapping to support **artworks** as the primary key, with backward compatibility for `artist-artworks`.
- Added backend env support for `AWS_BUCKET_ARTWORKS` (preferred) and fallback to `AWS_BUCKET_ARTIST_ARTWORKS`.
- Updated frontend bucket constant to use `artworks` for artist uploads.


## Latest Micro-Update (Location Autocomplete Reliability)
- Fixed art-class location lookup failure when geocoder returns non-JSON/blocked response.
- Hardened `/api/locations/search` with robust status handling, JSON guards, second attempt without country filter, and curated India-city fallback suggestions.
- Verified `chenna` now returns valid dropdown suggestion (`Chennai, Tamil Nadu, India`).


## Latest Micro-Update (Featured Artwork Thumbnail Fit)
- Updated featured artist "Most Viewed Artworks" thumbnails to preserve full artwork framing using `object-contain` with centered fit and padded neutral background.
- Prevents out-focused/cropped artwork appearance in featured spotlight cards.
