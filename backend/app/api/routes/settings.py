from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import aiosmtplib
from email.mime.text import MIMEText
import logging

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.schemas.smtp_config import (
    SmtpConfigCreate,
    SmtpConfigResponse,
    SmtpTestRequest,
    SmtpTestResponse
)
from app.schemas.uipath_config import (
    UiPathConfigCreate,
    UiPathConfigResponse,
    UiPathEmailRequest,
    UiPathJobResponse
)
from app.services.uipath_service import UiPathOrchestratorClient

router = APIRouter(prefix="/settings", tags=["Settings"])
logger = logging.getLogger(__name__)

# In-memory storage for UiPath config (in production, use database)
uipath_config = {
    "orchestrator_url": "",
    "pat_token": "",
    "folder_id": "",
    "process_name": "",
    "enabled": False
}


def require_teacher(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure only teachers can access settings."""
    if current_user.role != UserRole.teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can access system settings"
        )
    return current_user


@router.get("/smtp", response_model=SmtpConfigResponse)
async def get_smtp_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current SMTP configuration (masked password for security)."""
    logger.info(f"SMTP config requested by user {current_user.email} with role {current_user.role}")
    
    # Check if user is teacher
    if current_user.role != UserRole.teacher:
        logger.warning(f"Non-teacher user {current_user.email} attempted to access SMTP config")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can access SMTP settings"
        )
    
    response = SmtpConfigResponse(
        smtp_host=settings.SMTP_HOST,
        smtp_port=settings.SMTP_PORT,
        smtp_user=settings.SMTP_USER or "",
        smtp_from=settings.SMTP_FROM or "",
        smtp_from_name=settings.SMTP_FROM_NAME,
        configured=bool(settings.SMTP_USER and settings.SMTP_PASSWORD)
    )
    return response


