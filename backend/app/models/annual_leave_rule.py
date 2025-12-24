from sqlalchemy import Column, Integer
from ..database import Base


class AnnualLeaveRule(Base):
    """
    Yıllık izin hakkı kuralları
    Çalışma yılına göre kaç gün yıllık izin hakkı verileceğini tanımlar
    """
    __tablename__ = "annual_leave_rules"

    id = Column(Integer, primary_key=True, index=True)
    year_of_service = Column(Integer, nullable=False, unique=True)  # Kaçıncı yıl (1, 2, 3, ...)
    days_entitled = Column(Integer, nullable=False)  # Hak edilen gün sayısı

    def __repr__(self):
        return f"<AnnualLeaveRule(year={self.year_of_service}, days={self.days_entitled})>"
