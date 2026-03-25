from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_teacher
from app.core.config import settings
from app.models.user import User
from app.models.smtp_config import SMTPConfig
from app.models.uipath_config import UiPathConfig
from app.schemas.smtp_config import SMTPConfigUpdate, SMTPConfigResponse
from app.schemas.uipath_config import UiPathConfigUpdate, UiPathConfigResponse

router = APIRouter(prefix="/email-settings", tags=["Email Settings"])


@router.get("/smtp", response_model=SMTPConfigResponse)
async def get_smtp_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Get current SMTP settings for UI configuration."""
    smtp_config = db.query(SMTPConfig).order_by(SMTPConfig.id.desc()).first()

    if smtp_config:
        return SMTPConfigResponse(
            id=smtp_config.id,
            host=smtp_config.host,
            port=smtp_config.port,
            username=smtp_config.username,
            from_email=smtp_config.from_email,
            from_name=smtp_config.from_name,
            use_tls=smtp_config.use_tls,
            is_enabled=smtp_config.is_enabled,
            has_password=bool(smtp_config.password),
            source="database",
            updated_at=smtp_config.updated_at
        )

    return SMTPConfigResponse(
        host=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        from_email=settings.SMTP_FROM,
        from_name=settings.SMTP_FROM_NAME,
        use_tls=True,
        is_enabled=True,
        has_password=bool(settings.SMTP_PASSWORD),
        source="environment"
    )


@router.put("/smtp", response_model=SMTPConfigResponse)
async def update_smtp_settings(
    config_data: SMTPConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Create or update SMTP settings from UI."""
    smtp_config = db.query(SMTPConfig).order_by(SMTPConfig.id.desc()).first()

    if not smtp_config:
        smtp_config = SMTPConfig(
            host=config_data.host,
            port=config_data.port,
            username=config_data.username,
            password=config_data.password,
            from_email=config_data.from_email,
            from_name=config_data.from_name,
            use_tls=config_data.use_tls,
            is_enabled=config_data.is_enabled,
            updated_by=current_user.id
        )
        db.add(smtp_config)
    else:
        smtp_config.host = config_data.host
        smtp_config.port = config_data.port
        smtp_config.username = config_data.username
        if config_data.password:
            smtp_config.password = config_data.password
        smtp_config.from_email = str(config_data.from_email) if config_data.from_email else None
        smtp_config.from_name = config_data.from_name
        smtp_config.use_tls = config_data.use_tls
        smtp_config.is_enabled = config_data.is_enabled
        smtp_config.updated_by = current_user.id

    db.commit()
    db.refresh(smtp_config)

    return SMTPConfigResponse(
        id=smtp_config.id,
        host=smtp_config.host,
        port=smtp_config.port,
        username=smtp_config.username,
        from_email=smtp_config.from_email,
        from_name=smtp_config.from_name,
        use_tls=smtp_config.use_tls,
        is_enabled=smtp_config.is_enabled,
        has_password=bool(smtp_config.password),
        source="database",
        updated_at=smtp_config.updated_at
    )


@router.get("/uipath", response_model=UiPathConfigResponse)
async def get_uipath_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Get current UiPath automation settings for UI configuration."""
    uipath_config = db.query(UiPathConfig).order_by(UiPathConfig.id.desc()).first()

    if not uipath_config:
        return UiPathConfigResponse(source="database", is_enabled=False, has_api_token=False)

    return UiPathConfigResponse(
        id=uipath_config.id,
        webhook_url=uipath_config.webhook_url,
        tenant_name=uipath_config.tenant_name,
        process_name=uipath_config.process_name,
        is_enabled=uipath_config.is_enabled,
        has_api_token=bool(uipath_config.api_token),
        source="database",
        updated_at=uipath_config.updated_at
    )


@router.put("/uipath", response_model=UiPathConfigResponse)
async def update_uipath_settings(
    config_data: UiPathConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Create or update UiPath automation settings from UI."""
    uipath_config = db.query(UiPathConfig).order_by(UiPathConfig.id.desc()).first()

    if not uipath_config:
        uipath_config = UiPathConfig(
            webhook_url=config_data.webhook_url,
            api_token=config_data.api_token,
            tenant_name=config_data.tenant_name,
            process_name=config_data.process_name,
            is_enabled=config_data.is_enabled,
            updated_by=current_user.id
        )
        db.add(uipath_config)
    else:
        uipath_config.webhook_url = config_data.webhook_url
        if config_data.api_token:
            uipath_config.api_token = config_data.api_token
        uipath_config.tenant_name = config_data.tenant_name
        uipath_config.process_name = config_data.process_name
        uipath_config.is_enabled = config_data.is_enabled
        uipath_config.updated_by = current_user.id

    db.commit()
    db.refresh(uipath_config)

    return UiPathConfigResponse(
        id=uipath_config.id,
        webhook_url=uipath_config.webhook_url,
        tenant_name=uipath_config.tenant_name,
        process_name=uipath_config.process_name,
        is_enabled=uipath_config.is_enabled,
        has_api_token=bool(uipath_config.api_token),
        source="database",
        updated_at=uipath_config.updated_at
    )