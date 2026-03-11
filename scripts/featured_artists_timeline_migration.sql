-- Migration: Add timeline support for featured artists
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/lurvhgzauuzwftfymjym/sql/new

-- Add featured_until column to featured_artists table for auto-expiry
ALTER TABLE featured_artists 
ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

-- Add featured_at column to track when artist was featured
ALTER TABLE featured_artists 
ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ DEFAULT NOW();

-- Add is_active column to easily toggle featured status
ALTER TABLE featured_artists 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for faster queries on active featured artists
CREATE INDEX IF NOT EXISTS idx_featured_artists_active 
ON featured_artists(is_active, featured_until);

COMMENT ON COLUMN featured_artists.featured_until IS 'When the featured status expires (NULL = indefinite)';
COMMENT ON COLUMN featured_artists.featured_at IS 'When the artist was featured';
COMMENT ON COLUMN featured_artists.is_active IS 'Whether the featured status is currently active';
