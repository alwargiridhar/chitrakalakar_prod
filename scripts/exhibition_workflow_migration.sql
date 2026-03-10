-- Exhibition workflow additive migration (non-breaking)

ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS exhibition_images TEXT[] DEFAULT '{}';
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS primary_exhibition_image TEXT;
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'manual';
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending_manual_approval';
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS request_status TEXT DEFAULT 'pending_admin_payment_review';
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_exhibitions_status ON exhibitions(status);
CREATE INDEX IF NOT EXISTS idx_exhibitions_request_status ON exhibitions(request_status);

-- S3 bucket needed for payment screenshot proofs:
-- bucket name: exhibition-payment-proofs