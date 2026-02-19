-- =====================================================
-- CHITRAKALAKAR - ADDITIONAL TABLES MIGRATION
-- Run this after the main migration script
-- =====================================================

-- =====================================================
-- MEMBERSHIP PLANS TABLE (Admin can modify pricing)
-- =====================================================

CREATE TABLE IF NOT EXISTS membership_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    features TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

-- Insert default plans
INSERT INTO membership_plans (id, name, price, duration_days, features, is_active) VALUES
('basic', 'Basic', 999, 30, ARRAY['Appear in Artists Directory', 'Upload up to 10 artworks', 'Basic portfolio page', 'Email support'], true),
('premium', 'Premium', 2499, 90, ARRAY['Everything in Basic', 'Upload unlimited artworks', 'Featured artist placement', 'Priority support', 'Analytics dashboard'], true),
('annual', 'Annual', 7999, 365, ARRAY['Everything in Premium', 'Custom portfolio URL', 'Exhibition priority', 'Dedicated account manager', 'Marketing features', '2 months FREE'], true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VOUCHERS TABLE (Discounts & Promotions)
-- =====================================================

CREATE TABLE IF NOT EXISTS vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    max_uses INTEGER DEFAULT 100,
    current_uses INTEGER DEFAULT 0,
    applicable_plans TEXT[] DEFAULT '{}',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_active ON vouchers(is_active);

-- =====================================================
-- COMMUNITY TABLES (Enhanced)
-- =====================================================

-- Update communities table with new fields
ALTER TABLE communities ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS invite_criteria JSONB;

-- Community Join Requests
CREATE TABLE IF NOT EXISTS community_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES profiles(id),
    UNIQUE(community_id, user_id, status)
);

-- Community Invites
CREATE TABLE IF NOT EXISTS community_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES profiles(id),
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    UNIQUE(community_id, user_id)
);

-- Community Posts
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    post_type TEXT DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'announcement')),
    likes INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community Post Comments
CREATE TABLE IF NOT EXISTS community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update community_members with role
ALTER TABLE community_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member'));

-- =====================================================
-- HELPER FUNCTION: Increment community members
-- =====================================================

CREATE OR REPLACE FUNCTION increment_community_members(community_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE communities 
    SET member_count = member_count + 1 
    WHERE id = community_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_community_join_requests_status ON community_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_community_invites_user ON community_invites(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_community ON community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);

-- =====================================================
-- S3 BUCKET SETUP INSTRUCTIONS
-- =====================================================

/*
AWS S3 BUCKET SETUP FOR CHITRAKALAKAR
=====================================

You need to create the following S3 buckets:

1. ARTWORKS BUCKET: chitrakalakar-artworks
   - Purpose: Store artwork images uploaded by artists
   - Public Read: Yes (for displaying on website)
   - Folders: /artworks/, /thumbnails/

2. AVATARS BUCKET: chitrakalakar-avatars
   - Purpose: Store user profile pictures
   - Public Read: Yes
   - Folders: /avatars/

3. CONTEMPORARY ARTISTS BUCKET: chitrakalakar-contemporary
   - Purpose: Store contemporary artist images and artworks
   - Public Read: Yes
   - Folders: /artists/, /artworks/

4. COMMUNITIES BUCKET: chitrakalakar-communities
   - Purpose: Store community images and post attachments
   - Public Read: Yes
   - Folders: /logos/, /posts/, /covers/

5. EXHIBITIONS BUCKET: chitrakalakar-exhibitions
   - Purpose: Store exhibition banners and related images
   - Public Read: Yes
   - Folders: /banners/, /artworks/

BUCKET POLICY (Apply to all buckets for public read):
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::BUCKET_NAME/*"
        }
    ]
}

CORS CONFIGURATION (Apply to all buckets):
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"]
    }
]

ENVIRONMENT VARIABLES NEEDED:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION (e.g., ap-south-1 for Mumbai)
- S3_BUCKET_ARTWORKS=chitrakalakar-artworks
- S3_BUCKET_AVATARS=chitrakalakar-avatars
- S3_BUCKET_CONTEMPORARY=chitrakalakar-contemporary
- S3_BUCKET_COMMUNITIES=chitrakalakar-communities
- S3_BUCKET_EXHIBITIONS=chitrakalakar-exhibitions

*/

-- =====================================================
-- SUPABASE STORAGE BUCKETS (Alternative to S3)
-- =====================================================

/*
If using Supabase Storage instead of S3:

1. Go to Supabase Dashboard → Storage
2. Create buckets:
   - artworks (public)
   - avatars (public)
   - contemporary (public)
   - communities (public)
   - exhibitions (public)

3. Set bucket policies to allow public access:
   - Go to each bucket → Policies
   - Add policy: "Allow public access for SELECT"
   
SQL to create storage policies:
*/

-- Allow public access to all storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('artworks', 'artworks', true),
('avatars', 'avatars', true),
('contemporary', 'contemporary', true),
('communities', 'communities', true),
('exhibitions', 'exhibitions', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create policies for authenticated uploads
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Public can view" ON storage.objects
FOR SELECT TO public USING (true);

CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE TO authenticated USING (auth.uid()::text = (storage.foldername(name))[1]);
