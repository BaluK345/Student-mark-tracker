from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Mark(Base):
    """Mark model storing student marks with auto pass/fail status."""
    __tablename__ = "marks"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    marks_obtained = Column(Integer, nullable=False)
    status = Column(String(10), default="Pass")  # Pass or Fail
    exam_type = Column(String(50), default="Final")  # Midterm, Final, etc.
    remarks = Column(String(255), nullable=True)
    entered_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    student = relationship("Student", back_populates="marks")
    subject = relationship("Subject", back_populates="marks")
    teacher = relationship("User", backref="marks_entered")

    # Unique constraint to prevent duplicate entries
    __table_args__ = (
        UniqueConstraint('student_id', 'subject_id', 'exam_type', name='unique_student_subject_exam'),
    )
