from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user, get_current_student
from app.models.user import User
from app.models.student import Student
from app.models.mark import Mark
from app.models.subject import Subject
from app.schemas.report import StudentReport, ClassReport
from app.services.report_service import generate_student_report, generate_class_report

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/student/{student_id}", response_model=StudentReport)
async def get_student_report(
    student_id: int,
    exam_type: str = "Final",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive report for a student."""
    # Check authorization
    if current_user.role == "student":
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student or student.id != student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own report"
            )
    
    report = generate_student_report(db, student_id, exam_type)
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No report data found for this student"
        )
    
    return report


@router.get("/student/{student_id}/html", response_class=HTMLResponse)
async def get_student_report_html(
    student_id: int,
    exam_type: str = "Final",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get printable HTML report for a student."""
    # Check authorization
    if current_user.role == "student":
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student or student.id != student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own report"
            )
    
    report = generate_student_report(db, student_id, exam_type)
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No report data found for this student"
        )
    
    # Generate HTML report
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Report Card - {report.student_name}</title>
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background: #f5f5f5; }}
            .report-card {{ max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 12px; overflow: hidden; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }}
            .header h1 {{ font-size: 24px; margin-bottom: 10px; }}
            .student-info {{ background: #f8f9fa; padding: 20px; display: flex; justify-content: space-around; flex-wrap: wrap; border-bottom: 2px solid #e9ecef; }}
            .info-item {{ text-align: center; padding: 10px; }}
            .info-label {{ color: #6c757d; font-size: 12px; text-transform: uppercase; }}
            .info-value {{ font-size: 16px; font-weight: bold; color: #343a40; }}
            .marks-table {{ width: 100%; border-collapse: collapse; }}
            .marks-table th, .marks-table td {{ padding: 15px; text-align: center; border-bottom: 1px solid #e9ecef; }}
            .marks-table th {{ background: #f8f9fa; color: #495057; font-weight: 600; text-transform: uppercase; font-size: 12px; }}
            .marks-table tr:hover {{ background: #f8f9fa; }}
            .status-pass {{ color: #28a745; font-weight: bold; }}
            .status-fail {{ color: #dc3545; font-weight: bold; }}
            .grade {{ display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 14px; }}
            .grade-a {{ background: #d4edda; color: #155724; }}
            .grade-b {{ background: #cce5ff; color: #004085; }}
            .grade-c {{ background: #fff3cd; color: #856404; }}
            .grade-d {{ background: #f8d7da; color: #721c24; }}
            .grade-f {{ background: #f5c6cb; color: #721c24; }}
            .summary {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; display: flex; justify-content: space-around; flex-wrap: wrap; }}
            .summary-item {{ text-align: center; padding: 15px; }}
            .summary-value {{ font-size: 28px; font-weight: bold; }}
            .summary-label {{ font-size: 12px; opacity: 0.9; text-transform: uppercase; }}
            .result {{ text-align: center; padding: 20px; background: {'#d4edda' if report.result == 'Pass' else '#f8d7da'}; }}
            .result-text {{ font-size: 24px; font-weight: bold; color: {'#155724' if report.result == 'Pass' else '#721c24'}; }}
            .footer {{ text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }}
            @media print {{ body {{ background: white; }} .report-card {{ box-shadow: none; }} }}
        </style>
    </head>
    <body>
        <div class="report-card">
            <div class="header">
                <h1>📊 Student Report Card</h1>
                <p>{report.exam_type} Examination</p>
            </div>
            
            <div class="student-info">
                <div class="info-item">
                    <div class="info-label">Student Name</div>
                    <div class="info-value">{report.student_name}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Roll Number</div>
                    <div class="info-value">{report.roll_no}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Class</div>
                    <div class="info-value">{report.class_name} - {report.section}</div>
                </div>
            </div>
            
            <table class="marks-table">
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Code</th>
                        <th>Marks</th>
                        <th>Max</th>
                        <th>Pass</th>
                        <th>Status</th>
                        <th>Grade</th>
                    </tr>
                </thead>
                <tbody>
    """
    
    for subject in report.subjects:
        grade_class = "grade-a" if subject.grade.startswith("A") else \
                     "grade-b" if subject.grade.startswith("B") else \
                     "grade-c" if subject.grade.startswith("C") else \
                     "grade-d" if subject.grade == "D" else "grade-f"
        
        html += f"""
                    <tr>
                        <td><strong>{subject.subject_name}</strong></td>
                        <td>{subject.subject_code}</td>
                        <td><strong>{subject.marks_obtained}</strong></td>
                        <td>{subject.max_marks}</td>
                        <td>{subject.pass_marks}</td>
                        <td class="status-{'pass' if subject.status == 'Pass' else 'fail'}">{subject.status}</td>
                        <td><span class="grade {grade_class}">{subject.grade}</span></td>
                    </tr>
        """
    
    overall_grade_class = "grade-a" if report.overall_grade.startswith("A") else \
                         "grade-b" if report.overall_grade.startswith("B") else \
                         "grade-c" if report.overall_grade.startswith("C") else \
                         "grade-d" if report.overall_grade == "D" else "grade-f"
    
    html += f"""
                </tbody>
            </table>
            
            <div class="summary">
                <div class="summary-item">
                    <div class="summary-value">{report.total_marks}/{report.total_max_marks}</div>
                    <div class="summary-label">Total Marks</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">{report.percentage}%</div>
                    <div class="summary-label">Percentage</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">{report.overall_grade}</div>
                    <div class="summary-label">Overall Grade</div>
                </div>
            </div>
            
            <div class="result">
                <div class="result-text">
                    {'✅ PASSED' if report.result == 'Pass' else '❌ FAILED'}
                </div>
            </div>
            
            <div class="footer">
                <p>Generated on {report.generated_at.strftime('%B %d, %Y at %I:%M %p')}</p>
                <p>Student Mark Tracker System</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html)


@router.get("/my-report", response_model=StudentReport)
async def get_my_report(
    exam_type: str = "Final",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    """Get report for the currently logged-in student."""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found"
        )
    
    report = generate_student_report(db, student.id, exam_type)
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No report data found"
        )
    
    return report


@router.get("/class/{class_name}", response_model=ClassReport)
async def get_class_report(
    class_name: str,
    section: str = "A",
    exam_type: str = "Final",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get class-level report with statistics (teachers only)."""
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can view class reports"
        )
    
    report = generate_class_report(db, class_name, section, exam_type)
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No report data found for this class"
        )
    
    return report
