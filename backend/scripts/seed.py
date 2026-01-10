"""
Database seed script to create demo data for testing.
Run this after starting the backend to populate the database.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.student import Student
from app.models.subject import Subject
from app.models.mark import Mark


def seed_database():
    """Seed the database with demo data."""
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if data already exists
        if db.query(User).first():
            print("Database already has data. Skipping seed.")
            return
        
        print("Seeding database...")
        
        # Create teacher user
        teacher = User(
            email="teacher@demo.com",
            full_name="John Smith",
            hashed_password=get_password_hash("demo123"),
            role="teacher"
        )
        db.add(teacher)
        db.commit()
        db.refresh(teacher)
        print(f"✓ Created teacher: {teacher.email}")
        
        # Create subjects
        subjects_data = [
            {"name": "Mathematics", "code": "MATH101", "max_marks": 100, "pass_marks": 35},
            {"name": "Physics", "code": "PHY101", "max_marks": 100, "pass_marks": 35},
            {"name": "Chemistry", "code": "CHEM101", "max_marks": 100, "pass_marks": 35},
            {"name": "English", "code": "ENG101", "max_marks": 100, "pass_marks": 35},
            {"name": "Computer Science", "code": "CS101", "max_marks": 100, "pass_marks": 35},
        ]
        
        subjects = []
        for subj_data in subjects_data:
            subject = Subject(
                name=subj_data["name"],
                code=subj_data["code"],
                max_marks=subj_data["max_marks"],
                pass_marks=subj_data["pass_marks"],
                teacher_id=teacher.id
            )
            db.add(subject)
            subjects.append(subject)
        
        db.commit()
        print(f"✓ Created {len(subjects)} subjects")
        
        # Create students
        students_data = [
            {"name": "Alice Johnson", "email": "alice@demo.com", "roll": "2024001", "class": "10th Grade", "section": "A", "parent_email": "alice.parent@demo.com"},
            {"name": "Bob Williams", "email": "bob@demo.com", "roll": "2024002", "class": "10th Grade", "section": "A", "parent_email": "bob.parent@demo.com"},
            {"name": "Charlie Brown", "email": "charlie@demo.com", "roll": "2024003", "class": "10th Grade", "section": "A", "parent_email": "charlie.parent@demo.com"},
            {"name": "Diana Ross", "email": "diana@demo.com", "roll": "2024004", "class": "10th Grade", "section": "B", "parent_email": "diana.parent@demo.com"},
            {"name": "Edward Chen", "email": "edward@demo.com", "roll": "2024005", "class": "10th Grade", "section": "B", "parent_email": "edward.parent@demo.com"},
        ]
        
        students = []
        for stud_data in students_data:
            # Create user
            user = User(
                email=stud_data["email"],
                full_name=stud_data["name"],
                hashed_password=get_password_hash("demo123"),
                role="student"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # Create student profile
            student = Student(
                user_id=user.id,
                roll_no=stud_data["roll"],
                class_name=stud_data["class"],
                section=stud_data["section"],
                parent_name=f"{stud_data['name'].split()[0]}'s Parent",
                parent_email=stud_data["parent_email"]
            )
            db.add(student)
            students.append(student)
        
        db.commit()
        print(f"✓ Created {len(students)} students")
        
        # Create marks
        import random
        
        marks_created = 0
        for student in students:
            db.refresh(student)
            for subject in subjects:
                db.refresh(subject)
                
                # Generate random marks (some will fail)
                if random.random() < 0.15:  # 15% chance of failing
                    marks_obtained = random.randint(15, 34)
                else:
                    marks_obtained = random.randint(40, 95)
                
                status = "Pass" if marks_obtained >= subject.pass_marks else "Fail"
                
                mark = Mark(
                    student_id=student.id,
                    subject_id=subject.id,
                    marks_obtained=marks_obtained,
                    status=status,
                    exam_type="Final",
                    entered_by=teacher.id
                )
                db.add(mark)
                marks_created += 1
        
        db.commit()
        print(f"✓ Created {marks_created} mark entries")
        
        # Create a demo student account for login
        demo_student_user = db.query(User).filter(User.email == "alice@demo.com").first()
        if demo_student_user:
            print(f"\n✓ Demo student account: alice@demo.com / demo123")
        
        print(f"\n✓ Demo teacher account: teacher@demo.com / demo123")
        print("\n🎉 Database seeded successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
