-- ======================================
-- ADD FOREIGN KEY TO PHARMACY VISITS
-- Veri bütünlüğünü bozmadan pharmacy_id ekle
-- ======================================

-- 1. Yeni pharmacy_id kolonu ekle
ALTER TABLE demo_pharmacy_visits
ADD COLUMN pharmacy_id INTEGER;

-- 2. Mevcut veriler için pharmacy_id'leri doldur (pharmacy_name kullanarak)
UPDATE demo_pharmacy_visits pv
SET pharmacy_id = p.id
FROM demo_pharmacies p
WHERE pv.pharmacy_name = p.name;

-- 3. Kontrol: Hangi ziyaretler eşleşmedi? (olmamalı)
SELECT
    pv.id,
    pv.pharmacy_name,
    pv.pharmacy_id
FROM demo_pharmacy_visits pv
WHERE pv.pharmacy_id IS NULL;

-- 4. pharmacy_id kolonunu NOT NULL yap
ALTER TABLE demo_pharmacy_visits
ALTER COLUMN pharmacy_id SET NOT NULL;

-- 5. Foreign Key constraint ekle
ALTER TABLE demo_pharmacy_visits
ADD CONSTRAINT fk_pharmacy_visits_pharmacy
FOREIGN KEY (pharmacy_id) REFERENCES demo_pharmacies(id)
ON DELETE CASCADE;

-- 6. Index ekle (performans için)
CREATE INDEX idx_pharmacy_visits_pharmacy_id ON demo_pharmacy_visits(pharmacy_id);

-- ======================================
-- VERIFICATION
-- ======================================

-- Ziyaretlerin doğru eşleştiğini kontrol et
SELECT
    p.name as eczane_adi,
    COUNT(pv.id) as ziyaret_sayisi,
    SUM(pv.product_count) as toplam_urun,
    SUM(pv.mf_count) as toplam_mf
FROM demo_pharmacies p
LEFT JOIN demo_pharmacy_visits pv ON p.id = pv.pharmacy_id
GROUP BY p.id, p.name
ORDER BY ziyaret_sayisi DESC
LIMIT 10;

-- Tablo yapısını göster
\d demo_pharmacy_visits
