from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SubjectBase(BaseModel):
    name: str
    code: str
    max_marks: int = 100
    pass_marks: int = 35


class SubjectCreate(SubjectBase):
    teacher_id: Optional[int] = None


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    max_marks: Optional[int] = None
    pass_marks: Optional[int] = None
    teacher_id: Optional[int] = None


class SubjectResponse(SubjectBase):
    id: int
    teacher_id: Optional[int]
    created_at: datetime
    teacher_name: Optional[str] = None

    class Config:
        from_attributes = True


class SubjectListResponse(BaseModel):
    subjects: List[SubjectResponse]
    total: int
