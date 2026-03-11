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


## Latest Micro-Update (Adaptive Thumbnail Fit Logic)
- Implemented adaptive artwork fit logic in Featured Artist Spotlight: auto-switches thumbnail image mode between `cover` and `contain` based on actual image aspect ratio at load time.
- Balanced rule: near-normal ratios use cover for strong fill; extreme portrait/landscape ratios use contain to avoid out-focused cropping.


## Latest Micro-Update (Global Adaptive Artwork Rendering + Artist Zoom Controls)
- Added reusable `AdaptiveArtworkImage` component and applied adaptive fit logic across key artwork-display pages (Artists spotlight, Paintings cards, Painting Detail main+thumbnails, Artist Detail cards, Art Classes sample artworks, Commission matching artworks).
- Added artist-side image projection controls in artwork upload form: per-image Zoom, Focus X/Y, and Fit Mode (Adaptive/Contain/Cover).
- Artwork form now sends `image_display_settings` metadata so artists can control visual projection intent.
- Backend artwork create API accepts `image_display_settings` with backward-compatible insert fallback if DB column is not yet present.
- Migration includes additive `artworks.image_display_settings` JSONB column.


## Latest Micro-Update (Zoom/Focus Editor Expansion)
- Expanded zoom/focus projection editor to all `ImageUpload` flows by default (avatars, community/exhibition-like uploads, commission refs, etc.).
- Added inline controls in upload component: Zoom, Focus X/Y, Fit Mode + Apply & Upload.
- Artwork upload keeps dedicated per-image projection controls in `ArtworkForm` (ImageUpload editor disabled there to avoid duplicate control layers).


## Latest Micro-Update (Community Create CORS + Upload Error)
- Fixed backend CORS middleware configuration for wildcard mode by disabling credentials when `CORS_ORIGINS=*`, ensuring valid `Access-Control-Allow-Origin` headers are emitted.
- Fixed upload client parsing bug that caused `Failed to execute 'clone' on 'Response': Response body is already used`.
- Upload response handling now reads response body once (`text -> JSON parse`) with safe error extraction.


## Latest Micro-Update (Community Create Schema Compatibility)
- Hardened both community-create endpoints (`/api/community/create` and `/api/communities`) to work with existing community schemas.
- Added insert fallback logic to automatically drop optional fields (`location`, `invite_criteria`, `updated_at`) if target columns are missing.
- Added `community_members` insert fallback for schemas without `role` column.
- Renamed duplicate python handler names for clarity and to avoid accidental override confusion.


## Latest Change Set (Community + Exhibition Workflow)
- Added cross-origin API fallback and upload-url fallback to same-origin `/api` to reduce network/CORS failure impact on frontend.
- Fixed community creation schema compatibility and removed duplicate `CommunityCreate` model conflict.
- Added artist exhibition management page (`/dashboard/exhibitions`) with request flow, artwork selection, exhibition image uploads, payment-reference field, and status visibility.
- Added admin exhibition creator page (`/admin/exhibitions`) for direct no-payment exhibition creation.
- Added backend endpoints/logic:
  - artist exhibition request with manual payment-status path
  - admin direct exhibition create (payment waived)
  - enhanced admin approve-exhibition status updates
- Extended ImageUpload for projection editor + optional aspect-ratio enforcement + target output size compression; exhibition uploads now support 4:3/3:4 auto-crop and <=1MB output target.


## Latest Change Set (Exhibition Lifecycle + Payment Flow)
- Added active/archived exhibition public UX and data flow (`/exhibitions` + `/exhibitions/archived`) with active-first behavior.
- Added backend exhibition lifecycle sync: approved exhibition transitions through `upcoming -> active -> archived -> expired` based on start date and paid days; archived retention equals paid duration.
- Updated exhibition plans to fixed structure:
  - Kalakanksh: 1 day, ₹500, max 10 artworks
  - Kalahruday: 3 days, ₹1000, max 20 artworks
  - KalaDeeksh: 10 days, ₹2500, max 25 artworks
- Artist exhibition request now auto-computes end date from start date + plan days, auto-populates fee metadata, supports max 3 exhibition images with primary image selection.
- Added payment flow fields for manual + Razorpay, including manual screenshot upload and admin review surface in pending exhibitions.
- Added S3 bucket mapping for payment proofs: `exhibition-payment-proofs` via env `AWS_BUCKET_EXHIBITION_PAYMENT_PROOFS`.


## Latest Change Set (Artists + Exhibition Navigation + Action Review)
- Fixed featured-count inconsistency logic and tightened Artists page layout spacing so registered artists section appears immediately below featured block.
- Updated navbar exhibitions behavior: clicking “Exhibitions” opens active/upcoming page by default; dropdown still provides archived navigation.
- Added artist exhibition action requests (`pause` / `delete`) requiring admin review before state change.
- Added admin action-review endpoint and dashboard controls to approve/reject artist pause/delete requests.
- Updated active exhibitions page to include both active and upcoming approved exhibitions, reducing false “not visible after approval” behavior.


## Latest Micro-Update (Exhibitions Navbar Behavior)
- Removed exhibitions dropdown from navbar.
- `Exhibitions` is now a single direct nav link to active/upcoming exhibitions.
- Archived navigation remains available from the exhibitions page (and back-link from archived page).


## Latest Micro-Update (Single S3 Bucket + Folder Mode)
- Added backend compatibility for single-bucket setups: if per-feature bucket env is missing, upload routing now falls back to `AWS_BUCKET_NAME` / `AWS_S3_BUCKET`.
- Updated S3 object key generation to always include folder prefixes (`artworks/`, `communities/`, `exhibitions/`, `commission-references/`, etc.), so data lands correctly in folder-based structure inside one bucket.


