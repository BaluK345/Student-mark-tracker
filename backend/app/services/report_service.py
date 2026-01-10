from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.student import Student
from app.models.subject import Subject
from app.models.mark import Mark
from app.models.user import User
from app.schemas.report import StudentReport, SubjectMark, ClassReport


def calculate_grade(percentage: float) -> str:
    """Calculate grade based on percentage."""
    if percentage >= 90:
        return "A+"
    elif percentage >= 80:
        return "A"
    elif percentage >= 70:
        return "B+"
    elif percentage >= 60:
        return "B"
    elif percentage >= 50:
        return "C+"
    elif percentage >= 40:
        return "C"
    elif percentage >= 35:
        return "D"
    else:
        return "F"


def get_subject_grade(marks: int, max_marks: int) -> str:
    """Calculate grade for a single subject."""
    percentage = (marks / max_marks) * 100 if max_marks > 0 else 0
    return calculate_grade(percentage)


def generate_student_report(
    db: Session,
    student_id: int,
    exam_type: str = "Final"
) -> Optional[StudentReport]:
    """Generate comprehensive report for a student."""
    
    # Get student details
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return None
    
    user = db.query(User).filter(User.id == student.user_id).first()
    
    # Get all marks for the student
    marks = db.query(Mark).filter(
        Mark.student_id == student_id,
        Mark.exam_type == exam_type
    ).all()
    
    if not marks:
        return None
    
    # Build subject marks list
    subject_marks = []
    total_marks = 0
    total_max_marks = 0
    all_passed = True
    
    for mark in marks:
        subject = db.query(Subject).filter(Subject.id == mark.subject_id).first()
        if subject:
            subject_mark = SubjectMark(
                subject_name=subject.name,
                subject_code=subject.code,
                marks_obtained=mark.marks_obtained,
                max_marks=subject.max_marks,
                pass_marks=subject.pass_marks,
                status=mark.status,
                grade=get_subject_grade(mark.marks_obtained, subject.max_marks)
            )
            subject_marks.append(subject_mark)
            total_marks += mark.marks_obtained
            total_max_marks += subject.max_marks
            
            if mark.status == "Fail":
                all_passed = False
    
    # Calculate overall percentage and grade
    percentage = (total_marks / total_max_marks) * 100 if total_max_marks > 0 else 0
    overall_grade = calculate_grade(percentage)
    
    return StudentReport(
        student_id=student.id,
        student_name=user.full_name if user else "Unknown",
        roll_no=student.roll_no,
        class_name=student.class_name,
        section=student.section,
        exam_type=exam_type,
        subjects=subject_marks,
        total_marks=total_marks,
        total_max_marks=total_max_marks,
        percentage=round(percentage, 2),
        overall_grade=overall_grade,
        result="Pass" if all_passed else "Fail",
        generated_at=datetime.utcnow()
    )


def generate_class_report(
    db: Session,
    class_name: str,
    section: str = "A",
    exam_type: str = "Final"
) -> Optional[ClassReport]:
    """Generate class-level report with statistics."""
    
    # Get all students in the class
    students = db.query(Student).filter(
        Student.class_name == class_name,
        Student.section == section
    ).all()
    
    if not students:
        return None
    
    student_ids = [s.id for s in students]
    
    # Get all marks for these students
    marks = db.query(Mark).filter(
        Mark.student_id.in_(student_ids),
        Mark.exam_type == exam_type
    ).all()
    
    # Calculate statistics
    subject_stats = {}
    student_totals = {}
    
    for mark in marks:
        subject = db.query(Subject).filter(Subject.id == mark.subject_id).first()
        if subject:
            if subject.name not in subject_stats:
                subject_stats[subject.name] = {
                    "total_marks": 0,
                    "count": 0,
                    "passed": 0,
                    "failed": 0,
                    "max_marks": subject.max_marks
                }
            
            subject_stats[subject.name]["total_marks"] += mark.marks_obtained
            subject_stats[subject.name]["count"] += 1
            if mark.status == "Pass":
                subject_stats[subject.name]["passed"] += 1
            else:
                subject_stats[subject.name]["failed"] += 1
        
        if mark.student_id not in student_totals:
            student_totals[mark.student_id] = {"total": 0, "max": 0}
        student_totals[mark.student_id]["total"] += mark.marks_obtained
        if subject:
            student_totals[mark.student_id]["max"] += subject.max_marks
    
    # Calculate passed/failed students
    passed_students = 0
    failed_students = 0
    
    for student_id, totals in student_totals.items():
        # Check if student failed any subject
        student_marks = [m for m in marks if m.student_id == student_id]
        if any(m.status == "Fail" for m in student_marks):
            failed_students += 1
        else:
            passed_students += 1
    
    # Subject-wise statistics
    subject_wise_stats = []
    for subject_name, stats in subject_stats.items():
        avg = stats["total_marks"] / stats["count"] if stats["count"] > 0 else 0
        subject_wise_stats.append({
            "subject": subject_name,
            "average": round(avg, 2),
            "max_marks": stats["max_marks"],
            "passed": stats["passed"],
            "failed": stats["failed"],
            "pass_rate": round((stats["passed"] / stats["count"]) * 100, 2) if stats["count"] > 0 else 0
        })
    
    # Top performers
    top_performers = []
    for student_id, totals in sorted(
        student_totals.items(),
        key=lambda x: x[1]["total"],
        reverse=True
    )[:5]:
        student = next((s for s in students if s.id == student_id), None)
        if student:
            user = db.query(User).filter(User.id == student.user_id).first()
            percentage = (totals["total"] / totals["max"]) * 100 if totals["max"] > 0 else 0
            top_performers.append({
                "name": user.full_name if user else "Unknown",
                "roll_no": student.roll_no,
                "total": totals["total"],
                "percentage": round(percentage, 2),
                "grade": calculate_grade(percentage)
            })
    
    total_students = len(student_totals)
    pass_percentage = (passed_students / total_students) * 100 if total_students > 0 else 0
    
    return ClassReport(
        class_name=class_name,
        section=section,
        exam_type=exam_type,
        total_students=total_students,
        passed_students=passed_students,
        failed_students=failed_students,
        pass_percentage=round(pass_percentage, 2),
        subject_wise_stats=subject_wise_stats,
        top_performers=top_performers
    )
