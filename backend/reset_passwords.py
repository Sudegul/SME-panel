"""Reset user passwords to default"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from app.database import SessionLocal
from app.models.employee import Employee
from app.utils.auth import get_password_hash

def reset_passwords():
    db = SessionLocal()
    try:
        # Get all active users
        users = db.query(Employee).filter(Employee.is_active == True).all()

        # Reset password to "password" for all users
        default_password = "password"
        hashed = get_password_hash(default_password)

        for user in users:
            user.hashed_password = hashed
            print(f"✅ Reset password for: {user.email} ({user.role})")

        db.commit()
        print(f"\n✅ All passwords reset to: {default_password}")
        print("\nYou can now login with:")
        print(f"  Email: {users[0].email if users else 'N/A'}")
        print(f"  Password: {default_password}")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_passwords()
