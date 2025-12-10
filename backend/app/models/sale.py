from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Sale(Base):
    __tablename__ = "demo_sales"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("demo_employees.id"), nullable=False)
    pharmacy_id = Column(Integer, ForeignKey("demo_pharmacies.id"), nullable=True)
    product_name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(10, 2), nullable=True)
    total_amount = Column(Numeric(10, 2), nullable=True)
    sale_date = Column(Date, nullable=False)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("Employee", back_populates="sales")
    pharmacy = relationship("Pharmacy", back_populates="sales")
