-- Add is_approved column to demo_pharmacy_visits table
ALTER TABLE demo_pharmacy_visits
ADD COLUMN is_approved BOOLEAN DEFAULT FALSE NOT NULL;

-- Update existing records to false
UPDATE demo_pharmacy_visits
SET is_approved = FALSE
WHERE is_approved IS NULL;
