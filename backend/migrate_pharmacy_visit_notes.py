#!/usr/bin/env python3
"""
PharmacyVisit tablosuna notes kolonunu ekleyen migration script
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
            print("Adding notes column to demo_pharmacy_visits table...")

            # Notes kolonunu ekle
            conn.execute(text("""
                ALTER TABLE demo_pharmacy_visits
                ADD COLUMN IF NOT EXISTS notes TEXT
            """))

            print("✓ notes column added successfully")

            # Commit
            trans.commit()
            print("\n✅ Migration completed successfully!")

            # Kontrol
            result = conn.execute(text("SELECT id, pharmacy_name, product_count, mf_count, notes FROM demo_pharmacy_visits LIMIT 5"))
            print("\nSample data:")
            for row in result:
                print(f"  {row.id}: {row.pharmacy_name} - Products: {row.product_count}, MF: {row.mf_count}, Notes: {row.notes or 'N/A'}")

        except Exception as e:
            trans.rollback()
            print(f"\n❌ Migration failed: {e}")
            raise

if __name__ == "__main__":
    run_migration()
