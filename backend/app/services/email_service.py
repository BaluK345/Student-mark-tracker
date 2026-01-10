import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


FAIL_ALERT_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .alert-box { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
        .status-fail { color: #dc2626; font-weight: bold; font-size: 18px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Important: Student Performance Alert</h1>
        </div>
        <div class="content">
            <p>Dear {{ parent_name }},</p>
            
            <div class="alert-box">
                <p>We regret to inform you that your child has not achieved the required passing marks in the recent examination.</p>
            </div>
            
            <div class="details">
                <div class="detail-row">
                    <span><strong>Student Name:</strong></span>
                    <span>{{ student_name }}</span>
                </div>
                <div class="detail-row">
                    <span><strong>Roll Number:</strong></span>
                    <span>{{ roll_no }}</span>
                </div>
                <div class="detail-row">
                    <span><strong>Class:</strong></span>
                    <span>{{ class_name }}</span>
                </div>
                <div class="detail-row">
                    <span><strong>Subject:</strong></span>
                    <span>{{ subject_name }}</span>
                </div>
                <div class="detail-row">
                    <span><strong>Marks Obtained:</strong></span>
                    <span>{{ marks_obtained }} / {{ max_marks }}</span>
                </div>
                <div class="detail-row">
                    <span><strong>Required Pass Marks:</strong></span>
                    <span>{{ pass_marks }}</span>
                </div>
                <div class="detail-row">
                    <span><strong>Status:</strong></span>
                    <span class="status-fail">FAIL</span>
                </div>
            </div>
            
            <p>We encourage you to contact the class teacher for guidance on how to help your child improve their performance.</p>
            
            <p>Best regards,<br>
            <strong>Student Mark Tracker</strong><br>
            School Administration</p>
        </div>
        <div class="footer">
            <p>This is an automated message from Student Mark Tracker. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
"""


async def send_fail_alert_email(
    parent_email: str,
    parent_name: str,
    student_name: str,
    roll_no: str,
    class_name: str,
    subject_name: str,
    marks_obtained: int,
    max_marks: int,
    pass_marks: int
) -> bool:
    """Send email alert to parent when student fails."""
    
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured. Skipping email.")
        return False
    
    try:
        # Render email template
        template = Template(FAIL_ALERT_TEMPLATE)
        html_content = template.render(
            parent_name=parent_name or "Parent/Guardian",
            student_name=student_name,
            roll_no=roll_no,
            class_name=class_name,
            subject_name=subject_name,
            marks_obtained=marks_obtained,
            max_marks=max_marks,
            pass_marks=pass_marks
        )
        
        # Create email message
        message = MIMEMultipart("alternative")
        message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM}>"
        message["To"] = parent_email
        message["Subject"] = f"⚠️ Important: {student_name} - Performance Alert in {subject_name}"
        
        # Attach HTML content
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        # Send email
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True
        )
        
        logger.info(f"Fail alert email sent to {parent_email} for student {student_name}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {parent_email}: {str(e)}")
        return False


async def send_report_email(
    parent_email: str,
    parent_name: str,
    student_name: str,
    report_html: str
) -> bool:
    """Send report card to parent via email."""
    
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured. Skipping email.")
        return False
    
    try:
        message = MIMEMultipart("alternative")
        message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM}>"
        message["To"] = parent_email
        message["Subject"] = f"📊 Report Card: {student_name}"
        
        html_part = MIMEText(report_html, "html")
        message.attach(html_part)
        
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True
        )
        
        logger.info(f"Report email sent to {parent_email} for student {student_name}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send report email to {parent_email}: {str(e)}")
        return False
