from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Doctor(Base):
    __tablename__ = "demo_doctors"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False, index=True)  # Demo veride 'full_name'
    specialty = Column(String, nullable=True)
    hospital = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    city = Column(String, nullable=True)  # Demo veride 'city' var
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    pass
