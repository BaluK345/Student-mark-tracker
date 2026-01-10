from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_teacher, get_password_hash
from app.models.user import User
from app.models.student import Student
from app.schemas.student import (
    StudentCreate,
    StudentCreateWithUser,
    StudentUpdate,
    StudentResponse,
    StudentListResponse
)

router = APIRouter(prefix="/students", tags=["Students"])


@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student_data: StudentCreateWithUser,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Create a new student with user account."""
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == student_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if roll number already exists
    existing_student = db.query(Student).filter(Student.roll_no == student_data.roll_no).first()
    if existing_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Roll number already exists"
        )
    
    # Create user account
    user = User(
        email=student_data.email,
        full_name=student_data.full_name,
        hashed_password=get_password_hash(student_data.password),
        role="student"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create student profile
    student = Student(
        user_id=user.id,
        roll_no=student_data.roll_no,
        class_name=student_data.class_name,
        section=student_data.section,
        parent_name=student_data.parent_name,
        parent_email=student_data.parent_email,
        parent_phone=student_data.parent_phone
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    
    return StudentResponse(
        id=student.id,
        user_id=student.user_id,
        roll_no=student.roll_no,
        class_name=student.class_name,
        section=student.section,
        parent_name=student.parent_name,
        parent_email=student.parent_email,
        parent_phone=student.parent_phone,
        created_at=student.created_at,
        full_name=user.full_name,
        email=user.email
    )


@router.get("/", response_model=StudentListResponse)
async def get_students(
    class_name: Optional[str] = None,
    section: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Get all students with optional filtering."""
    query = db.query(Student)
    
    if class_name:
        query = query.filter(Student.class_name == class_name)
    if section:
        query = query.filter(Student.section == section)
    
    total = query.count()
    students = query.offset(skip).limit(limit).all()
    
    # Enrich with user data
    result = []
    for student in students:
        user = db.query(User).filter(User.id == student.user_id).first()
        result.append(StudentResponse(
            id=student.id,
            user_id=student.user_id,
            roll_no=student.roll_no,
            class_name=student.class_name,
            section=student.section,
            parent_name=student.parent_name,
            parent_email=student.parent_email,
            parent_phone=student.parent_phone,
            created_at=student.created_at,
            full_name=user.full_name if user else None,
            email=user.email if user else None
        ))
    
    return StudentListResponse(students=result, total=total)


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Get a specific student by ID."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    user = db.query(User).filter(User.id == student.user_id).first()
    
    return StudentResponse(
        id=student.id,
        user_id=student.user_id,
        roll_no=student.roll_no,
        class_name=student.class_name,
        section=student.section,
        parent_name=student.parent_name,
        parent_email=student.parent_email,
        parent_phone=student.parent_phone,
        created_at=student.created_at,
        full_name=user.full_name if user else None,
        email=user.email if user else None
    )


@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: int,
    student_data: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Update a student's information."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Check for duplicate roll number if updating
    if student_data.roll_no and student_data.roll_no != student.roll_no:
        existing = db.query(Student).filter(Student.roll_no == student_data.roll_no).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Roll number already exists"
            )
    
    # Update fields
    update_data = student_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(student, field, value)
    
    db.commit()
    db.refresh(student)
    
    user = db.query(User).filter(User.id == student.user_id).first()
    
    return StudentResponse(
        id=student.id,
        user_id=student.user_id,
        roll_no=student.roll_no,
        class_name=student.class_name,
        section=student.section,
        parent_name=student.parent_name,
        parent_email=student.parent_email,
        parent_phone=student.parent_phone,
        created_at=student.created_at,
        full_name=user.full_name if user else None,
        email=user.email if user else None
    )


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Delete a student and their user account."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    user_id = student.user_id
    
    # Delete student first (cascade will handle marks)
    db.delete(student)
    
    # Delete user account
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
    
    db.commit()
    
    return None
