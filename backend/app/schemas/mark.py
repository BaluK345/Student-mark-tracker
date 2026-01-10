from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime


class MarkBase(BaseModel):
    student_id: int
    subject_id: int
    marks_obtained: int
    exam_type: str = "Final"
    remarks: Optional[str] = None

    @field_validator('marks_obtained')
    @classmethod
    def validate_marks(cls, v):
        if v < 0:
            raise ValueError('Marks cannot be negative')
        if v > 100:
            raise ValueError('Marks cannot exceed 100')
        return v


class MarkCreate(MarkBase):
    pass


class MarkBulkCreate(BaseModel):
    """Bulk mark entry for a subject."""
    subject_id: int
    exam_type: str = "Final"
    marks: List[dict]  # List of {student_id: int, marks_obtained: int}


class MarkUpdate(BaseModel):
    marks_obtained: Optional[int] = None
    remarks: Optional[str] = None

    @field_validator('marks_obtained')
    @classmethod
    def validate_marks(cls, v):
        if v is not None:
            if v < 0:
                raise ValueError('Marks cannot be negative')
            if v > 100:
                raise ValueError('Marks cannot exceed 100')
        return v


class MarkResponse(MarkBase):
    id: int
    status: str
    entered_by: int
    created_at: datetime
    student_name: Optional[str] = None
    subject_name: Optional[str] = None
    max_marks: Optional[int] = None
    pass_marks: Optional[int] = None

    class Config:
        from_attributes = True


class MarkListResponse(BaseModel):
    marks: List[MarkResponse]
    total: int


class FailedStudentResponse(BaseModel):
    student_id: int
    student_name: str
    roll_no: str
    class_name: str
    subject_name: str
    marks_obtained: int
    max_marks: int
    pass_marks: int
    parent_email: Optional[str]
    email_sent: bool = False
