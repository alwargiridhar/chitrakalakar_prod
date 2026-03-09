# Commissioning Feature - Tables, Buckets, and Pricing Matrix

## Tables Added

Run: `/app/scripts/commissioning_feature_migration.sql`

### 1) `commissions`
- Stores each commission request from user
- Includes calculator inputs (category, medium, dimensions, skill, detail, subjects)
- Stores computed `price_min`, `price_max`, `estimated_price`
- Stores workflow status:
  - `Requested` → `Accepted` → `In Progress` → `WIP Shared` → `Completed` → `Delivered`

### 2) `commission_updates`
- Stores status timeline entries and WIP update logs
- Supports artist note + optional image per update
- Drives user dashboard tracking timeline

## Buckets / Storage Structure

### Existing S3 signed URL setup (recommended for current backend)
Use folder-based separation inside current upload bucket:

- `commission-refs/{user_id}/...`
  - User reference images
- `commission-wips/{artist_id}/...`
  - Artist work-in-progress images

### If separate buckets are preferred
- `chitrakalakar-commission-refs` (private recommended)
- `chitrakalakar-commission-wips` (public read)

## Artwork Categories in Current Framework

- Acrylic Colors
- Watercolors
- Pencil & Pen Work
- Pastels
- Indian Ink
- Illustrations
- Visual Art
- Digital Art
- Mixed Media
- Sculpture
- Photography
- Printmaking

## Pricing Matrix (applies to all categories above)

### Medium-wise range per sq.ft

1. Pencil / Charcoal
   - Average: ₹800 – ₹2,000
   - Advanced: ₹2,000 – ₹5,000

2. Watercolor
   - Average: ₹1,200 – ₹3,000
   - Advanced: ₹3,000 – ₹6,000

3. Acrylic on Canvas
   - Average: ₹1,500 – ₹4,000
   - Advanced: ₹4,000 – ₹10,000

4. Oil on Canvas
   - Average: ₹2,500 – ₹6,000
   - Advanced: ₹6,000 – ₹15,000

5. Hyper-Realism / Museum Replica
   - Average: ₹5,000 – ₹12,000
   - Advanced: ₹12,000 – ₹30,000

### Multipliers
- Detail: Basic (1x), Detailed (1.25x), Hyper Realistic (1.5x)
- Subjects: add 15% per extra subject
