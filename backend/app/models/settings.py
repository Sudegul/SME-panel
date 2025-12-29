from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from ..database import Base


class VisitColorScale(Base):
    """Durum raporu renk skalası ayarları"""
    __tablename__ = "visit_color_scale"

    id = Column(Integer, primary_key=True, index=True)
    color = Column(String(20), nullable=False, unique=True)  # 'yellow', 'orange', 'green'
    min_visits = Column(Integer, nullable=False)  # Minimum ziyaret sayısı
    max_visits = Column(Integer, nullable=True)  # Maximum ziyaret sayısı (None = sınırsız)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        if self.max_visits:
            return f"<VisitColorScale {self.color}: {self.min_visits}-{self.max_visits}>"
        else:
            return f"<VisitColorScale {self.color}: {self.min_visits}+>"
