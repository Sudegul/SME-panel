from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Sale(Base):
    __tablename__ = "demo_sales"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("demo_employees.id"), nullable=False)
    visit_id = Column(Integer, ForeignKey("demo_visits.id"), nullable=False)  # Hangi ziyarette satış yapıldı
    product_name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    gift_quantity = Column(Integer, default=0)  # Hediye ürün miktarı
    sale_date = Column(DateTime, nullable=False)
    total_amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("Employee", back_populates="sales")
    visit = relationship("Visit", back_populates="sales")
