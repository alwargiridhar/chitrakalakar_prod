-- Featured Requests Table for Paid Featured Artist System
-- Run this in your Supabase SQL Editor

-- Create featured_requests table
CREATE TABLE IF NOT EXISTS featured_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    payment_reference TEXT,
    duration_days INTEGER DEFAULT 5,
    amount INTEGER DEFAULT 100,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES profiles(id),
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    expires_at TIMESTAMPTZ
);

-- Add expires_at column to featured_artists if not exists
ALTER TABLE featured_artists 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS paid_amount INTEGER,
ADD COLUMN IF NOT EXISTS artist_id UUID REFERENCES profiles(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_featured_requests_artist_id ON featured_requests(artist_id);
CREATE INDEX IF NOT EXISTS idx_featured_requests_status ON featured_requests(status);
CREATE INDEX IF NOT EXISTS idx_featured_artists_expires_at ON featured_artists(expires_at);
CREATE INDEX IF NOT EXISTS idx_featured_artists_artist_id ON featured_artists(artist_id);

-- RLS Policies for featured_requests
ALTER TABLE featured_requests ENABLE ROW LEVEL SECURITY;

-- Artists can view their own requests
CREATE POLICY "Artists can view own requests" ON featured_requests
    FOR SELECT USING (auth.uid() = artist_id);

-- Artists can create their own requests
CREATE POLICY "Artists can create own requests" ON featured_requests
    FOR INSERT WITH CHECK (auth.uid() = artist_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all requests" ON featured_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update requests" ON featured_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Comment for documentation
COMMENT ON TABLE featured_requests IS 'Stores artist requests to be featured on homepage (₹100 for 5 days)';