## Latest Change Set (Community Approval + Admin Exhibition Builder)
- Fixed community approval visibility for admin by adding pending communities fetch + approval UI tab in Admin Dashboard, and hardening backend pending-community retrieval for both `created_by` and `creator_id` schemas.
- Enhanced community creation payload to write both creator references for compatibility.
- Reworked admin exhibition creator to support multi-painting entries with `+ Add Painting` flow, per-painting image + optional short description + pricing + creation date + on-sale ribbon preview.
- Added backend support for `exhibition_paintings` metadata in admin-created exhibitions (with schema-safe fallback if column missing).
- Normalized menu visibility by making `Exhibitions` a regular top menu link via nav link configuration.


## Latest Micro-Update (Lint Hook Dependencies)
- Fixed React hook dependency warnings:
  - `ArtistExhibitionsPage`: removed implicit `form.end_date` dependency by computing end-date deterministically.
  - `ArtistsPage`: wrapped sort and fetch callbacks with `useCallback` and updated `useEffect` dependencies.


## Latest Change Set (Admin Exhibition Visibility + Management)
- Fixed exhibition visibility logic by hardening datetime parsing to timezone-aware values, preventing status-sync failures that could hide approved exhibitions from active listings.
- Added admin exhibition management APIs: list all, extend duration, soft-delete exhibition.
- Added admin exhibition management UI panel (extend/delete controls) inside Admin Exhibition page.
- Added pending communities review tab in Admin Dashboard with approve/reject actions.
- Enhanced admin exhibition builder for multi-painting uploads with metadata and sale-ribbon preview.


## Latest Micro-Update (Exhibition Data Quality Guards)
- Added validation to require at least one exhibition image on artist/admin exhibition create APIs.
- Updated active exhibition card rendering to use `primary_exhibition_image` -> `exhibition_images[0]` -> `exhibition_paintings[0].image_url` fallback chain and richer metadata display.
- Added admin exhibition management APIs/UI for extend/delete and fixed timezone-aware status sync parsing.


## Latest Change Set (December 2025 - Database Columns + Controls)
### Fixes Applied
- **Supabase Connection**: Added SUPABASE_URL and SUPABASE_SERVICE_KEY to backend/.env for preview environment
- **Frontend Supabase**: Added REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to frontend/.env
- **Exhibition Data Columns**: Added missing columns to exhibitions table via SQL migration:
  - `exhibition_images TEXT[]`
  - `exhibition_paintings JSONB`
  - `primary_exhibition_image TEXT`
  - `payment_status TEXT`
  - `payment_screenshot_url TEXT`
- **Artists API**: Updated `/api/public/artists` to return ALL registered artists (not just those with active membership)
- **Admin Exhibition Controls**: Added Pause/Resume buttons alongside existing Extend/Delete controls
- **Backend Update API**: Added `PUT /api/admin/exhibitions/{id}` for updating exhibition details
- **Community Creation**: Fixed schema compatibility to use only existing columns (removed creator_id, location, invite_criteria)
- **Admin Role Access**: Updated `require_admin` to `require_lead_chitrakar` allowing both admin and lead_chitrakar roles
- **Frontend isAdmin**: Updated AuthContext to allow lead_chitrakar role access to admin dashboard
- **Admin API Error Handling**: Added .catch() handlers to all admin API calls to prevent dashboard from breaking
- **Pending Exhibitions API**: Fixed resilient artist_action_status query with fallback
- **Featured Requests API**: Added fallback for missing foreign key relationship

### Admin Dashboard Improvements (Latest)
- **Expandable Exhibition Details**: Click on pending exhibitions to see:
  - Description and payment details
  - Exhibition artwork previews (thumbnails)
  - Payment screenshot link
  - Artist action requests (pause/delete)
  - Approve/Reject buttons
- **Expandable Community Details**: Click on pending communities to see:
  - Full description
  - Member count and creation date
  - Category badge
  - Approve/Reject buttons
- **Overview Card**: Added "Pending Communities" count card (clickable to navigate to Communities tab)

### Database Migration Required
```sql
-- Run in Supabase SQL Editor
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS exhibition_images TEXT[] DEFAULT '{}';
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS exhibition_paintings JSONB DEFAULT '[]';
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS primary_exhibition_image TEXT;
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;

-- For featured artist timeline support (optional)
ALTER TABLE featured_artists ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;
ALTER TABLE featured_artists ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE featured_artists ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
```

### Test Results
- All admin API tests passed (200 responses)
- Frontend admin dashboard loads correctly with data
- Expandable exhibition and community details working
- Pending items count: Exhibitions (9), Communities (2)

### Known Issues
- Existing exhibitions show "No painting uploaded" - created before columns were added
- Featured artist timeline feature needs migration to be run

### Next Tasks
1. Build full community platform (posts, images, likes, comments, messaging)
2. Add featured artist timeline/expiry functionality after migration
3. Run room-based filtering migration in Supabase

### New Features Added (Price & Room Filtering)
- **Quick Price Filters**: Visual pill buttons for Under ₹5,000, ₹5K-₹15K, ₹15K-₹50K, Above ₹50K
- **Room-Based Browsing**: Icon-based filters for Living Room, Bedroom, Office, Dining Room, Hotel & Lobby, Hospital, School
- **Active Filters Display**: Shows currently selected filters with clear buttons
- **Collapsible Advanced Filters**: Category and Sort options in a collapsible section
- **Smart Category Mapping**: Auto-suggests artworks for rooms based on category (e.g., Landscape → Living Room)

### Database Migration Required for Room Filtering
```sql
-- Run in Supabase SQL Editor
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS suitable_rooms TEXT[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_artworks_suitable_rooms ON artworks USING GIN(suitable_rooms);
```
