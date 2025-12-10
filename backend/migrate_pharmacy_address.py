#!/usr/bin/env python3
"""
Pharmacy tablosuna adres kolonlarını ekleyen migration script
"""
import sys
sys.path.insert(0, '/Users/sudegul/Desktop/SMA_Panel/backend')

from app.database import engine
from sqlalchemy import text

def run_migration():
    """Migration'ı çalıştır"""
    with engine.connect() as conn:
        # Transaction başlat
        trans = conn.begin()

        try:
            print("Adding address columns to demo_pharmacies table...")

            # Kolonları ekle
            conn.execute(text("""
                ALTER TABLE demo_pharmacies
                ADD COLUMN IF NOT EXISTS city VARCHAR,
                ADD COLUMN IF NOT EXISTS district VARCHAR,
                ADD COLUMN IF NOT EXISTS street VARCHAR
            """))

            print("✓ Address columns added successfully")

            # Örnek adresler ekle
            print("\nAdding sample addresses...")
            conn.execute(text("""
                UPDATE demo_pharmacies SET city = 'istanbul', district = 'kadıköy', street = 'bahariye' WHERE id = 1;
                UPDATE demo_pharmacies SET city = 'istanbul', district = 'beşiktaş', street = 'çarşı' WHERE id = 2;
                UPDATE demo_pharmacies SET city = 'ankara', district = 'çankaya', street = 'tunalı hilmi' WHERE id = 3;
                UPDATE demo_pharmacies SET city = 'izmir', district = 'karşıyaka', street = 'çarşı' WHERE id = 4;
                UPDATE demo_pharmacies SET city = 'istanbul', district = 'şişli', street = 'nişantaşı' WHERE id = 5
            """))

            print("✓ Sample addresses added")

            # Commit
            trans.commit()
            print("\n✅ Migration completed successfully!")

            # Kontrol
            result = conn.execute(text("SELECT id, name, city, district, street FROM demo_pharmacies LIMIT 5"))
            print("\nSample data:")
            for row in result:
                print(f"  {row.id}: {row.name} - {row.district or 'N/A'} / {row.street or 'N/A'} / {row.city or 'N/A'}")

        except Exception as e:
            trans.rollback()
            print(f"\n❌ Migration failed: {e}")
            raise

if __name__ == "__main__":
    run_migration()
