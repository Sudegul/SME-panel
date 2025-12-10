-- ======================================
-- PHARMACY TABLES UPDATE SCRIPT
-- Eczane tablolarını yeni yapıya göre güncelle
-- ======================================

-- Önce mevcut verileri temizle
TRUNCATE TABLE demo_pharmacies CASCADE;
TRUNCATE TABLE demo_pharmacy_visits CASCADE;

-- Pharmacy tablosunu sadeleştir - gereksiz kolonları kaldır
ALTER TABLE demo_pharmacies
DROP COLUMN IF EXISTS owner_name,
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS city;

-- PharmacyVisit tablosunu sadeleştir
ALTER TABLE demo_pharmacy_visits
DROP COLUMN IF EXISTS owner_name,
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS notes;

-- ======================================
-- DEMO DATA - PHARMACIES
-- ======================================

-- Eczaneler ekle (10 çalışan var, bazılarını farklı çalışanlara atayalım)
INSERT INTO demo_pharmacies (name, employee_id, is_approved, created_at) VALUES
('Hayat Eczanesi', 1, true, '2025-11-01 10:00:00'),
('Sağlık Eczanesi', 1, true, '2025-11-02 11:30:00'),
('Şifa Eczanesi', 2, true, '2025-11-03 09:15:00'),
('Yıldız Eczanesi', 2, false, '2025-11-04 14:20:00'),
('Merkez Eczanesi', 3, true, '2025-11-05 10:45:00'),
('Anadolu Eczanesi', 3, true, '2025-11-06 16:00:00'),
('Güneş Eczanesi', 4, false, '2025-11-07 08:30:00'),
('Ak Eczanesi', 4, true, '2025-11-08 13:15:00'),
('Deniz Eczanesi', 5, true, '2025-11-09 11:00:00'),
('Kardelen Eczanesi', 5, false, '2025-11-10 15:30:00'),
('Çınar Eczanesi', 6, true, '2025-11-11 09:45:00'),
('Lale Eczanesi', 6, true, '2025-11-12 14:00:00'),
('Papatya Eczanesi', 7, false, '2025-11-13 10:30:00'),
('Gül Eczanesi', 7, true, '2025-11-14 12:15:00'),
('Orkide Eczanesi', 8, true, '2025-11-15 08:00:00'),
('Nar Eczanesi', 8, false, '2025-11-16 16:45:00'),
('Zambak Eczanesi', 9, true, '2025-11-17 11:30:00'),
('Menekşe Eczanesi', 9, true, '2025-11-18 13:00:00'),
('Sümbül Eczanesi', 10, false, '2025-11-19 09:00:00'),
('Karanfil Eczanesi', 10, true, '2025-11-20 15:15:00');

-- ======================================
-- DEMO DATA - PHARMACY VISITS
-- ======================================

-- Her eczaneye birkaç ziyaret ekle (Kasım ve Aralık ayı)
-- Hayat Eczanesi ziyaretleri
INSERT INTO demo_pharmacy_visits (pharmacy_name, employee_id, visit_date, product_count, mf_count, created_at) VALUES
('Hayat Eczanesi', 1, '2025-11-01', 50, 10, '2025-11-01 10:00:00'),
('Hayat Eczanesi', 1, '2025-11-15', 30, 5, '2025-11-15 14:00:00'),
('Hayat Eczanesi', 1, '2025-12-01', 45, 8, '2025-12-01 11:00:00');

-- Sağlık Eczanesi ziyaretleri
INSERT INTO demo_pharmacy_visits (pharmacy_name, employee_id, visit_date, product_count, mf_count, created_at) VALUES
('Sağlık Eczanesi', 1, '2025-11-02', 60, 12, '2025-11-02 11:30:00'),
('Sağlık Eczanesi', 1, '2025-11-20', 40, 8, '2025-11-20 10:00:00'),
('Sağlık Eczanesi', 1, '2025-12-02', 35, 7, '2025-12-02 15:30:00');

-- Şifa Eczanesi ziyaretleri
INSERT INTO demo_pharmacy_visits (pharmacy_name, employee_id, visit_date, product_count, mf_count, created_at) VALUES
('Şifa Eczanesi', 2, '2025-11-03', 55, 11, '2025-11-03 09:15:00'),
('Şifa Eczanesi', 2, '2025-11-18', 25, 6, '2025-11-18 13:00:00'),
('Şifa Eczanesi', 2, '2025-12-03', 50, 10, '2025-12-03 09:00:00');

