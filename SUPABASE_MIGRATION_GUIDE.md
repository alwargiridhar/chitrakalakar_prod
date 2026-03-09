# ChitraKalakar - Supabase Migration Guide

## Overview
This guide contains all the SQL migrations needed to update your Supabase database to support the new enhanced artwork listing features.

---

## Step 1: Update the `artworks` Table

Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor → New Query):

```sql
-- =====================================================
-- ARTWORKS TABLE - ADD NEW COLUMNS
-- =====================================================

-- Basic Artwork Information
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS year_of_creation INTEGER;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS medium TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS surface TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS dimensions JSONB; -- {"height": float, "width": float, "depth": float, "unit": "cm/inches"}
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS orientation TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS style TEXT;

-- Authenticity & Certification
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS artwork_type TEXT DEFAULT 'Original'; -- Original / Limited Edition / Open Edition
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS edition_number TEXT; -- e.g., "3 of 25"
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS total_edition_size INTEGER;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS certificate_of_authenticity BOOLEAN DEFAULT FALSE;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS signed_by_artist TEXT; -- None / Front / Back / Both
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS date_signed TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS hand_embellished BOOLEAN DEFAULT FALSE;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS artist_stamp BOOLEAN DEFAULT FALSE;

-- Condition Details
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'Brand New'; -- Brand New / Excellent / Minor Imperfections / Restored
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS condition_notes TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS restoration_history TEXT;

-- Framing & Presentation
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS framing_status TEXT; -- Unframed / Framed / Gallery Wrapped / Ready to Hang
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS frame_material TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS frame_included_in_price BOOLEAN DEFAULT TRUE;

-- Pricing & Availability
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS price_type TEXT DEFAULT 'Fixed'; -- Fixed / Negotiable / Auction
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS quantity_available INTEGER DEFAULT 1;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS international_shipping BOOLEAN DEFAULT FALSE;

-- Shipping Details
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS ships_rolled BOOLEAN DEFAULT FALSE;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS ships_stretched BOOLEAN DEFAULT FALSE;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS ships_framed BOOLEAN DEFAULT FALSE;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS insured_shipping BOOLEAN DEFAULT FALSE;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS dispatch_time TEXT;

-- Ownership & Usage Rights
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS ownership_type TEXT DEFAULT 'Physical Ownership Only';

-- Story & Context
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS inspiration TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS technique_explanation TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS artist_statement TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS exhibition_history TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS awards_recognition TEXT;

-- Investment / Value Signals
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS previously_exhibited BOOLEAN DEFAULT FALSE;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS featured_in_publication BOOLEAN DEFAULT FALSE;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS sold_similar_works BOOLEAN DEFAULT FALSE;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS part_of_series BOOLEAN DEFAULT FALSE;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS series_name TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS collector_interest BOOLEAN DEFAULT FALSE;

-- Ensure images array column exists
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
```

---

## Step 2: Update the `profiles` Table (Membership Fields)

```sql
-- =====================================================
-- PROFILES TABLE - MEMBERSHIP COLUMNS
-- =====================================================

-- Add membership columns if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_member BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_expiry TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_plan TEXT; -- 'basic', 'premium', 'annual'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_started_at TIMESTAMPTZ;
```

---

## Step 3: Verify/Create Required Tables

### 3.1 Featured Artists Table
```sql
-- =====================================================
-- FEATURED_ARTISTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS featured_artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    bio TEXT,
    avatar TEXT,
    categories TEXT[] DEFAULT '{}',
    location TEXT,
    artworks JSONB DEFAULT '[]', -- For contemporary artists (external artists)
    type TEXT NOT NULL CHECK (type IN ('contemporary', 'registered')),
    is_featured BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_featured_artists_type ON featured_artists(type);
CREATE INDEX IF NOT EXISTS idx_featured_artists_artist_id ON featured_artists(artist_id);
```

### 3.2 Video Screenings Table
```sql
-- =====================================================
-- VIDEO_SCREENINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS video_screenings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    preferred_date TIMESTAMPTZ,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3 Profile Modifications Table (For Admin Approval)
```sql
-- =====================================================
-- PROFILE_MODIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS profile_modifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    requested_changes JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.4 Exhibitions Table
```sql
-- =====================================================
-- EXHIBITIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS exhibitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    location TEXT,
    image TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.5 Communities Table
```sql
-- =====================================================
-- COMMUNITIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    category TEXT,
    member_count INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(community_id, user_id)
);
```

### 3.6 Orders Table
```sql
-- =====================================================
-- ORDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    artist_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    artwork_id UUID REFERENCES artworks(id) ON DELETE SET NULL,
    quantity INTEGER DEFAULT 1,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded')),
    shipping_address JSONB,
    payment_id TEXT,
    payment_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.7 Cart Table
```sql
-- =====================================================
-- CART TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, artwork_id)
);
```

---

## Step 4: Row Level Security (RLS) Policies

