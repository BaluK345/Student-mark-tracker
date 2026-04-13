from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class UiPathConfigCreate(BaseModel):
    """Schema for UiPath configuration using PAT token."""
    orchestrator_url: str = Field(..., min_length=1, description="Full Orchestrator URL (e.g., https://cloud.uipath.com/organizationId/tenantId/orchestrator_)")
    pat_token: str = Field(..., min_length=1, description="Personal Access Token from Preferences → Personal Access Tokens")
    folder_id: str = Field(..., min_length=1, description="Organization Unit/Folder ID")
    process_name: str = Field(..., min_length=1, description="Published Process Name (e.g., StudentFailAlert)")
    enabled: bool = Field(default=False, description="Enable UiPath email automation")

    class Config:
        examples = {
            "example": {
                "orchestrator_url": "https://cloud.uipath.com/baluayrkmcc/DefaultTenant/orchestrator_",
                "pat_token": "your_personal_access_token_here",
                "folder_id": "7659670",
                "process_name": "StudentFailAlert",
                "enabled": True
            }
        }


class UiPathConfigResponse(BaseModel):
    """Response for UiPath configuration."""
    orchestrator_url: str
    pat_token: str
    folder_id: str
    process_name: str
    enabled: bool
    connected: bool

    class Config:
        from_attributes = True


class UiPathEmailRequest(BaseModel):
    """Request to send email via UiPath."""
    recipient_email: EmailStr = Field(..., description="Recipient email address")
    subject: str = Field(..., min_length=1, description="Email subject")
    body: str = Field(..., min_length=1, description="Email body")
    body_type: str = Field(default="plain", description="plain or html")
    student_name: Optional[str] = Field(None, description="Student name (for robot context)")
    roll_number: Optional[str] = Field(None, description="Roll number (for robot context)")


class UiPathJobResponse(BaseModel):
    """Response from UiPath job creation."""
    success: bool
    job_id: Optional[str] = None
    robot_id: Optional[str] = None
    message: str
