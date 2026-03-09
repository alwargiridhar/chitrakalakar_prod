-- =====================================================
-- CHITRAKALAKAR - SAFE COMMISSIONING MIGRATION
-- Non-breaking: keeps existing tables untouched, only ADDITIVE changes
-- =====================================================

-- 1) Additive fields on existing profiles (artist availability + negotiation metadata)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS delivery_days INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS negotiation_allowed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'profiles_availability_status_check'
    ) THEN
        ALTER TABLE profiles
        ADD CONSTRAINT profiles_availability_status_check
        CHECK (availability_status IN ('available', 'busy', 'not_accepting'));
    END IF;
END $$;

-- 2) Artist category pricing table (maps existing artists to commission category ranges)
CREATE TABLE IF NOT EXISTS artist_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    min_price DECIMAL(12,2) NOT NULL,
    max_price DECIMAL(12,2) NOT NULL,
    pricing_model TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (artist_id, category)
);

-- 3) Commission request lifecycle tables (as requested names)
CREATE TABLE IF NOT EXISTS commission_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    medium TEXT,
    description TEXT,
    reference_image TEXT,
    reference_images TEXT[] DEFAULT '{}',
    width DECIMAL(10,2),
    height DECIMAL(10,2),
    budget DECIMAL(12,2),
    deadline DATE,
    negotiation_allowed BOOLEAN DEFAULT false,
    pricing_type TEXT DEFAULT 'fixed',
    offer_price DECIMAL(12,2),
    status TEXT DEFAULT 'pending',
    skill_level TEXT,
    detail_level TEXT,
    subjects INTEGER DEFAULT 1,
    price_min DECIMAL(12,2),
    price_max DECIMAL(12,2),
    estimated_price DECIMAL(12,2),
    framing_option TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS artist_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commission_id UUID REFERENCES commission_requests(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    offer_price DECIMAL(12,2),
    counter_offer DECIMAL(12,2),
    pricing_type TEXT DEFAULT 'fixed',
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    UNIQUE (commission_id, artist_id)
);

CREATE TABLE IF NOT EXISTS commission_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commission_id UUID REFERENCES commission_requests(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    final_price DECIMAL(12,2),
    delivery_date DATE,
    latest_update_note TEXT,
    latest_update_image TEXT,
    status TEXT DEFAULT 'accepted',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (commission_id)
);

-- Timeline table used by UI tracking (additive)
CREATE TABLE IF NOT EXISTS commission_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commission_id UUID REFERENCES commission_requests(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    image_url TEXT,
    note TEXT,
    previous_status TEXT,
    new_status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4) Indexes
CREATE INDEX IF NOT EXISTS idx_artist_categories_category ON artist_categories(category);
CREATE INDEX IF NOT EXISTS idx_artist_categories_budget ON artist_categories(min_price, max_price);
CREATE INDEX IF NOT EXISTS idx_commission_requests_user ON commission_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_requests_status ON commission_requests(status);
CREATE INDEX IF NOT EXISTS idx_artist_requests_commission ON artist_requests(commission_id);
CREATE INDEX IF NOT EXISTS idx_artist_requests_artist ON artist_requests(artist_id);
CREATE INDEX IF NOT EXISTS idx_commission_deals_commission ON commission_deals(commission_id);
CREATE INDEX IF NOT EXISTS idx_commission_updates_commission ON commission_updates(commission_id);

-- 5) S3 bucket contract (backend env)
-- Required environment variables for strict separate buckets:
-- AWS_BUCKET_ARTIST_ARTWORKS
-- AWS_BUCKET_COMMISSION_REFERENCES
-- AWS_BUCKET_COMMISSION_DELIVERIES