```sql
-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on tables
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Artworks: Anyone can view approved artworks in marketplace
CREATE POLICY IF NOT EXISTS "Public can view approved marketplace artworks" ON artworks
    FOR SELECT USING (is_approved = true AND in_marketplace = true);

-- Artworks: Artists can manage their own artworks
CREATE POLICY IF NOT EXISTS "Artists can manage own artworks" ON artworks
    FOR ALL USING (artist_id = auth.uid());

-- Profiles: Public profiles are viewable
CREATE POLICY IF NOT EXISTS "Public profiles viewable" ON profiles
    FOR SELECT USING (is_approved = true AND is_active = true);

-- Profiles: Users can update their own profile
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- Featured Artists: Anyone can view
CREATE POLICY IF NOT EXISTS "Featured artists viewable by all" ON featured_artists
    FOR SELECT USING (is_featured = true);

-- Cart: Users can manage their own cart
CREATE POLICY IF NOT EXISTS "Users manage own cart" ON cart_items
    FOR ALL USING (user_id = auth.uid());

-- Orders: Users can view their own orders
CREATE POLICY IF NOT EXISTS "Users view own orders" ON orders
    FOR SELECT USING (user_id = auth.uid() OR artist_id = auth.uid());
```

---

## Step 5: Create Indexes for Performance

```sql
-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Artworks indexes
CREATE INDEX IF NOT EXISTS idx_artworks_artist_id ON artworks(artist_id);
CREATE INDEX IF NOT EXISTS idx_artworks_category ON artworks(category);
CREATE INDEX IF NOT EXISTS idx_artworks_is_approved ON artworks(is_approved);
CREATE INDEX IF NOT EXISTS idx_artworks_in_marketplace ON artworks(in_marketplace);
CREATE INDEX IF NOT EXISTS idx_artworks_price ON artworks(price);
CREATE INDEX IF NOT EXISTS idx_artworks_created_at ON artworks(created_at DESC);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_approved ON profiles(is_approved);
CREATE INDEX IF NOT EXISTS idx_profiles_is_member ON profiles(is_member);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_artist_id ON orders(artist_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
```

---

## Step 6: Update Existing Artworks (Set Defaults)

```sql
-- =====================================================
-- UPDATE EXISTING DATA WITH DEFAULTS
-- =====================================================

-- Set default values for existing artworks that have NULL values
UPDATE artworks SET
    artwork_type = COALESCE(artwork_type, 'Original'),
    condition = COALESCE(condition, 'Brand New'),
    price_type = COALESCE(price_type, 'Fixed'),
    currency = COALESCE(currency, 'INR'),
    quantity_available = COALESCE(quantity_available, 1),
    ownership_type = COALESCE(ownership_type, 'Physical Ownership Only'),
    certificate_of_authenticity = COALESCE(certificate_of_authenticity, FALSE),
    hand_embellished = COALESCE(hand_embellished, FALSE),
    artist_stamp = COALESCE(artist_stamp, FALSE),
    frame_included_in_price = COALESCE(frame_included_in_price, TRUE),
    international_shipping = COALESCE(international_shipping, FALSE),
    ships_rolled = COALESCE(ships_rolled, FALSE),
    ships_stretched = COALESCE(ships_stretched, FALSE),
    ships_framed = COALESCE(ships_framed, FALSE),
    insured_shipping = COALESCE(insured_shipping, FALSE),
    previously_exhibited = COALESCE(previously_exhibited, FALSE),
    featured_in_publication = COALESCE(featured_in_publication, FALSE),
    sold_similar_works = COALESCE(sold_similar_works, FALSE),
    part_of_series = COALESCE(part_of_series, FALSE),
    collector_interest = COALESCE(collector_interest, FALSE)
WHERE artwork_type IS NULL OR condition IS NULL;
```

---

## Quick Reference: New Artwork Fields

| Field | Type | Description |
|-------|------|-------------|
| `year_of_creation` | INTEGER | Year artwork was created |
| `medium` | TEXT | Oil, Acrylic, Watercolor, etc. |
| `surface` | TEXT | Canvas, Paper, Wood, etc. |
| `dimensions` | JSONB | `{height, width, depth, unit}` |
| `orientation` | TEXT | Portrait, Landscape, Square |
| `style` | TEXT | Abstract, Realism, Contemporary, etc. |
| `artwork_type` | TEXT | Original, Limited Edition, Open Edition |
| `edition_number` | TEXT | e.g., "3 of 25" |
| `certificate_of_authenticity` | BOOLEAN | Has COA? |
| `signed_by_artist` | TEXT | Not Signed, Front, Back, Both |
| `condition` | TEXT | Brand New, Excellent, etc. |
| `framing_status` | TEXT | Unframed, Framed, Gallery Wrapped |
| `price_type` | TEXT | Fixed, Negotiable, Auction |
| `currency` | TEXT | INR, USD, EUR |
| `ownership_type` | TEXT | Physical Only, Commercial Rights, etc. |
| `inspiration` | TEXT | Story behind the artwork |
| `technique_explanation` | TEXT | How it was created |
| `artist_statement` | TEXT | Artist's personal statement |

---

## Troubleshooting

### Issue: "Column already exists"
This is fine - the `IF NOT EXISTS` clause handles this gracefully.

### Issue: "Permission denied"
Make sure you're running these queries as the database owner or with appropriate permissions.

### Issue: "Relation does not exist"
Run the table creation queries (Step 3) before the ALTER TABLE queries (Step 1-2).

---

## Testing the Migration

After running all migrations, test with:

```sql
-- Check artworks table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'artworks'
ORDER BY ordinal_position;

-- Count new columns
SELECT COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_name = 'artworks';
-- Should be around 50+ columns now
```

---

## Next Steps

1. Run migrations in order (Step 1 → Step 6)
2. Verify in Supabase Dashboard → Table Editor
3. Test artwork creation with new fields
4. Test admin approval workflow
5. Test membership-based marketplace access
