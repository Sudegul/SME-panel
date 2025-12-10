-- Add missing fields to demo_pharmacy_visits table
ALTER TABLE demo_pharmacy_visits
ADD COLUMN pharmacy_address VARCHAR,
ADD COLUMN start_time TIME,
ADD COLUMN end_time TIME;

-- Update existing records with address from pharmacy table
UPDATE demo_pharmacy_visits pv
SET pharmacy_address = (
    SELECT CONCAT_WS(', ', p.street, p.district, p.city)
    FROM demo_pharmacies p
    WHERE p.id = pv.pharmacy_id
)
WHERE pv.pharmacy_id IS NOT NULL;