@router.post("/smtp", response_model=SmtpConfigResponse)
async def update_smtp_config(
    config: SmtpConfigCreate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """Update SMTP configuration."""
    try:
        # Update settings (in production, save to database)
        settings.SMTP_HOST = config.smtp_host
        settings.SMTP_PORT = config.smtp_port
        settings.SMTP_USER = config.smtp_user
        settings.SMTP_PASSWORD = config.smtp_password
        settings.SMTP_FROM = config.smtp_from
        settings.SMTP_FROM_NAME = config.smtp_from_name
        
        logger.info(f"SMTP configuration updated by user {current_user.email}")
        
        response = SmtpConfigResponse(
            smtp_host=settings.SMTP_HOST,
            smtp_port=settings.SMTP_PORT,
            smtp_user=settings.SMTP_USER,
            smtp_from=settings.SMTP_FROM,
            smtp_from_name=settings.SMTP_FROM_NAME,
            configured=True
        )
        return response
    except Exception as e:
        logger.error(f"Error updating SMTP config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update SMTP configuration: {str(e)}"
        )


@router.post("/smtp/test", response_model=SmtpTestResponse)
async def test_smtp_connection(
    test_request: SmtpTestRequest,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """Test SMTP connection with current configuration."""
    try:
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            return SmtpTestResponse(
                success=False,
                message="SMTP configuration is incomplete"
            )
        
        # Create test email
        msg = MIMEText("This is a test email from Student Mark Tracker RPA System")
        msg["Subject"] = "SMTP Configuration Test"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM}>"
        msg["To"] = test_request.recipient_email
        
        # Send test email
        async with aiosmtplib.SMTP(
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT
        ) as smtp:
            await smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            await smtp.send_message(msg)
        
        logger.info(f"SMTP test email sent by {current_user.email} to {test_request.recipient_email}")
        
        return SmtpTestResponse(
            success=True,
            message=f"Test email sent successfully to {test_request.recipient_email}"
        )
    except Exception as e:
        logger.error(f"SMTP test failed: {str(e)}")
        return SmtpTestResponse(
            success=False,
            message=f"SMTP test failed: {str(e)}"
        )


# ============= UiPath Configuration Endpoints =============

@router.get("/uipath", response_model=UiPathConfigResponse)
async def get_uipath_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current UiPath configuration."""
    if current_user.role != UserRole.teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can access UiPath settings"
        )
    
    return UiPathConfigResponse(
        orchestrator_url=uipath_config.get("orchestrator_url", ""),
        pat_token=uipath_config.get("pat_token", ""),
        folder_id=uipath_config.get("folder_id", ""),
        process_name=uipath_config.get("process_name", ""),
        enabled=uipath_config.get("enabled", False),
        connected=False
    )


@router.post("/uipath", response_model=UiPathConfigResponse)
async def update_uipath_config(
    config: UiPathConfigCreate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """Update UiPath configuration with PAT token."""
    try:
        # Update configuration
        uipath_config["orchestrator_url"] = config.orchestrator_url
        uipath_config["pat_token"] = config.pat_token
        uipath_config["folder_id"] = config.folder_id
        uipath_config["process_name"] = config.process_name
        uipath_config["enabled"] = config.enabled
        
        # Update marks module with new config for fail alerts
        from app.api.routes.marks import set_uipath_config
        set_uipath_config(uipath_config.copy())
        
        logger.info(f"UiPath configuration updated by user {current_user.email}")
        
        return UiPathConfigResponse(
            orchestrator_url=uipath_config["orchestrator_url"],
            pat_token=uipath_config["pat_token"],
            folder_id=uipath_config["folder_id"],
            process_name=uipath_config["process_name"],
            enabled=uipath_config["enabled"],
            connected=True
        )
    except Exception as e:
        logger.error(f"Error updating UiPath config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update UiPath configuration: {str(e)}"
        )


@router.post("/uipath/test", response_model=UiPathJobResponse)
async def test_uipath_connection(
    test_request: UiPathEmailRequest,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """Test UiPath connection and send test email."""
    try:
        if not uipath_config.get("enabled"):
            return UiPathJobResponse(
                success=False,
                message="UiPath automation is not enabled"
            )
        
        # Validate required fields
        required_fields = ["orchestrator_url", "pat_token", "folder_id", "process_name"]
        for field in required_fields:
            if not uipath_config.get(field):
                return UiPathJobResponse(
                    success=False,
                    message=f"Missing configuration: {field}"
                )
        
        client = UiPathOrchestratorClient(
            orchestrator_url=uipath_config["orchestrator_url"],
            pat_token=uipath_config["pat_token"],
            folder_id=uipath_config["folder_id"],
            process_name=uipath_config["process_name"]
        )
        
        # Send email job
        job = await client.send_email_job(
            recipient_email=test_request.recipient_email,
            subject=test_request.subject,
            body=test_request.body,
            student_name=test_request.student_name,
            roll_number=test_request.roll_number
        )
        
        if job:
            logger.info(f"UiPath job created by {current_user.email}: {job.get('Id')}")
            return UiPathJobResponse(
                success=True,
                job_id=job.get("Id"),
                message=f"Email job created successfully (Job ID: {job.get('Id')})"
            )
        else:
            return UiPathJobResponse(
                success=False,
                message="Failed to create email job in UiPath"
            )
    except Exception as e:
        logger.error(f"UiPath test failed: {str(e)}")
        return UiPathJobResponse(
            success=False,
            message=f"UiPath test failed: {str(e)}"
        )


@router.post("/email/send-via-uipath", response_model=UiPathJobResponse)
async def send_email_via_uipath(
    email_request: UiPathEmailRequest,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """Send email through UiPath automation."""
    try:
        if not uipath_config.get("enabled"):
            return UiPathJobResponse(
                success=False,
                message="UiPath automation is not enabled"
            )
        
        # Validate required fields
        required_fields = ["orchestrator_url", "pat_token", "folder_id", "process_name"]
        for field in required_fields:
            if not uipath_config.get(field):
                return UiPathJobResponse(
                    success=False,
                    message=f"Missing configuration: {field}"
                )
        
        client = UiPathOrchestratorClient(
            orchestrator_url=uipath_config["orchestrator_url"],
            pat_token=uipath_config["pat_token"],
            folder_id=uipath_config["folder_id"],
            process_name=uipath_config["process_name"]
        )
        
        # Send email job
        job = await client.send_email_job(
            recipient_email=email_request.recipient_email,
            subject=email_request.subject,
            body=email_request.body,
            student_name=email_request.student_name,
            roll_number=email_request.roll_number
        )
        
        if job:
            logger.info(f"Email sent via UiPath by {current_user.email}: {job.get('Id')}")
            return UiPathJobResponse(
                success=True,
                job_id=job.get("Id"),
                message="Email sent successfully through UiPath"
            )
        else:
            return UiPathJobResponse(
                success=False,
                message="Failed to send email via UiPath"
            )
    except Exception as e:
        logger.error(f"Error sending email via UiPath: {str(e)}")
        return UiPathJobResponse(
            success=False,
            message=f"Failed to send email: {str(e)}"
        )
