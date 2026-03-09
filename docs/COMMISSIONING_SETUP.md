# Commissioning Setup (Adjusted to Existing Supabase Format)

Run SQL: `/app/scripts/commissioning_feature_migration.sql`

## Non-Breaking Strategy
- Existing tables are not renamed or dropped.
- Existing schema remains compatible.
- Only additive columns/tables are introduced.
- Existing role model continues via `profiles.role` (`admin`, `artist`, `user` where `user` acts as buyer).

## Tables in Commission Workflow

### 1) `artist_categories`
- Artist-wise category pricing bands for matching query.
- Columns: `artist_id`, `category`, `min_price`, `max_price`, `pricing_model`.

### 2) `commission_requests`
- User commission intake table.
- Includes category, medium, description, refs, size, budget, deadline, negotiation flags, pricing_type, offer_price.
- Tracks request lifecycle status (`pending` / `locked` / `closed`).

### 3) `artist_requests`
- One row per artist request sent by buyer/system.
- Enforces max-one row per artist per commission.
- Status: `pending`, `accepted`, `rejected`, `expired`.

### 4) `commission_deals`
- Locked deal after first artist acceptance.
- Stores `final_price`, `delivery_date`, status, latest update note/image.

### 5) `commission_updates`
- Timeline entries for dashboard tracking (`Requested → Accepted → In Progress → WIP Shared → Completed → Delivered`).

## Additive Profile Fields
Added safely to existing `profiles`:
- `rating`
- `delivery_days`
- `negotiation_allowed`
- `availability_status` (`available`, `busy`, `not_accepting`)

## Pricing Matrix by Category (Corrected)

| Category | Average Artist | Advanced Artist | Pricing Model |
|---|---:|---:|---|
| Acrylic Colors | ₹1,500 – ₹4,000 / sq ft | ₹4,000 – ₹10,000 / sq ft | sqft |
| Watercolors | ₹1,200 – ₹3,000 / sq ft | ₹3,000 – ₹6,000 / sq ft | sqft |
| Pencil & Pen Work | ₹800 – ₹2,000 / sq ft | ₹2,000 – ₹5,000 / sq ft | sqft |
| Pastels | ₹1,200 – ₹3,500 / sq ft | ₹3,500 – ₹7,000 / sq ft | sqft |
| Indian Ink | ₹1,000 – ₹2,500 / sq ft | ₹2,500 – ₹5,500 / sq ft | sqft |
| Illustrations | ₹2,000 – ₹8,000 / artwork | ₹8,000 – ₹25,000 | flat |
| Visual Art | ₹2,000 – ₹7,000 / sq ft | ₹7,000 – ₹18,000 | sqft |
| Digital Art | ₹1,000 – ₹6,000 / artwork | ₹6,000 – ₹20,000 | flat |
| Mixed Media | ₹2,500 – ₹8,000 / sq ft | ₹8,000 – ₹20,000 | sqft |
| Sculpture | ₹10,000 – ₹80,000 | ₹80,000 – ₹4,00,000 | flat |
| Photography | ₹2,000 – ₹15,000 | ₹15,000 – ₹1,00,000 | flat |
| Printmaking | ₹1,500 – ₹5,000 / sq ft | ₹5,000 – ₹12,000 | sqft |

> For flat categories, estimator ignores width/height as requested.

## S3 Buckets (Strict Separate Buckets)
Configured in backend upload flow:
- `artist-artworks`
- `commission-references`
- `commission-deliveries`

Required env vars:
- `AWS_BUCKET_ARTIST_ARTWORKS`
- `AWS_BUCKET_COMMISSION_REFERENCES`
- `AWS_BUCKET_COMMISSION_DELIVERIES`
