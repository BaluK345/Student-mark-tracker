from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class SmtpConfigCreate(BaseModel):
    """Schema for creating/updating SMTP configuration."""
    smtp_host: str = Field(..., min_length=1, description="SMTP server host")
    smtp_port: int = Field(..., gt=0, lt=65536, description="SMTP server port")
    smtp_user: str = Field(..., min_length=1, description="SMTP username/email")
    smtp_password: str = Field(..., min_length=1, description="SMTP password or app password")
    smtp_from: EmailStr = Field(..., description="Email address to send from")
    smtp_from_name: str = Field(default="Student Mark Tracker", description="Display name for sender")

    class Config:
        examples = {
            "example": {
                "smtp_host": "smtp.gmail.com",
                "smtp_port": 587,
                "smtp_user": "your-email@gmail.com",
                "smtp_password": "your-app-password",
                "smtp_from": "your-email@gmail.com",
                "smtp_from_name": "Student Mark Tracker"
            }
        }


class SmtpConfigResponse(BaseModel):
    """Schema for SMTP configuration response."""
    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_from: str
    smtp_from_name: str
    configured: bool

    class Config:
        from_attributes = True


class SmtpTestRequest(BaseModel):
    """Schema for testing SMTP connection."""
    recipient_email: EmailStr = Field(..., description="Test email recipient")


class SmtpTestResponse(BaseModel):
    """Response for SMTP test."""
    success: bool
    message: str
