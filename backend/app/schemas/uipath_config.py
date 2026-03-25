from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UiPathConfigUpdate(BaseModel):
    webhook_url: str
    api_token: Optional[str] = None
    tenant_name: Optional[str] = None
    process_name: Optional[str] = None
    is_enabled: bool = True


class UiPathConfigResponse(BaseModel):
    id: Optional[int] = None
    webhook_url: Optional[str] = None
    tenant_name: Optional[str] = None
    process_name: Optional[str] = None
    is_enabled: bool = False
    has_api_token: bool = False
    source: str = "database"
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
