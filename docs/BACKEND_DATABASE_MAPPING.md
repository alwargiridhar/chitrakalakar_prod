# ChitraKalakar - Backend to Database Field Mapping

## How the Code Maps to Database

This document shows exactly how the Python backend fields map to Supabase columns.

---

## ArtworkCreate Model → artworks Table

### Location in Code: `/app/backend/server.py` (lines 99-165)

```python
class ArtworkCreate(BaseModel):
    # REQUIRED FIELDS (must exist in DB)
    title: str                              → artworks.title (TEXT)
    category: str                           → artworks.category (TEXT)
    price: float                            → artworks.price (DECIMAL)
    
    # IMAGE FIELDS
    images: Optional[List[str]]             → artworks.images (TEXT[])
    image: Optional[str]                    → artworks.image (TEXT) - legacy
    description: Optional[str]              → artworks.description (TEXT)
    
    # BASIC INFO
    year_of_creation: Optional[int]         → artworks.year_of_creation (INTEGER)
    medium: Optional[str]                   → artworks.medium (TEXT)
    surface: Optional[str]                  → artworks.surface (TEXT)
    dimensions: Optional[dict]              → artworks.dimensions (JSONB)
    orientation: Optional[str]              → artworks.orientation (TEXT)
    style: Optional[str]                    → artworks.style (TEXT)
    
    # AUTHENTICITY
    artwork_type: Optional[str]             → artworks.artwork_type (TEXT)
    edition_number: Optional[str]           → artworks.edition_number (TEXT)
    total_edition_size: Optional[int]       → artworks.total_edition_size (INTEGER)
    certificate_of_authenticity: bool       → artworks.certificate_of_authenticity (BOOLEAN)
    signed_by_artist: Optional[str]         → artworks.signed_by_artist (TEXT)
    date_signed: Optional[str]              → artworks.date_signed (TEXT)
    hand_embellished: bool                  → artworks.hand_embellished (BOOLEAN)
    artist_stamp: bool                      → artworks.artist_stamp (BOOLEAN)
    
    # CONDITION
    condition: Optional[str]                → artworks.condition (TEXT)
    condition_notes: Optional[str]          → artworks.condition_notes (TEXT)
    restoration_history: Optional[str]      → artworks.restoration_history (TEXT)
    
    # FRAMING
    framing_status: Optional[str]           → artworks.framing_status (TEXT)
    frame_material: Optional[str]           → artworks.frame_material (TEXT)
    frame_included_in_price: bool           → artworks.frame_included_in_price (BOOLEAN)
    
    # PRICING
    price_type: Optional[str]               → artworks.price_type (TEXT)
    currency: Optional[str]                 → artworks.currency (TEXT)
    quantity_available: Optional[int]       → artworks.quantity_available (INTEGER)
    international_shipping: bool            → artworks.international_shipping (BOOLEAN)
    
    # SHIPPING
    ships_rolled: bool                      → artworks.ships_rolled (BOOLEAN)
    ships_stretched: bool                   → artworks.ships_stretched (BOOLEAN)
    ships_framed: bool                      → artworks.ships_framed (BOOLEAN)
    insured_shipping: bool                  → artworks.insured_shipping (BOOLEAN)
    dispatch_time: Optional[str]            → artworks.dispatch_time (TEXT)
    
    # OWNERSHIP
    ownership_type: Optional[str]           → artworks.ownership_type (TEXT)
    
    # STORY & CONTEXT
    inspiration: Optional[str]              → artworks.inspiration (TEXT)
    technique_explanation: Optional[str]    → artworks.technique_explanation (TEXT)
    artist_statement: Optional[str]         → artworks.artist_statement (TEXT)
    exhibition_history: Optional[str]       → artworks.exhibition_history (TEXT)
    awards_recognition: Optional[str]       → artworks.awards_recognition (TEXT)
    
    # INVESTMENT SIGNALS
    previously_exhibited: bool              → artworks.previously_exhibited (BOOLEAN)
    featured_in_publication: bool           → artworks.featured_in_publication (BOOLEAN)
    sold_similar_works: bool                → artworks.sold_similar_works (BOOLEAN)
    part_of_series: bool                    → artworks.part_of_series (BOOLEAN)
    series_name: Optional[str]              → artworks.series_name (TEXT)
    collector_interest: bool                → artworks.collector_interest (BOOLEAN)
```

---

## System Fields (Auto-managed)

These fields are set by the backend, not the user:

```python
# Set during artwork creation (line ~1857 in server.py)
artwork_data = {
    "artist_id": artist["id"],              → artworks.artist_id (UUID)
    "is_approved": False,                   → artworks.is_approved (BOOLEAN)
    "is_available": True,                   → artworks.is_available (BOOLEAN)
    "in_marketplace": False,                → artworks.in_marketplace (BOOLEAN)
    "views": 0,                             → artworks.views (INTEGER)
    # ... user fields ...
}
```

---

## Membership Fields → profiles Table

```python
# Used in push_to_marketplace (line ~1939 in server.py)
profile.data.get('is_member')               → profiles.is_member (BOOLEAN)
profile.data.get('membership_expiry')       → profiles.membership_expiry (TIMESTAMPTZ)
```

---

## Dimensions JSONB Structure

The `dimensions` field stores a JSON object:

```json
{
  "height": 24.0,
  "width": 18.0,
  "depth": 2.0,
  "unit": "inches"
}
```

Frontend sends this structure, backend stores it as JSONB in Supabase.

---

## Common Issues & Fixes

### Issue 1: "Column does not exist"
**Cause**: Migration not run
**Fix**: Run `/app/scripts/supabase_migration.sql` in Supabase SQL Editor

### Issue 2: "Invalid input syntax for type boolean"
**Cause**: NULL being sent for boolean field
**Fix**: Backend defaults handle this, but ensure frontend sends `false` not `null`

### Issue 3: "violates foreign key constraint"
**Cause**: artist_id doesn't exist in profiles table
**Fix**: User must be registered and logged in before creating artwork

### Issue 4: Artwork not appearing in admin pending list
**Cause**: `is_approved` might be set incorrectly
**Fix**: Check that artwork is created with `is_approved: False`

---

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/artist/artworks` | POST | Create new artwork |
| `/api/artist/artworks` | GET | Get artist's artworks |
| `/api/artist/push-to-marketplace` | POST | Push to marketplace (needs membership) |
| `/api/admin/pending-artworks` | GET | Get pending artworks for admin |
| `/api/admin/approve-artwork` | POST | Approve/reject artwork |
| `/api/public/paintings` | GET | Get marketplace paintings |
| `/api/public/painting/{id}` | GET | Get painting details |

---

## Testing the Integration

```bash
# Test artwork creation (replace with valid token)
curl -X POST "https://your-supabase-url.supabase.co/api/artist/artworks" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Artwork",
    "category": "Abstract",
    "price": 50000,
    "medium": "Oil",
    "surface": "Canvas",
    "dimensions": {"height": 24, "width": 18, "unit": "inches"},
    "artwork_type": "Original",
    "certificate_of_authenticity": true,
    "images": ["https://example.com/image.jpg"]
  }'
```
