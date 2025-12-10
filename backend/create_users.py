"""
Create demo users for testing
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from app.database import SessionLocal
from app.models import Employee, EmployeeRole
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_demo_users():
    """Create demo users"""
    db = SessionLocal()

    try:
        # Check if users already exist
        existing = db.query(Employee).first()
        if existing:
            print("❗ Users already exist in database!")
            print(f"Found user: {existing.email}")
            return

        # Create manager user
        manager = Employee(
            full_name="Sema Ekinci",
            email="sema.ekinci@demo.com",
            password_hash=pwd_context.hash("password"),
            role=EmployeeRole.MANAGER,
            phone="0555 123 4567",
            is_active=True
        )
        db.add(manager)

        # Create employee user
        employee = Employee(
            full_name="Ahmet Kaya",
            email="ahmet.kaya@demo.com",
            password_hash=pwd_context.hash("password"),
            role=EmployeeRole.EMPLOYEE,
            phone="0555 987 6543",
            is_active=True
        )
        db.add(employee)

        db.commit()

        print("✅ Demo users created successfully!")
        print("\nLogin credentials:")
        print("━" * 50)
        print("Manager:")
        print("  Email: sema.ekinci@demo.com")
        print("  Password: password")
        print("\nEmployee:")
        print("  Email: ahmet.kaya@demo.com")
        print("  Password: password")
        print("━" * 50)

    except Exception as e:
        print(f"❌ Error creating users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_users()
