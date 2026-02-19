-- =====================================================
-- CHITRAKALAKAR - COMPLETE DATABASE MIGRATION
-- Run this entire script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: ARTWORKS TABLE - ADD ALL NEW COLUMNS
-- =====================================================

-- Basic Artwork Information
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS year_of_creation INTEGER;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS medium TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS surface TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS dimensions JSONB;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS orientation TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS style TEXT;

-- Authenticity & Certification
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS artwork_type TEXT DEFAULT 'Original';
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS edition_number TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS total_edition_size INTEGER;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS certificate_of_authenticity BOOLEAN DEFAULT FALSE;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS signed_by_artist TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS date_signed TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS hand_embellished BOOLEAN DEFAULT FALSE;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS artist_stamp BOOLEAN DEFAULT FALSE;

-- Condition Details
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'Brand New';
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS condition_notes TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS restoration_history TEXT;

-- Framing & Presentation
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS framing_status TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS frame_material TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS frame_included_in_price BOOLEAN DEFAULT TRUE;

-- Pricing & Availability
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS price_type TEXT DEFAULT 'Fixed';
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

-- Ensure images array exists
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- =====================================================
-- STEP 2: PROFILES TABLE - MEMBERSHIP COLUMNS
-- =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_member BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_expiry TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_plan TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_started_at TIMESTAMPTZ;

-- =====================================================
-- STEP 3: CREATE/VERIFY SUPPORTING TABLES
-- =====================================================

-- Featured Artists
CREATE TABLE IF NOT EXISTS featured_artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    bio TEXT,
    avatar TEXT,
    categories TEXT[] DEFAULT '{}',
    location TEXT,
    artworks JSONB DEFAULT '[]',
    type TEXT NOT NULL CHECK (type IN ('contemporary', 'registered')),
    is_featured BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Screenings
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

-- Profile Modifications (for admin approval)
CREATE TABLE IF NOT EXISTS profile_modifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    requested_changes JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exhibitions
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

-- Communities
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

-- Orders
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

-- Cart
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, artwork_id)
);

-- =====================================================
-- STEP 4: PERFORMANCE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_artworks_artist_id ON artworks(artist_id);
CREATE INDEX IF NOT EXISTS idx_artworks_category ON artworks(category);
CREATE INDEX IF NOT EXISTS idx_artworks_is_approved ON artworks(is_approved);
CREATE INDEX IF NOT EXISTS idx_artworks_in_marketplace ON artworks(in_marketplace);
CREATE INDEX IF NOT EXISTS idx_artworks_price ON artworks(price);
CREATE INDEX IF NOT EXISTS idx_artworks_created_at ON artworks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_approved ON profiles(is_approved);
CREATE INDEX IF NOT EXISTS idx_profiles_is_member ON profiles(is_member);
CREATE INDEX IF NOT EXISTS idx_featured_artists_type ON featured_artists(type);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_artist_id ON orders(artist_id);

-- =====================================================
-- STEP 5: UPDATE EXISTING DATA WITH DEFAULTS
-- =====================================================

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
    collector_interest = COALESCE(collector_interest, FALSE);

-- =====================================================
-- VERIFICATION: Check migration success
-- =====================================================

SELECT 'Migration completed! Artworks table now has ' || COUNT(*) || ' columns.' as status
FROM information_schema.columns
WHERE table_name = 'artworks';
