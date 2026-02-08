"""API routes for data upload, visualization, and email functionality."""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.student import Student
from app.models.mark import Mark
from app.models.subject import Subject
from app.services.data_service import data_service
from app.services.email_service import send_report_email

router = APIRouter()


class EmailRequest(BaseModel):
    """Request model for sending emails."""
    student_ids: List[int]
    subject: str
    message: str


class BulkEmailRequest(BaseModel):
    """Request model for bulk email sending."""
    filter_type: str = "all"  # all, failed, passed
    subject: str
    message: str


@router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload and process CSV file."""
    
    # Validate file type
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel files are supported"
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Process CSV
        result = data_service.process_csv(content)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "message": "File uploaded and processed successfully",
            "stats": result["stats"],
            "preview": result["preview"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/visualizations/grade-distribution")
async def get_grade_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get grade distribution visualization."""
    
    try:
        # Get all marks
        marks = db.query(Mark).all()
        
        marks_data = [
            {
                "marks_obtained": mark.marks_obtained,
                "status": mark.status
            }
            for mark in marks
        ]
        
        # Generate chart
        chart_image = data_service.generate_grade_distribution_chart(marks_data)
        
        return {
            "chart": chart_image,
            "data": data_service.get_analytics_summary(marks_data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/visualizations/subject-performance")
async def get_subject_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get subject-wise performance visualization."""
    
    try:
        # Get all marks with subjects
        marks = db.query(Mark).join(Subject).all()
        
        # Group by subject
        marks_by_subject = {}
        for mark in marks:
            subject_name = mark.subject.name
            if subject_name not in marks_by_subject:
                marks_by_subject[subject_name] = []
            marks_by_subject[subject_name].append(mark.marks_obtained)
        
        # Generate chart
        chart_image = data_service.generate_subject_performance_chart(marks_by_subject)
        
        return {
            "chart": chart_image,
            "subject_averages": {
                subject: sum(marks) / len(marks) if marks else 0
                for subject, marks in marks_by_subject.items()
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/visualizations/pass-fail")
async def get_pass_fail_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get pass/fail distribution visualization."""
    
    try:
        # Get all marks
        marks = db.query(Mark).all()
        
        marks_data = [
            {
                "marks_obtained": mark.marks_obtained,
                "status": mark.status
            }
            for mark in marks
        ]
        
        # Generate chart
        chart_image = data_service.generate_pass_fail_chart(marks_data)
        
        pass_count = sum(1 for m in marks_data if m["status"] == "Pass")
        fail_count = len(marks_data) - pass_count
        
        return {
            "chart": chart_image,
            "stats": {
                "pass_count": pass_count,
                "fail_count": fail_count,
                "total": len(marks_data),
                "pass_percentage": (pass_count / len(marks_data) * 100) if marks_data else 0
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/summary")
async def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive analytics summary with all visualizations."""
    
    try:
        # Get all marks with related data
        marks = db.query(Mark).join(Subject).join(Student).all()
        
        marks_data = [
            {
                "student_id": mark.student_id,
                "marks_obtained": mark.marks_obtained,
                "status": mark.status,
                "subject_name": mark.subject.name
            }
            for mark in marks
        ]
        
        # Generate all charts
        grade_chart = data_service.generate_grade_distribution_chart(marks_data)
        pass_fail_chart = data_service.generate_pass_fail_chart(marks_data)
        
        # Group by subject for subject performance
        marks_by_subject = {}
        for mark in marks:
            subject_name = mark.subject.name
            if subject_name not in marks_by_subject:
                marks_by_subject[subject_name] = []
            marks_by_subject[subject_name].append(mark.marks_obtained)
        
        subject_chart = data_service.generate_subject_performance_chart(marks_by_subject)
        
        # Get summary stats
        summary = data_service.get_analytics_summary(marks_data)
        
        return {
            "summary": summary,
            "charts": {
                "grade_distribution": grade_chart,
                "pass_fail": pass_fail_chart,
                "subject_performance": subject_chart
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-reports")
async def send_student_reports(
    request: EmailRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send email reports to selected students."""
    
    try:
        sent_count = 0
        failed_count = 0
        results = []
        
        for student_id in request.student_ids:
            # Get student with marks
            student = db.query(Student).filter(Student.id == student_id).first()
            
            if not student or not student.parent_email:
                failed_count += 1
                results.append({
                    "student_id": student_id,
                    "status": "failed",
                    "reason": "No parent email found"
                })
                continue
            
            # Get student marks
            marks = db.query(Mark).filter(Mark.student_id == student_id).join(Subject).all()
            
            # Create simple HTML report
            report_html = f"""
            <html>
            <body>
                <h2>Student Report: {student.user.full_name}</h2>
                <p><strong>Roll No:</strong> {student.roll_no}</p>
                <p><strong>Class:</strong> {student.class_name}</p>
                <h3>Marks:</h3>
                <table border="1" cellpadding="10">
                    <tr>
                        <th>Subject</th>
                        <th>Marks</th>
                        <th>Status</th>
                    </tr>
            """
            
            for mark in marks:
                report_html += f"""
                    <tr>
                        <td>{mark.subject.name}</td>
                        <td>{mark.marks_obtained}</td>
                        <td>{mark.status}</td>
                    </tr>
                """
            
            report_html += """
                </table>
                <p>{}</p>
            </body>
            </html>
            """.format(request.message)
            
            # Send email in background
            try:
                success = await send_report_email(
                    parent_email=student.parent_email,
                    parent_name=student.parent_name or "Parent",
                    student_name=student.user.full_name,
                    report_html=report_html
                )
                
                if success:
                    sent_count += 1
                    results.append({
                        "student_id": student_id,
                        "status": "sent",
                        "email": student.parent_email
                    })
                else:
                    failed_count += 1
                    results.append({
                        "student_id": student_id,
                        "status": "failed",
                        "reason": "Email sending failed"
                    })
            except Exception as e:
                failed_count += 1
                results.append({
                    "student_id": student_id,
                    "status": "failed",
                    "reason": str(e)
                })
        
        return {
            "message": "Email sending completed",
            "sent": sent_count,
            "failed": failed_count,
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-bulk-reports")
async def send_bulk_reports(
    request: BulkEmailRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send bulk email reports based on filter."""
    
    try:
        # Get students based on filter
        query = db.query(Student).join(User)
        
        if request.filter_type == "failed":
            # Students with at least one failed subject
            query = query.join(Mark).filter(Mark.status == "Fail")
        elif request.filter_type == "passed":
            # Students with all passed subjects
            query = query.join(Mark).filter(Mark.status == "Pass")
        
        students = query.distinct().all()
        student_ids = [s.id for s in students]
        
        # Use the existing send_reports endpoint logic
        email_request = EmailRequest(
            student_ids=student_ids,
            subject=request.subject,
            message=request.message
        )
        
        return await send_student_reports(email_request, background_tasks, db, current_user)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
