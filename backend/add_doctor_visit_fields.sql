-- Add missing fields to demo_doctor_visits table
ALTER TABLE demo_doctor_visits
ADD COLUMN start_time TIME,
ADD COLUMN end_time TIME,
ADD COLUMN is_approved BOOLEAN DEFAULT FALSE NOT NULL;

-- Update existing records to false (already default)
UPDATE demo_doctor_visits
SET is_approved = FALSE
WHERE is_approved IS NULL;