-- Yıldız Eczanesi ziyaretleri
INSERT INTO demo_pharmacy_visits (pharmacy_name, employee_id, visit_date, product_count, mf_count, created_at) VALUES
('Yıldız Eczanesi', 2, '2025-11-04', 70, 14, '2025-11-04 14:20:00'),
('Yıldız Eczanesi', 2, '2025-11-22', 35, 9, '2025-11-22 11:00:00');

-- Merkez Eczanesi ziyaretleri
INSERT INTO demo_pharmacy_visits (pharmacy_name, employee_id, visit_date, product_count, mf_count, created_at) VALUES
('Merkez Eczanesi', 3, '2025-11-05', 80, 16, '2025-11-05 10:45:00'),
('Merkez Eczanesi', 3, '2025-11-19', 45, 10, '2025-11-19 14:30:00'),
('Merkez Eczanesi', 3, '2025-12-01', 60, 12, '2025-12-01 10:00:00');

-- Anadolu Eczanesi ziyaretleri
INSERT INTO demo_pharmacy_visits (pharmacy_name, employee_id, visit_date, product_count, mf_count, created_at) VALUES
('Anadolu Eczanesi', 3, '2025-11-06', 65, 13, '2025-11-06 16:00:00'),
('Anadolu Eczanesi', 3, '2025-11-25', 40, 8, '2025-11-25 09:00:00');

-- Güneş Eczanesi ziyaretleri
INSERT INTO demo_pharmacy_visits (pharmacy_name, employee_id, visit_date, product_count, mf_count, created_at) VALUES
('Güneş Eczanesi', 4, '2025-11-07', 55, 11, '2025-11-07 08:30:00'),
('Güneş Eczanesi', 4, '2025-11-21', 30, 7, '2025-11-21 15:00:00'),
('Güneş Eczanesi', 4, '2025-12-02', 50, 10, '2025-12-02 11:30:00');

-- Ak Eczanesi ziyaretleri
INSERT INTO demo_pharmacy_visits (pharmacy_name, employee_id, visit_date, product_count, mf_count, created_at) VALUES
('Ak Eczanesi', 4, '2025-11-08', 75, 15, '2025-11-08 13:15:00'),
('Ak Eczanesi', 4, '2025-11-24', 42, 9, '2025-11-24 10:00:00');

-- Deniz Eczanesi ziyaretleri
INSERT INTO demo_pharmacy_visits (pharmacy_name, employee_id, visit_date, product_count, mf_count, created_at) VALUES
('Deniz Eczanesi', 5, '2025-11-09', 60, 12, '2025-11-09 11:00:00'),
('Deniz Eczanesi', 5, '2025-11-23', 38, 8, '2025-11-23 14:00:00'),
('Deniz Eczanesi', 5, '2025-12-03', 55, 11, '2025-12-03 10:30:00');

-- Kardelen Eczanesi ziyaretleri
INSERT INTO demo_pharmacy_visits (pharmacy_name, employee_id, visit_date, product_count, mf_count, created_at) VALUES
('Kardelen Eczanesi', 5, '2025-11-10', 48, 10, '2025-11-10 15:30:00'),
('Kardelen Eczanesi', 5, '2025-11-28', 32, 7, '2025-11-28 09:30:00');

-- Çınar Eczanesi ziyaretleri
INSERT INTO demo_pharmacy_visits (pharmacy_name, employee_id, visit_date, product_count, mf_count, created_at) VALUES
('Çınar Eczanesi', 6, '2025-11-11', 70, 14, '2025-11-11 09:45:00'),
('Çınar Eczanesi', 6, '2025-11-26', 44, 9, '2025-11-26 13:00:00');

-- Lale Eczanesi ziyaretleri
INSERT INTO demo_pharmacy_visits (pharmacy_name, employee_id, visit_date, product_count, mf_count, created_at) VALUES
('Lale Eczanesi', 6, '2025-11-12', 52, 11, '2025-11-12 14:00:00'),
('Lale Eczanesi', 6, '2025-11-29', 36, 8, '2025-11-29 10:15:00');

-- Papatya Eczanesi ziyaretleri
INSERT INTO demo_pharmacy_visits (pharmacy_name, employee_id, visit_date, product_count, mf_count, created_at) VALUES
('Papatya Eczanesi', 7, '2025-11-13', 58, 12, '2025-11-13 10:30:00'),
('Papatya Eczanesi', 7, '2025-11-27', 40, 8, '2025-11-27 15:00:00');

