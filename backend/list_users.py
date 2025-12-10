"""
List all users in database
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from app.database import SessionLocal
from app.models import Employee

def list_users():
    """List all users"""
    db = SessionLocal()

    try:
        users = db.query(Employee).all()

        if not users:
            print("❗ No users found in database!")
            return

        print(f"Found {len(users)} user(s):")
        print("━" * 70)
        for user in users:
            status = "✓ Active" if user.is_active else "✗ Inactive"
            print(f"ID: {user.id}")
            print(f"Name: {user.full_name}")
            print(f"Email: {user.email}")
            print(f"Role: {user.role}")
            print(f"Status: {status}")
            print("─" * 70)

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    list_users()
