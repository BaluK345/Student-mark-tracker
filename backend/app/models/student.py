from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Student(Base):
    """Student model with profile information and parent contact."""
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    roll_no = Column(String(50), unique=True, nullable=False)
    class_name = Column(String(50), nullable=False)
    section = Column(String(10), default="A")
    parent_name = Column(String(255))
    parent_email = Column(String(255))
    parent_phone = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="student_profile")
    marks = relationship("Mark", back_populates="student", cascade="all, delete-orphan")
