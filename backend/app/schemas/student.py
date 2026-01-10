from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class StudentBase(BaseModel):
    roll_no: str
    class_name: str
    section: str = "A"
    parent_name: Optional[str] = None
    parent_email: Optional[EmailStr] = None
    parent_phone: Optional[str] = None


class StudentCreate(StudentBase):
    user_id: int


class StudentCreateWithUser(StudentBase):
    """Create student along with user account."""
    email: EmailStr
    password: str
    full_name: str


class StudentUpdate(BaseModel):
    roll_no: Optional[str] = None
    class_name: Optional[str] = None
    section: Optional[str] = None
    parent_name: Optional[str] = None
    parent_email: Optional[EmailStr] = None
    parent_phone: Optional[str] = None


class StudentResponse(StudentBase):
    id: int
    user_id: int
    created_at: datetime
    full_name: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True


class StudentListResponse(BaseModel):
    students: List[StudentResponse]
    total: int
