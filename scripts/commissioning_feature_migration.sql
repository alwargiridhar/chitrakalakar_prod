-- =====================================================
-- CHITRAKALAKAR - COMMISSIONING FEATURE MIGRATION
-- Run in Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    art_category TEXT NOT NULL,
    medium TEXT NOT NULL,
    width_ft DECIMAL(10,2) NOT NULL,
    height_ft DECIMAL(10,2) NOT NULL,
    square_feet DECIMAL(10,2) NOT NULL,
    skill_level TEXT NOT NULL CHECK (skill_level IN ('Average', 'Advanced')),
    detail_level TEXT NOT NULL CHECK (detail_level IN ('Basic', 'Detailed', 'Hyper Realistic')),
    subjects INTEGER NOT NULL DEFAULT 1,
    price_min DECIMAL(12,2) NOT NULL,
    price_max DECIMAL(12,2) NOT NULL,
    estimated_price DECIMAL(12,2) NOT NULL,
    reference_image_urls TEXT[] DEFAULT '{}',
    special_instructions TEXT,
    deadline DATE,
    framing_option TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    latest_wip_image TEXT,
    admin_note TEXT,
    status TEXT NOT NULL DEFAULT 'Requested' CHECK (status IN ('Requested', 'Accepted', 'In Progress', 'WIP Shared', 'Completed', 'Delivered')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commission_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commission_id UUID REFERENCES commissions(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    image_url TEXT,
    note TEXT,
    previous_status TEXT,
    new_status TEXT CHECK (new_status IN ('Requested', 'Accepted', 'In Progress', 'WIP Shared', 'Completed', 'Delivered')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_artist_id ON commissions(artist_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commission_updates_commission_id ON commission_updates(commission_id);

-- Optional RLS example (enable if your project uses strict RLS)
-- ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE commission_updates ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STORAGE / BUCKET PLAN
-- =====================================================
-- If using single AWS bucket + folders (current backend upload pattern):
--   1) commission-refs/<user_id>/...   (user references)
--   2) commission-wips/<artist_id>/... (artist WIP updates)
--
-- If using separate S3 buckets:
--   - chitrakalakar-commission-refs  (private read recommended)
--   - chitrakalakar-commission-wips  (public read allowed)
--
-- If using Supabase Storage:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES
--   ('commission-refs', 'commission-refs', false),
--   ('commission-wips', 'commission-wips', true)
-- ON CONFLICT (id) DO NOTHING;
