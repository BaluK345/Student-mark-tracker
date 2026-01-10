from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_teacher
from app.models.user import User
from app.models.subject import Subject
from app.schemas.subject import (
    SubjectCreate,
    SubjectUpdate,
    SubjectResponse,
    SubjectListResponse
)

router = APIRouter(prefix="/subjects", tags=["Subjects"])


@router.post("/", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
async def create_subject(
    subject_data: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Create a new subject."""
    # Check if subject name or code already exists
    existing = db.query(Subject).filter(
        (Subject.name == subject_data.name) | (Subject.code == subject_data.code)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject with this name or code already exists"
        )
    
    subject = Subject(
        name=subject_data.name,
        code=subject_data.code,
        max_marks=subject_data.max_marks,
        pass_marks=subject_data.pass_marks,
        teacher_id=subject_data.teacher_id or current_user.id
    )
    
    db.add(subject)
    db.commit()
    db.refresh(subject)
    
    teacher = db.query(User).filter(User.id == subject.teacher_id).first()
    
    return SubjectResponse(
        id=subject.id,
        name=subject.name,
        code=subject.code,
        max_marks=subject.max_marks,
        pass_marks=subject.pass_marks,
        teacher_id=subject.teacher_id,
        created_at=subject.created_at,
        teacher_name=teacher.full_name if teacher else None
    )


@router.get("/", response_model=SubjectListResponse)
async def get_subjects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Get all subjects."""
    total = db.query(Subject).count()
    subjects = db.query(Subject).offset(skip).limit(limit).all()
    
    result = []
    for subject in subjects:
        teacher = db.query(User).filter(User.id == subject.teacher_id).first()
        result.append(SubjectResponse(
            id=subject.id,
            name=subject.name,
            code=subject.code,
            max_marks=subject.max_marks,
            pass_marks=subject.pass_marks,
            teacher_id=subject.teacher_id,
            created_at=subject.created_at,
            teacher_name=teacher.full_name if teacher else None
        ))
    
    return SubjectListResponse(subjects=result, total=total)


@router.get("/{subject_id}", response_model=SubjectResponse)
async def get_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Get a specific subject by ID."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    teacher = db.query(User).filter(User.id == subject.teacher_id).first()
    
    return SubjectResponse(
        id=subject.id,
        name=subject.name,
        code=subject.code,
        max_marks=subject.max_marks,
        pass_marks=subject.pass_marks,
        teacher_id=subject.teacher_id,
        created_at=subject.created_at,
        teacher_name=teacher.full_name if teacher else None
    )


@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: int,
    subject_data: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Update a subject."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Check for duplicate name/code if updating
    if subject_data.name or subject_data.code:
        existing = db.query(Subject).filter(
            Subject.id != subject_id,
            (Subject.name == subject_data.name) | (Subject.code == subject_data.code)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subject with this name or code already exists"
            )
    
    update_data = subject_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(subject, field, value)
    
    db.commit()
    db.refresh(subject)
    
    teacher = db.query(User).filter(User.id == subject.teacher_id).first()
    
    return SubjectResponse(
        id=subject.id,
        name=subject.name,
        code=subject.code,
        max_marks=subject.max_marks,
        pass_marks=subject.pass_marks,
        teacher_id=subject.teacher_id,
        created_at=subject.created_at,
        teacher_name=teacher.full_name if teacher else None
    )


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Delete a subject."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    db.delete(subject)
    db.commit()
    
    return None
