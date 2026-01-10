from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_teacher, get_current_user
from app.models.user import User
from app.models.student import Student
from app.models.subject import Subject
from app.models.mark import Mark
from app.schemas.mark import (
    MarkCreate,
    MarkBulkCreate,
    MarkUpdate,
    MarkResponse,
    MarkListResponse,
    FailedStudentResponse
)
from app.services.email_service import send_fail_alert_email

router = APIRouter(prefix="/marks", tags=["Marks"])


async def check_and_send_fail_alert(
    db: Session,
    mark: Mark,
    student: Student,
    subject: Subject
):
    """Check if student failed and send email alert to parent."""
    if mark.status == "Fail" and student.parent_email:
        user = db.query(User).filter(User.id == student.user_id).first()
        await send_fail_alert_email(
            parent_email=student.parent_email,
            parent_name=student.parent_name or "Parent/Guardian",
            student_name=user.full_name if user else "Student",
            roll_no=student.roll_no,
            class_name=student.class_name,
            subject_name=subject.name,
            marks_obtained=mark.marks_obtained,
            max_marks=subject.max_marks,
            pass_marks=subject.pass_marks
        )


@router.post("/", response_model=MarkResponse, status_code=status.HTTP_201_CREATED)
async def create_mark(
    mark_data: MarkCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Enter marks for a student in a subject."""
    # Validate student exists
    student = db.query(Student).filter(Student.id == mark_data.student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Validate subject exists
    subject = db.query(Subject).filter(Subject.id == mark_data.subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Check for existing mark entry
    existing = db.query(Mark).filter(
        Mark.student_id == mark_data.student_id,
        Mark.subject_id == mark_data.subject_id,
        Mark.exam_type == mark_data.exam_type
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mark entry already exists for this student, subject, and exam type"
        )
    
    # Validate marks don't exceed max
    if mark_data.marks_obtained > subject.max_marks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Marks cannot exceed maximum marks ({subject.max_marks})"
        )
    
    # Determine pass/fail status
    status_value = "Pass" if mark_data.marks_obtained >= subject.pass_marks else "Fail"
    
    mark = Mark(
        student_id=mark_data.student_id,
        subject_id=mark_data.subject_id,
        marks_obtained=mark_data.marks_obtained,
        exam_type=mark_data.exam_type,
        remarks=mark_data.remarks,
        status=status_value,
        entered_by=current_user.id
    )
    
    db.add(mark)
    db.commit()
    db.refresh(mark)
    
    # Send email alert if failed (in background)
    if status_value == "Fail":
        background_tasks.add_task(
            check_and_send_fail_alert,
            db, mark, student, subject
        )
    
    user = db.query(User).filter(User.id == student.user_id).first()
    
    return MarkResponse(
        id=mark.id,
        student_id=mark.student_id,
        subject_id=mark.subject_id,
        marks_obtained=mark.marks_obtained,
        exam_type=mark.exam_type,
        remarks=mark.remarks,
        status=mark.status,
        entered_by=mark.entered_by,
        created_at=mark.created_at,
        student_name=user.full_name if user else None,
        subject_name=subject.name,
        max_marks=subject.max_marks,
        pass_marks=subject.pass_marks
    )


@router.post("/bulk", response_model=List[MarkResponse], status_code=status.HTTP_201_CREATED)
async def create_marks_bulk(
    bulk_data: MarkBulkCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Bulk enter marks for multiple students in a subject."""
    # Validate subject exists
    subject = db.query(Subject).filter(Subject.id == bulk_data.subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    created_marks = []
    
    for mark_entry in bulk_data.marks:
        student_id = mark_entry.get("student_id")
        marks_obtained = mark_entry.get("marks_obtained")
        
        if student_id is None or marks_obtained is None:
            continue
        
        # Validate student exists
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            continue
        
        # Check for existing mark entry
        existing = db.query(Mark).filter(
            Mark.student_id == student_id,
            Mark.subject_id == bulk_data.subject_id,
            Mark.exam_type == bulk_data.exam_type
        ).first()
        
        if existing:
            continue
        
        # Validate marks
        if marks_obtained < 0 or marks_obtained > subject.max_marks:
            continue
        
        # Determine pass/fail status
        status_value = "Pass" if marks_obtained >= subject.pass_marks else "Fail"
        
        mark = Mark(
            student_id=student_id,
            subject_id=bulk_data.subject_id,
            marks_obtained=marks_obtained,
            exam_type=bulk_data.exam_type,
            status=status_value,
            entered_by=current_user.id
        )
        
        db.add(mark)
        db.commit()
        db.refresh(mark)
        
        # Send email alert if failed
        if status_value == "Fail":
            background_tasks.add_task(
                check_and_send_fail_alert,
                db, mark, student, subject
            )
        
        user = db.query(User).filter(User.id == student.user_id).first()
        
        created_marks.append(MarkResponse(
            id=mark.id,
            student_id=mark.student_id,
            subject_id=mark.subject_id,
            marks_obtained=mark.marks_obtained,
            exam_type=mark.exam_type,
            remarks=mark.remarks,
            status=mark.status,
            entered_by=mark.entered_by,
            created_at=mark.created_at,
            student_name=user.full_name if user else None,
            subject_name=subject.name,
            max_marks=subject.max_marks,
            pass_marks=subject.pass_marks
        ))
    
    return created_marks


@router.get("/", response_model=MarkListResponse)
async def get_marks(
    student_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    exam_type: Optional[str] = None,
    class_name: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Get marks with optional filtering."""
    query = db.query(Mark)
    
    if student_id:
        query = query.filter(Mark.student_id == student_id)
    if subject_id:
        query = query.filter(Mark.subject_id == subject_id)
    if exam_type:
        query = query.filter(Mark.exam_type == exam_type)
    if class_name:
        student_ids = db.query(Student.id).filter(Student.class_name == class_name).subquery()
        query = query.filter(Mark.student_id.in_(student_ids))
    
    total = query.count()
    marks = query.offset(skip).limit(limit).all()
    
    result = []
    for mark in marks:
        student = db.query(Student).filter(Student.id == mark.student_id).first()
        subject = db.query(Subject).filter(Subject.id == mark.subject_id).first()
        user = db.query(User).filter(User.id == student.user_id).first() if student else None
        
        result.append(MarkResponse(
            id=mark.id,
            student_id=mark.student_id,
            subject_id=mark.subject_id,
            marks_obtained=mark.marks_obtained,
            exam_type=mark.exam_type,
            remarks=mark.remarks,
            status=mark.status,
            entered_by=mark.entered_by,
            created_at=mark.created_at,
            student_name=user.full_name if user else None,
            subject_name=subject.name if subject else None,
            max_marks=subject.max_marks if subject else None,
            pass_marks=subject.pass_marks if subject else None
        ))
    
    return MarkListResponse(marks=result, total=total)


@router.get("/failed", response_model=List[FailedStudentResponse])
async def get_failed_students(
    class_name: Optional[str] = None,
    subject_id: Optional[int] = None,
    exam_type: str = "Final",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Get list of failed students."""
    query = db.query(Mark).filter(Mark.status == "Fail")
    
    if subject_id:
        query = query.filter(Mark.subject_id == subject_id)
    if exam_type:
        query = query.filter(Mark.exam_type == exam_type)
    if class_name:
        student_ids = db.query(Student.id).filter(Student.class_name == class_name).subquery()
        query = query.filter(Mark.student_id.in_(student_ids))
    
    failed_marks = query.all()
    
    result = []
    for mark in failed_marks:
        student = db.query(Student).filter(Student.id == mark.student_id).first()
        subject = db.query(Subject).filter(Subject.id == mark.subject_id).first()
        user = db.query(User).filter(User.id == student.user_id).first() if student else None
        
        if student and subject and user:
            result.append(FailedStudentResponse(
                student_id=student.id,
                student_name=user.full_name,
                roll_no=student.roll_no,
                class_name=student.class_name,
                subject_name=subject.name,
                marks_obtained=mark.marks_obtained,
                max_marks=subject.max_marks,
                pass_marks=subject.pass_marks,
                parent_email=student.parent_email,
                email_sent=bool(student.parent_email)
            ))
    
    return result


@router.put("/{mark_id}", response_model=MarkResponse)
async def update_mark(
    mark_id: int,
    mark_data: MarkUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Update a mark entry."""
    mark = db.query(Mark).filter(Mark.id == mark_id).first()
    if not mark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mark entry not found"
        )
    
    subject = db.query(Subject).filter(Subject.id == mark.subject_id).first()
    student = db.query(Student).filter(Student.id == mark.student_id).first()
    
    if mark_data.marks_obtained is not None:
        if mark_data.marks_obtained > subject.max_marks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Marks cannot exceed maximum marks ({subject.max_marks})"
            )
        
        mark.marks_obtained = mark_data.marks_obtained
        # Recalculate status
        old_status = mark.status
        mark.status = "Pass" if mark_data.marks_obtained >= subject.pass_marks else "Fail"
        
        # Send email if status changed to Fail
        if old_status == "Pass" and mark.status == "Fail":
            background_tasks.add_task(
                check_and_send_fail_alert,
                db, mark, student, subject
            )
    
    if mark_data.remarks is not None:
        mark.remarks = mark_data.remarks
    
    db.commit()
    db.refresh(mark)
    
    user = db.query(User).filter(User.id == student.user_id).first() if student else None
    
    return MarkResponse(
        id=mark.id,
        student_id=mark.student_id,
        subject_id=mark.subject_id,
        marks_obtained=mark.marks_obtained,
        exam_type=mark.exam_type,
        remarks=mark.remarks,
        status=mark.status,
        entered_by=mark.entered_by,
        created_at=mark.created_at,
        student_name=user.full_name if user else None,
        subject_name=subject.name if subject else None,
        max_marks=subject.max_marks if subject else None,
        pass_marks=subject.pass_marks if subject else None
    )


@router.delete("/{mark_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mark(
    mark_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Delete a mark entry."""
    mark = db.query(Mark).filter(Mark.id == mark_id).first()
    if not mark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mark entry not found"
        )
    
    db.delete(mark)
    db.commit()
    
    return None
