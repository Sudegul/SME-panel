from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base


class FeedbackTargetType(str, enum.Enum):
    DOCTOR = "DOCTOR"
    PHARMACY = "PHARMACY"


class Feedback(Base):
    """
    Manager'ların çalışanlara doktor/eczane ziyaretleri hakkında geri dönüş yapması için tablo.

    Örnek Senaryo:
    - Çalışan bir doktoru ziyaret eder (visit kaydı oluşur)
    - Manager bu ziyareti görür ve geri dönüş yapar
    - Çalışan "Geri Dönüşler" sayfasından manager'ın yorumunu görür

    Neden Ayrı Tablo?
    - Bir ziyaret için birden fazla geri dönüş olabilir
    - Geri dönüşler silinse bile ziyaret ve doktor/eczane verisi korunur
    - Filtreleme ve raporlama kolay olur
    """
    __tablename__ = "demo_feedbacks"

    id = Column(Integer, primary_key=True, index=True)

    # Kim geri dönüş yaptı (Manager)
    manager_id = Column(Integer, ForeignKey("demo_employees.id"), nullable=False)

    # Kime geri dönüş yapıldı (Employee)
    employee_id = Column(Integer, ForeignKey("demo_employees.id"), nullable=False)

    # Hangi ziyaret için (opsiyonel - visit yoksa doğrudan doktor/eczane için de yapılabilir)
    visit_id = Column(Integer, ForeignKey("demo_visits.id"), nullable=True)

    # Doktor mu eczane mi?
    visit_type = Column(Enum(FeedbackTargetType), nullable=False)

    # Hangi doktor/eczane (doctor_id veya pharmacy_id)
    target_id = Column(Integer, nullable=False)

    # Doktor/Eczane adı (cache için - silinseler bile isim korunsun)
    target_name = Column(String, nullable=False)

    # Geri dönüş metni
    feedback_text = Column(Text, nullable=False)

    # Çalışan okudu mu?
    is_read = Column(Boolean, default=False)

    # Oluşturulma tarihi
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    manager = relationship("Employee", foreign_keys=[manager_id])
    employee = relationship("Employee", foreign_keys=[employee_id])
    visit = relationship("Visit")
