from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class SubjectMark(BaseModel):
    subject_name: str
    subject_code: str
    marks_obtained: int
    max_marks: int
    pass_marks: int
    status: str
    grade: str


class StudentReport(BaseModel):
    student_id: int
    student_name: str
    roll_no: str
    class_name: str
    section: str
    exam_type: str
    subjects: List[SubjectMark]
    total_marks: int
    total_max_marks: int
    percentage: float
    overall_grade: str
    result: str  # Pass or Fail
    generated_at: datetime


class ClassReport(BaseModel):
    class_name: str
    section: str
    exam_type: str
    total_students: int
    passed_students: int
    failed_students: int
    pass_percentage: float
    subject_wise_stats: List[dict]
    top_performers: List[dict]
