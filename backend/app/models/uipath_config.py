from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func

from app.core.database import Base


class UiPathConfig(Base):
    """UiPath automation configuration for email delivery."""
    __tablename__ = "uipath_config"

    id = Column(Integer, primary_key=True, index=True)
    webhook_url = Column(String(1000), nullable=False)
    api_token = Column(String(1000), nullable=True)
    tenant_name = Column(String(255), nullable=True)
    process_name = Column(String(255), nullable=True)
    is_enabled = Column(Boolean, nullable=False, default=False)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())