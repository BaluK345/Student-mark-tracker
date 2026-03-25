import aiosmtplib
import httpx
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
import logging
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.smtp_config import SMTPConfig
from app.models.uipath_config import UiPathConfig

logger = logging.getLogger(__name__)


def get_uipath_configuration(db: Optional[Session] = None) -> Optional[Dict[str, Any]]:
    """Get active UiPath config from database."""
    if not db:
        return None

    uipath_config = db.query(UiPathConfig).order_by(UiPathConfig.id.desc()).first()
    if not uipath_config or not uipath_config.is_enabled:
        return None

    return {
        "webhook_url": uipath_config.webhook_url,
        "api_token": uipath_config.api_token,
        "tenant_name": uipath_config.tenant_name,
        "process_name": uipath_config.process_name,
    }


def get_smtp_configuration(db: Optional[Session] = None) -> Optional[Dict[str, Any]]:
    """Get active SMTP config from database, falling back to environment settings."""
    if db:
        smtp_config = db.query(SMTPConfig).order_by(SMTPConfig.id.desc()).first()
        if smtp_config and smtp_config.is_enabled:
            return {
                "host": smtp_config.host,
                "port": smtp_config.port,
                "username": smtp_config.username,
                "password": smtp_config.password,
                "from_email": smtp_config.from_email,
                "from_name": smtp_config.from_name,
                "use_tls": smtp_config.use_tls,
            }

    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        return {
            "host": settings.SMTP_HOST,
            "port": settings.SMTP_PORT,
            "username": settings.SMTP_USER,
            "password": settings.SMTP_PASSWORD,
            "from_email": settings.SMTP_FROM,
            "from_name": settings.SMTP_FROM_NAME,
            "use_tls": True,
        }

    return None


async def send_email_via_uipath(
    uipath_config: Dict[str, Any],
    parent_email: str,
    parent_name: str,
    student_name: str,
    email_subject: str,
    report_html: str,
    event_type: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> bool:
    """Send email request to UiPath automation webhook."""
    if not uipath_config.get("webhook_url"):
        return False

    payload = {
        "event_type": event_type,
        "recipient": {
            "email": parent_email,
            "name": parent_name,
        },
        "student": {
            "name": student_name,
        },
        "email": {
            "subject": email_subject,
            "html_body": report_html,
        },
        "metadata": metadata or {},
    }

    if uipath_config.get("tenant_name"):
        payload["uipath_tenant"] = uipath_config["tenant_name"]
    if uipath_config.get("process_name"):
        payload["uipath_process"] = uipath_config["process_name"]

    headers = {"Content-Type": "application/json"}
    if uipath_config.get("api_token"):
        headers["Authorization"] = f"Bearer {uipath_config['api_token']}"

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                uipath_config["webhook_url"],
                json=payload,
                headers=headers,
            )

        if 200 <= response.status_code < 300:
            logger.info(f"UiPath automation triggered for {parent_email}")
            return True

        logger.error(
            f"UiPath automation failed for {parent_email}. "
            f"Status: {response.status_code}, Response: {response.text}"
        )
        return False
    except Exception as exc:
        logger.error(f"UiPath request error for {parent_email}: {str(exc)}")
        return False


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
    pass_marks: int,
    db: Optional[Session] = None
) -> bool:
    """Send email alert to parent when student fails."""
    
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

        email_subject = f"⚠️ Important: {student_name} - Performance Alert in {subject_name}"

        uipath_config = get_uipath_configuration(db)
        if uipath_config:
            uipath_sent = await send_email_via_uipath(
                uipath_config=uipath_config,
                parent_email=parent_email,
                parent_name=parent_name,
                student_name=student_name,
                email_subject=email_subject,
                report_html=html_content,
                event_type="fail_alert",
                metadata={
                    "roll_no": roll_no,
                    "class_name": class_name,
                    "subject_name": subject_name,
                    "marks_obtained": marks_obtained,
                    "max_marks": max_marks,
                    "pass_marks": pass_marks,
                },
            )
            if uipath_sent:
                return True
            logger.warning("UiPath send failed; attempting SMTP fallback.")

        smtp_config = get_smtp_configuration(db)
        if not smtp_config:
            logger.warning("No UiPath success and SMTP credentials not configured. Skipping email.")
            return False
        
        # Create email message
        message = MIMEMultipart("alternative")
        from_email = smtp_config["from_email"] or smtp_config["username"]
        message["From"] = f"{smtp_config['from_name']} <{from_email}>"
        message["To"] = parent_email
        message["Subject"] = email_subject
        
        # Attach HTML content
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        # Send email
        await aiosmtplib.send(
            message,
            hostname=smtp_config["host"],
            port=smtp_config["port"],
            username=smtp_config["username"],
            password=smtp_config["password"],
            start_tls=smtp_config["use_tls"]
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
    report_html: str,
    db: Optional[Session] = None
) -> bool:
    """Send report card to parent via email."""

    try:
        email_subject = f"📊 Report Card: {student_name}"

        uipath_config = get_uipath_configuration(db)
        if uipath_config:
            uipath_sent = await send_email_via_uipath(
                uipath_config=uipath_config,
                parent_email=parent_email,
                parent_name=parent_name,
                student_name=student_name,
                email_subject=email_subject,
                report_html=report_html,
                event_type="report",
            )
            if uipath_sent:
                return True
            logger.warning("UiPath send failed; attempting SMTP fallback.")

        smtp_config = get_smtp_configuration(db)
        if not smtp_config:
            logger.warning("No UiPath success and SMTP credentials not configured. Skipping email.")
            return False

        message = MIMEMultipart("alternative")
        from_email = smtp_config["from_email"] or smtp_config["username"]
        message["From"] = f"{smtp_config['from_name']} <{from_email}>"
        message["To"] = parent_email
        message["Subject"] = email_subject
        
        html_part = MIMEText(report_html, "html")
        message.attach(html_part)
        
        await aiosmtplib.send(
            message,
            hostname=smtp_config["host"],
            port=smtp_config["port"],
            username=smtp_config["username"],
            password=smtp_config["password"],
            start_tls=smtp_config["use_tls"]
        )
        
        logger.info(f"Report email sent to {parent_email} for student {student_name}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send report email to {parent_email}: {str(e)}")
        return False
