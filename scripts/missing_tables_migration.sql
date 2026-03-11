-- Migration: Missing tables for communities, exhibitions, and features
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/lurvhgzauuzwftfymjym/sql/new

-- ===============================
-- COMMUNITY JOIN REQUESTS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS community_join_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(community_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_join_requests_community ON community_join_requests(community_id);
CREATE INDEX IF NOT EXISTS idx_community_join_requests_status ON community_join_requests(status);

ALTER TABLE community_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of join requests" ON community_join_requests FOR SELECT TO public USING (true);
CREATE POLICY "Allow authenticated insert" ON community_join_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON community_join_requests FOR UPDATE TO authenticated USING (true);

-- ===============================
-- COMMUNITY INVITES TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS community_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    inviter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    invitee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    UNIQUE(community_id, invitee_id)
);

CREATE INDEX IF NOT EXISTS idx_community_invites_invitee ON community_invites(invitee_id);
CREATE INDEX IF NOT EXISTS idx_community_invites_status ON community_invites(status);

ALTER TABLE community_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of invites" ON community_invites FOR SELECT TO public USING (true);
CREATE POLICY "Allow authenticated insert" ON community_invites FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON community_invites FOR UPDATE TO authenticated USING (true);

-- ===============================
-- EXHIBITION REQUESTS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS exhibition_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    exhibition_tier TEXT NOT NULL,  -- 'kalakanksh', 'kalahruday', 'kaladeeksh'
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    duration_days INTEGER DEFAULT 7,
    payment_proof_url TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'submitted', 'verified', 'rejected')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exhibition_requests_artist ON exhibition_requests(artist_id);
CREATE INDEX IF NOT EXISTS idx_exhibition_requests_status ON exhibition_requests(status);

ALTER TABLE exhibition_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of exhibition requests" ON exhibition_requests FOR SELECT TO public USING (true);
CREATE POLICY "Allow authenticated insert" ON exhibition_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON exhibition_requests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete" ON exhibition_requests FOR DELETE TO authenticated USING (true);

-- ===============================
-- COMMUNITY POSTS TABLE (for community platform)
-- ===============================
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_community ON community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of posts" ON community_posts FOR SELECT TO public USING (true);
CREATE POLICY "Allow authenticated insert" ON community_posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON community_posts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete" ON community_posts FOR DELETE TO authenticated USING (true);

-- ===============================
-- POST LIKES TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read of likes" ON post_likes FOR SELECT TO public USING (true);
CREATE POLICY "Allow authenticated manage likes" ON post_likes FOR ALL TO authenticated USING (true);

-- ===============================
-- POST COMMENTS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read of comments" ON post_comments FOR SELECT TO public USING (true);
CREATE POLICY "Allow authenticated manage comments" ON post_comments FOR ALL TO authenticated USING (true);

-- ===============================
-- ADD OWNER/ROLE TO COMMUNITY_MEMBERS
-- ===============================
ALTER TABLE community_members 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member'));

-- ===============================
-- FEATURED ARTISTS TIMELINE COLUMNS
-- ===============================
ALTER TABLE featured_artists 
ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

ALTER TABLE featured_artists 
ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE featured_artists 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

COMMENT ON TABLE community_join_requests IS 'Join requests for communities';
COMMENT ON TABLE community_invites IS 'Invitations to join communities';
COMMENT ON TABLE exhibition_requests IS 'Artist requests to host exhibitions';
COMMENT ON TABLE community_posts IS 'Posts within communities';