-- Gül Eczanesi ziyaretleri
INSERT INTO demo_pharmacy_visits (pharmacy_name, employee_id, visit_date, product_count, mf_count, created_at) VALUES
('Gül Eczanesi', 7, '2025-11-14', 64, 13, '2025-11-14 12:15:00'),
('Gül Eczanesi', 7, '2025-11-30', 42, 9, '2025-11-30 11:00:00');

-- Orkide Eczanesi ziyaretleri
INSERT INTO demo_pharmacy_visits (pharmacy_name, employee_id, visit_date, product_count, mf_count, created_at) VALUES
('Orkide Eczanesi', 8, '2025-11-15', 72, 14, '2025-11-15 08:00:00'),
('Orkide Eczanesi', 8, '2025-12-01', 46, 10, '2025-12-01 14:00:00');

-- Nar Eczanesi ziyaretleri
INSERT INTO demo_pharmacy_visits (pharmacy_name, employee_id, visit_date, product_count, mf_count, created_at) VALUES
('Nar Eczanesi', 8, '2025-11-16', 54, 11, '2025-11-16 16:45:00'),
('Nar Eczanesi', 8, '2025-12-02', 38, 8, '2025-12-02 09:30:00');

-- Zambak Eczanesi ziyaretleri
INSERT INTO demo_pharmacy_visits (pharmacy_name, employee_id, visit_date, product_count, mf_count, created_at) VALUES
('Zambak Eczanesi', 9, '2025-11-17', 66, 13, '2025-11-17 11:30:00'),
('Zambak Eczanesi', 9, '2025-12-03', 44, 9, '2025-12-03 13:00:00');

-- Menekşe Eczanesi ziyaretleri
INSERT INTO demo_pharmacy_visits (pharmacy_name, employee_id, visit_date, product_count, mf_count, created_at) VALUES
('Menekşe Eczanesi', 9, '2025-11-18', 50, 10, '2025-11-18 13:00:00'),
('Menekşe Eczanesi', 9, '2025-12-01', 36, 8, '2025-12-01 10:30:00');

-- Sümbül Eczanesi ziyaretleri
INSERT INTO demo_pharmacy_visits (pharmacy_name, employee_id, visit_date, product_count, mf_count, created_at) VALUES
('Sümbül Eczanesi', 10, '2025-11-19', 62, 12, '2025-11-19 09:00:00'),
('Sümbül Eczanesi', 10, '2025-12-02', 40, 8, '2025-12-02 14:30:00');

-- Karanfil Eczanesi ziyaretleri
INSERT INTO demo_pharmacy_visits (pharmacy_name, employee_id, visit_date, product_count, mf_count, created_at) VALUES
('Karanfil Eczanesi', 10, '2025-11-20', 56, 11, '2025-11-20 15:15:00'),
('Karanfil Eczanesi', 10, '2025-12-03', 42, 9, '2025-12-03 11:00:00');

-- ======================================
-- VERIFICATION QUERIES
-- ======================================

-- Eczane sayısı
SELECT COUNT(*) as total_pharmacies FROM demo_pharmacies;

-- Onaylanan eczaneler
SELECT COUNT(*) as approved_pharmacies FROM demo_pharmacies WHERE is_approved = true;

-- Toplam ziyaret sayısı
SELECT COUNT(*) as total_visits FROM demo_pharmacy_visits;

-- Çalışanlara göre eczane dağılımı
SELECT
    e.full_name,
    COUNT(p.id) as pharmacy_count
FROM demo_employees e
LEFT JOIN demo_pharmacies p ON p.employee_id = e.id
GROUP BY e.id, e.full_name
ORDER BY pharmacy_count DESC;

-- Toplam ürün ve MF sayıları
SELECT
    SUM(product_count) as total_products,
    SUM(mf_count) as total_mf
FROM demo_pharmacy_visits;

-- Eczanelere göre ürün ve MF toplamları
SELECT
    pharmacy_name,
    SUM(product_count) as total_products,
    SUM(mf_count) as total_mf,
    COUNT(*) as visit_count
FROM demo_pharmacy_visits
GROUP BY pharmacy_name
ORDER BY total_products DESC
LIMIT 10;
