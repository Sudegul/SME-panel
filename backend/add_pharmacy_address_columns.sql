-- ======================================
-- ADD ADDRESS COLUMNS TO PHARMACIES
-- Eczane tablosuna adres bilgileri ekle
-- ======================================

-- 1. Yeni kolonları ekle
ALTER TABLE demo_pharmacies
ADD COLUMN IF NOT EXISTS city VARCHAR,
ADD COLUMN IF NOT EXISTS district VARCHAR,
ADD COLUMN IF NOT EXISTS street VARCHAR;

-- 2. Mevcut verilere örnek adresler ekle (isteğe bağlı)
-- İlk 10 eczaneye örnek adresler
UPDATE demo_pharmacies SET city = 'istanbul', district = 'kadıköy', street = 'bahariye' WHERE id = 1;
UPDATE demo_pharmacies SET city = 'istanbul', district = 'beşiktaş', street = 'çarşı' WHERE id = 2;
UPDATE demo_pharmacies SET city = 'ankara', district = 'çankaya', street = 'tunalı hilmi' WHERE id = 3;
UPDATE demo_pharmacies SET city = 'izmir', district = 'karşıyaka', street = 'çarşı' WHERE id = 4;
UPDATE demo_pharmacies SET city = 'istanbul', district = 'şişli', street = 'nişantaşı' WHERE id = 5;

-- 3. Kontrol: Tablo yapısını görüntüle
\d demo_pharmacies;

-- 4. Verileri kontrol et
SELECT id, name, city, district, street FROM demo_pharmacies LIMIT 10;
