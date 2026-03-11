-- Migration: Add room/space category for artworks
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/lurvhgzauuzwftfymjym/sql/new

-- Add suitable_rooms column to artworks table (array of room types)
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS suitable_rooms TEXT[] DEFAULT '{}';

-- Common room types: living_room, bedroom, office, hotel, hospital, school, dining_room, hallway, bathroom

COMMENT ON COLUMN artworks.suitable_rooms IS 'Array of room types this artwork is suitable for (living_room, bedroom, office, hotel, etc.)';

-- Create index for faster room-based filtering
CREATE INDEX IF NOT EXISTS idx_artworks_suitable_rooms 
ON artworks USING GIN(suitable_rooms);
