from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func

from app.core.database import Base


class SMTPConfig(Base):
    """SMTP configuration for email automation."""
    __tablename__ = "smtp_config"

    id = Column(Integer, primary_key=True, index=True)
    host = Column(String(255), nullable=False)
    port = Column(Integer, nullable=False, default=587)
    username = Column(String(255), nullable=True)
    password = Column(String(255), nullable=True)
    from_email = Column(String(255), nullable=True)
    from_name = Column(String(255), nullable=False, default="Student Mark Tracker")
    use_tls = Column(Boolean, nullable=False, default=True)
    is_enabled = Column(Boolean, nullable=False, default=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())