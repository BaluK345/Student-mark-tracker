from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class SMTPConfigUpdate(BaseModel):
    host: str
    port: int = 587
    username: Optional[str] = None
    password: Optional[str] = None
    from_email: Optional[EmailStr] = None
    from_name: str = "Student Mark Tracker"
    use_tls: bool = True
    is_enabled: bool = True


class SMTPConfigResponse(BaseModel):
    id: Optional[int] = None
    host: str
    port: int
    username: Optional[str] = None
    from_email: Optional[EmailStr] = None
    from_name: str
    use_tls: bool
    is_enabled: bool
    has_password: bool
    source: str
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True