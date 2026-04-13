from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    DATABASE_URL: str = "sqlite:///./student_tracker.db"
    
    # JWT Authentication
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Email SMTP Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: Optional[str] = None
    SMTP_FROM_NAME: str = "Student Mark Tracker"
    
    # Frontend URL for CORS
    FRONTEND_URL: str = "http://localhost:5173"
    
    # UiPath Configuration
    UIPATH_ORCHESTRATOR_URL: Optional[str] = None
    UIPATH_PAT_TOKEN: Optional[str] = None
    UIPATH_FOLDER_ID: Optional[str] = None
    UIPATH_PROCESS_NAME: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
