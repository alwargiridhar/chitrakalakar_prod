-- Migration: AI Pricing Engine columns for artworks
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/lurvhgzauuzwftfymjym/sql/new

-- Add pricing analysis columns to artworks table
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS pricing_badge TEXT;  -- 'green', 'yellow', 'red'

ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS pricing_evaluation TEXT;  -- 'fair', 'slightly_high', 'overpriced', 'underpriced'

ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS pricing_buyer_message TEXT;  -- Message explaining the price evaluation

ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS pricing_suggested_range JSONB;  -- {"min": value, "max": value}

ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS pricing_artist_justification TEXT;  -- Artist's explanation for premium pricing

-- Add artwork metadata columns for pricing calculation
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS artwork_width NUMERIC;  -- Width in inches

ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS artwork_height NUMERIC;  -- Height in inches

ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS realism_level TEXT;  -- 'abstract', 'impressionistic', 'realism', 'hyperrealism'

ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS detailing_level TEXT;  -- 'average', 'high_accuracy', 'excellent'

ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS uniqueness TEXT;  -- 'original', 'limited_edition', 'multiple_copies'

ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS hours_spent INTEGER;  -- Estimated hours spent on artwork

ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS material_cost NUMERIC;  -- Material cost in INR

-- Index for faster filtering by pricing badge
CREATE INDEX IF NOT EXISTS idx_artworks_pricing_badge 
ON artworks(pricing_badge) WHERE pricing_badge IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN artworks.pricing_badge IS 'Transparency badge: green (fair), yellow (slightly high), red (overpriced)';
COMMENT ON COLUMN artworks.pricing_evaluation IS 'AI evaluation: fair, slightly_high, overpriced, underpriced';
COMMENT ON COLUMN artworks.pricing_buyer_message IS 'Explanation message shown to buyers';
COMMENT ON COLUMN artworks.pricing_suggested_range IS 'AI suggested price range as JSON {min, max}';
COMMENT ON COLUMN artworks.pricing_artist_justification IS 'Artist explanation for premium pricing';
