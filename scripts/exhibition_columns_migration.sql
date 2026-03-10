-- Migration: Add missing columns to exhibitions table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/lurvhgzauuzwftfymjym/sql/new

-- Add exhibition_images column (array of image URLs)
ALTER TABLE exhibitions 
ADD COLUMN IF NOT EXISTS exhibition_images TEXT[] DEFAULT '{}';

-- Add exhibition_paintings column (JSONB array of painting objects)
ALTER TABLE exhibitions 
ADD COLUMN IF NOT EXISTS exhibition_paintings JSONB DEFAULT '[]';

-- Add primary_exhibition_image column
ALTER TABLE exhibitions 
ADD COLUMN IF NOT EXISTS primary_exhibition_image TEXT;

-- Add payment_status column for manual payment workflow
ALTER TABLE exhibitions 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Add request_status column for admin workflow
ALTER TABLE exhibitions 
ADD COLUMN IF NOT EXISTS request_status TEXT DEFAULT 'pending';

-- Add artist_action_status for pause/delete requests
ALTER TABLE exhibitions 
ADD COLUMN IF NOT EXISTS artist_action_status TEXT;

-- Add artist_action_reason for pause/delete request reasons
ALTER TABLE exhibitions 
ADD COLUMN IF NOT EXISTS artist_action_reason TEXT;

-- Add payment_screenshot_url for manual payment proof
ALTER TABLE exhibitions 
ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;

-- Create exhibition_artworks junction table (alternative to JSONB)
CREATE TABLE IF NOT EXISTS exhibition_artworks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exhibition_id UUID REFERENCES exhibitions(id) ON DELETE CASCADE,
    artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exhibition_id, artwork_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_exhibition_artworks_exhibition_id 
ON exhibition_artworks(exhibition_id);

-- Enable RLS on exhibition_artworks
ALTER TABLE exhibition_artworks ENABLE ROW LEVEL SECURITY;

-- Allow public read access to exhibition_artworks
CREATE POLICY IF NOT EXISTS "Allow public read access to exhibition_artworks"
ON exhibition_artworks FOR SELECT
TO public
USING (true);

-- Allow authenticated users to manage their own exhibition artworks
CREATE POLICY IF NOT EXISTS "Allow artists to manage exhibition artworks"
ON exhibition_artworks FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM exhibitions 
        WHERE exhibitions.id = exhibition_artworks.exhibition_id 
        AND exhibitions.artist_id = auth.uid()
    )
);

COMMENT ON TABLE exhibition_artworks IS 'Junction table linking exhibitions to artworks';
COMMENT ON COLUMN exhibitions.exhibition_images IS 'Array of image URLs for the exhibition';
COMMENT ON COLUMN exhibitions.exhibition_paintings IS 'JSONB array of painting metadata objects';
COMMENT ON COLUMN exhibitions.primary_exhibition_image IS 'Primary/cover image URL for the exhibition';
