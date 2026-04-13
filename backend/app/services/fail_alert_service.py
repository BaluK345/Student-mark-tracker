"""Service for sending emails via UiPath automation."""

import logging
from typing import Optional
from app.services.uipath_service import UiPathOrchestratorClient
from app.services.email_service import send_fail_alert_email

logger = logging.getLogger(__name__)


async def send_fail_alert_via_uipath(
    uipath_config: dict,
    parent_email: str,
    parent_name: str,
    student_name: str,
    student_roll_no: str,
    class_name: str,
    subject_name: str,
    marks_obtained: float,
    max_marks: float,
    pass_marks: float
) -> bool:
    """
    Send fail alert email via UiPath automation.
    
    Args:
        uipath_config: UiPath configuration dictionary containing:
            - orchestrator_url: Full orchestrator URL
            - pat_token: Personal Access Token
            - folder_id: Organization Unit ID
            - process_name: Name of published process
            - enabled: Whether UiPath is enabled
        parent_email: Parent's email address
        parent_name: Parent's name
        student_name: Student's name
        student_roll_no: Student's roll number
        class_name: Class name
        subject_name: Subject name
        marks_obtained: Marks obtained
        max_marks: Maximum marks
        pass_marks: Pass mark threshold
    
    Returns:
        bool: True if email was sent successfully via UiPath, False otherwise
    """
    try:
        if not uipath_config.get("enabled"):
            logger.info("UiPath automation is disabled, skipping UiPath email")
            return False
        
        # Validate required config
        required_fields = ["orchestrator_url", "pat_token", "folder_id", "process_name"]
        for field in required_fields:
            if not uipath_config.get(field):
                logger.error(f"Missing UiPath config field: {field}")
                return False
        
        # Create email body
        email_body = f"""
Dear {parent_name},

We regret to inform you that your child has not achieved the required passing marks in the recent examination.

Student Details:
- Name: {student_name}
- Roll Number: {student_roll_no}
- Class: {class_name}

Exam Details:
- Subject: {subject_name}
- Marks Obtained: {marks_obtained} out of {max_marks}
- Pass Marks Required: {pass_marks}

Please contact the school for further assistance or improvement strategies.

Best regards,
Student Mark Tracker System
        """
        
        # Create UiPath client with PAT authentication
        client = UiPathOrchestratorClient(
            orchestrator_url=uipath_config["orchestrator_url"],
            pat_token=uipath_config["pat_token"],
            folder_id=uipath_config["folder_id"],
            process_name=uipath_config["process_name"]
        )
        
        # Send email job
        job = await client.send_email_job(
            recipient_email=parent_email,
            subject=f"Important: {student_name} - {subject_name} Exam Result",
            body=email_body.strip(),
            student_name=student_name,
            roll_number=student_roll_no
        )
        
        if job:
            logger.info(f"Fail alert email sent via UiPath to {parent_email} (Job ID: {job.get('Id')})")
            return True
        else:
            logger.warning(f"Failed to create UiPath job for parent email {parent_email}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending fail alert via UiPath: {str(e)}")
        return False


async def send_fail_alert_email_with_fallback(
    db_session,
    parent_email: str,
    parent_name: str,
    student_name: str,
    roll_no: str,
    class_name: str,
    subject_name: str,
    marks_obtained: float,
    max_marks: float,
    pass_marks: float,
    uipath_config: Optional[dict] = None
):
    """
    Send fail alert email via UiPath if enabled, otherwise use SMTP.
    
    Args:
        db_session: Database session
        parent_email: Parent's email address
        parent_name: Parent's name
        student_name: Student's name
        roll_no: Student's roll number
        class_name: Class name
        subject_name: Subject name
        marks_obtained: Marks obtained
        max_marks: Maximum marks
        pass_marks: Pass mark threshold
        uipath_config: UiPath configuration (optional)
    """
    try:
        # Try UiPath first if configured
        if uipath_config and uipath_config.get("enabled"):
            success = await send_fail_alert_via_uipath(
                uipath_config=uipath_config,
                parent_email=parent_email,
                parent_name=parent_name,
                student_name=student_name,
                student_roll_no=roll_no,
                class_name=class_name,
                subject_name=subject_name,
                marks_obtained=marks_obtained,
                max_marks=max_marks,
                pass_marks=pass_marks
            )
            
            if success:
                logger.info(f"Email sent via UiPath to {parent_email}")
                return
        
        # Fallback to SMTP
        logger.info(f"Sending fail alert via SMTP to {parent_email}")
        await send_fail_alert_email(
            parent_email=parent_email,
            parent_name=parent_name,
            student_name=student_name,
            roll_no=roll_no,
            class_name=class_name,
            subject_name=subject_name,
            marks_obtained=marks_obtained,
            max_marks=max_marks,
            pass_marks=pass_marks
        )
        
    except Exception as e:
        logger.error(f"Error sending fail alert email: {str(e)}")
