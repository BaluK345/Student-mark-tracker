# UiPath Integration - Backend Code Guide

This document explains how the backend application integrates with UiPath for sending fail alert emails.

---

## Overview

The backend has three main components:

1. **UiPath Orchestrator Client** - Communicates with UiPath API
2. **Fail Alert Service** - Handles fail detection and email triggering
3. **Routes/Settings** - Configuration UI endpoints

---

## Component 1: UiPath Orchestrator Client

**File**: `backend/app/services/uipath_service.py`

This class handles all communication with UiPath Orchestrator API.

### Key Methods

#### authenticate()
```python
async def authenticate(self) -> bool:
    """Authenticate with UiPath Orchestrator using API token."""
    # Calls POST /api/Account/Authenticate
    # Returns access_token if successful
    # Token used for subsequent API calls
```

**Called by**: `send_email_job()`  
**Returns**: True/False

#### get_process_id(process_key: str)
```python
async def get_process_id(self, process_key: str) -> Optional[int]:
    """Get the Orchestrator process ID by process key name."""
    # Queries Orchestrator for process matching the key
    # Example: process_key = "EmailNotification"
    # Returns the numeric process ID
```

**Usage**: When creating a job, need process ID

#### get_robot_id(robot_name: str)
```python
async def get_robot_id(self, robot_name: str) -> Optional[int]:
    """Get robot ID by name from Orchestrator."""
    # Optional - only if specific robot is assigned
    # If not specified, job goes to any available robot
```

#### create_job()
```python
async def create_job(
    self,
    process_id: int,
    robot_id: Optional[int] = None,
    job_arguments: Optional[Dict[str, Any]] = None
) -> Optional[Dict[str, Any]]:
    """Create a new job in Orchestrator."""
    # Calls POST /odata/Jobs
    # Returns job details including Job ID
    
    payload = {
        "processId": process_id,
        "robotIds": [robot_id] if robot_id else [],
        "inputArguments": job_arguments
    }
    # Example job_arguments:
    # {
    #   "RecipientEmail": "parent@example.com",
    #   "Subject": "Fail notification",
    #   "Body": "Email body...",
    #   "StudentName": "John",
    #   "RollNumber": "12345"
    # }
```

#### send_email_job()
```python
async def send_email_job(
    self,
    process_key: str,
    recipient_email: str,
    subject: str,
    body: str,
    robot_name: Optional[str] = None,
    student_name: Optional[str] = None,
    roll_number: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """High-level method to create email sending job."""
    # Steps:
    # 1. Authenticate if needed
    # 2. Get process ID from process_key
    # 3. Get robot ID from robot_name (if provided)
    # 4. Create job with email parameters
    # 5. Return job details
    
    # Returns dictionary with:
    # {
    #   "Id": 12345,           # Job ID
    #   "Status": "Running",
    #   "StartTime": "2024-04-07T10:30:00"
    # }
```

### Example Usage

```python
from app.services.uipath_service import UiPathOrchestratorClient

# Create client
client = UiPathOrchestratorClient(
    orchestrator_url="https://cloud.uipath.com/",
    tenant_name="my_tenant",
    user_key="user@company.com",
    api_token="token_here"
)

# Send email job
job = await client.send_email_job(
    process_key="EmailNotification",
    recipient_email="parent@example.com",
    subject="Student Failed Exam",
    body="Your child failed...",
    robot_name="Robot1"
)

if job:
    print(f"Job created: {job.get('Id')}")
```

---

## Component 2: Fail Alert Service

**File**: `backend/app/services/fail_alert_service.py`

Handles the logic of detecting fails and sending alerts.

### Main Functions

#### send_fail_alert_via_uipath()
```python
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
    """Send fail alert email through UiPath automation."""
    
    # Steps:
    # 1. Check if UiPath is enabled
    if not uipath_config.get("enabled"):
        return False
    
    # 2. Create formatted email body
    email_body = f"""
    Dear {parent_name},
    
    Your child has not achieved required passing marks...
    Student: {student_name} ({student_roll_no})
    Subject: {subject_name}
    Marks: {marks_obtained}/{max_marks}
    Pass Marks: {pass_marks}
    """
    
    # 3. Create UiPath client
    client = UiPathOrchestratorClient(...)
    
    # 4. Send email job
    job = await client.send_email_job(
        process_key=uipath_config["process_key"],
        recipient_email=parent_email,
        subject=f"Important: {student_name} - {subject_name} Result",
        body=email_body,
        robot_name=uipath_config.get("robot_name"),
        student_name=student_name,
        roll_number=student_roll_no
    )
    
    # 5. Return success status
    if job:
        logger.info(f"Job {job.Id} created for {parent_email}")
        return True
    else:
        logger.warning(f"Failed to create job for {parent_email}")
        return False
```

**Called by**: `send_fail_alert_email_with_fallback()`  
**Returns**: True if job created, False otherwise

#### send_fail_alert_email_with_fallback()
```python
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
    """Send fail alert via UiPath if enabled, else fallback to SMTP."""
    
    try:
        # Try UiPath first if configured and enabled
        if uipath_config and uipath_config.get("enabled"):
            success = await send_fail_alert_via_uipath(
                uipath_config=uipath_config,
                parent_email=parent_email,
                parent_name=parent_name,
                student_name=student_name,
                student_roll_no=roll_no,
                # ... other parameters ...
            )
            
            if success:
                logger.info(f"Email sent via UiPath to {parent_email}")
                return  # Success - stop here
        
        # Fallback to SMTP if UiPath failed or not configured
        logger.info(f"Attempting SMTP fallback for {parent_email}")
        await send_fail_alert_email(
            parent_email=parent_email,
            parent_name=parent_name,
            # ... parameters ...
        )
        
    except Exception as e:
        logger.error(f"Error sending fail alert: {str(e)}")
```

**Called by**: Marks route when fail mark is entered  
**Flow**: UiPath first → if fails, try SMTP → if both fail, log error

---

## Component 3: Integration with Marks Route

**File**: `backend/app/api/routes/marks.py`

When a teacher enters marks, this is what happens:

### Mark Entry Flow

```python
@router.post("/", response_model=MarkResponse)
async def create_mark(
    mark_data: MarkCreate,
    background_tasks: BackgroundTasks,  # For async execution
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Create new mark entry for student."""
    
    # 1. Store mark in database
    mark = Mark(
        student_id=mark_data.student_id,
        subject_id=mark_data.subject_id,
        marks_obtained=mark_data.marks_obtained,
        # ...
    )
    db.add(mark)
    db.commit()
    
    # 2. Determine pass/fail
    status = "Pass" if mark.marks_obtained >= subject.pass_marks else "Fail"
    
    # 3. If FAIL, trigger email
    if status == "Fail":
        # Add to background task queue
        background_tasks.add_task(
            check_and_send_fail_alert,
            db, mark, student, subject
        )
        # This runs asynchronously, doesn't block the response
    
    return MarkResponse(...)  # Return immediately
```

### Background Task Execution

```python
async def check_and_send_fail_alert(
    db: Session,
    mark: Mark,
    student: Student,
    subject: Subject
):
    """Background task to send fail alert if needed."""
    
    if mark.status == "Fail" and student.parent_email:
        # Get UiPath configuration (set by settings route)
        uipath_config = get_uipath_config()
        
        # Send fail alert via UiPath or SMTP
        await send_fail_alert_email_with_fallback(
            db_session=db,
            parent_email=student.parent_email,
            parent_name=student.parent_name,
            student_name=student.user.full_name,
            roll_no=student.roll_no,
            class_name=student.class_name,
            subject_name=subject.name,
            marks_obtained=mark.marks_obtained,
            max_marks=subject.max_marks,
            pass_marks=subject.pass_marks,
            uipath_config=uipath_config
        )
```

**Timeline:**
1. Teacher submits mark → API returns response (quick)
2. Background task queued → runs asynchronously
3. Task calls UiPath Orchestrator → job created
4. UiPath robot picks up job → sends email (1-2 minutes)
5. Parent receives email

---

## Configuration Storage

**File**: `backend/app/api/routes/settings.py`

Configuration is currently stored in a global dictionary:

```python
uipath_config = {
    "orchestrator_url": "https://cloud.uipath.com/",
    "tenant_name": "my_tenant",
    "user_key": "user@company.com",
    "api_token": "token_here",
    "process_key": "EmailNotification",
    "robot_name": "Robot1",
    "enabled": False  # Enable only when all fields filled
}
```

### Configuration Endpoints

**GET /settings/uipath** - Retrieve current config
```python
@router.get("/uipath", response_model=UiPathConfigResponse)
async def get_uipath_config(current_user: User = Depends(get_current_user)):
    """Get current UiPath configuration."""
    return UiPathConfigResponse(
        orchestrator_url=uipath_config.get("orchestrator_url", ""),
        tenant_name=uipath_config.get("tenant_name", ""),
        user_key=uipath_config.get("user_key", ""),
        process_key=uipath_config.get("process_key", ""),
        robot_name=uipath_config.get("robot_name"),
        enabled=uipath_config.get("enabled", False),
        connected=False  # TODO: Check real connection
    )
```

**POST /settings/uipath** - Update config
```python
@router.post("/uipath", response_model=UiPathConfigResponse)
async def update_uipath_config(
    config: UiPathConfigCreate,
    current_user: User = Depends(require_teacher)
):
    """Update UiPath configuration."""
    # Update global config
    uipath_config["orchestrator_url"] = config.orchestrator_url
    uipath_config["tenant_name"] = config.tenant_name
    uipath_config["user_key"] = config.user_key
    uipath_config["api_token"] = config.api_token
    uipath_config["process_key"] = config.process_key
    uipath_config["robot_name"] = config.robot_name
    uipath_config["enabled"] = config.enabled
    
    # Sync to marks module for fail alerts
    set_uipath_config(uipath_config.copy())
    
    return UiPathConfigResponse(...)
```

**POST /settings/uipath/test** - Test connection
```python
@router.post("/settings/uipath/test")
async def test_uipath_connection(
    test_request: UiPathEmailRequest,
    current_user: User = Depends(require_teacher)
):
    """Send test email via UiPath."""
    # Creates a client and sends test job
    job = await client.send_email_job(...)
    
    if job:
        return {
            "success": True,
            "job_id": job.get("Id"),
            "message": "Test email job created"
        }
    else:
        return {
            "success": False,
            "message": "Failed to create test job"
        }
```

---

## Data Flow Diagram

```
┌─────────────────────────────────┐
│  Teacher enters mark in UI       │
│  POST /api/marks                 │
└────────────────┬────────────────┘
                 ↓
        ┌────────────────────┐
        │ Create Mark record  │
        │ in database        │
        └────────┬───────────┘
                 ↓
        ┌────────────────────┐
        │ Is mark < passmark?│
        │ (FAIL?)            │
        └───┬────────────┬───┘
           YES           NO
            ↓            ↓
      ┌──────────┐    Success
      │Background
      │task added│
      └────┬─────┘
           ↓
     ┌─────────────────────┐
     │Get UiPath config    │
     │from global dict     │
     └────┬────────────────┘
          ↓
     ┌─────────────────────┐
     │Is enabled?          │
     └───┬─────────────┬───┘
        YES            NO
         ↓             ↓
    ┌──────────────┐  ┌──────────────┐
    │Create        │  │Try SMTP      │
    │UiPath client │  │fallback      │
    └────┬─────────┘  └──────────────┘
         ↓
    ┌──────────────────────┐
    │Authenticate with     │
    │Orchestrator API      │
    └────┬─────────────────┘
         ↓
    ┌──────────────────────┐
    │Get process ID by     │
    │process_key name      │
    └────┬─────────────────┘
         ↓
    ┌──────────────────────┐
    │Create job with       │
    │email parameters      │
    └────┬─────────────────┘
         ↓
    ┌──────────────────────┐
    │Return to API         │
    │(async background)    │
    └──────────────────────┘
         ↓
    ┌──────────────────────┐
    │Orchestrator queues   │
    │job for robot         │
    └────┬─────────────────┘
         ↓
    ┌──────────────────────┐
    │Robot picks up job    │
    │and runs UiPath       │
    │process               │
    └────┬─────────────────┘
         ↓
    ┌──────────────────────┐
    │UiPath sends email    │
    │to parent             │
    └──────────────────────┘
```

---

## Database Considerations

### Future Enhancement: Persist Configuration

Currently stored in memory. For production, save to database:

```python
class UiPathConfig(Base):
    __tablename__ = "uipath_configs"
    
    id = Column(Integer, primary_key=True)
    orchestrator_url = Column(String)
    tenant_name = Column(String)
    user_key = Column(String)
    api_token = Column(String)  # Should be encrypted!
    process_key = Column(String)
    robot_name = Column(String, nullable=True)
    enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_by_id = Column(Integer, ForeignKey("users.id"))
```

### Future Enhancement: Track Email Sending

Create audit log for all emails sent:

```python
class FailAlertLog(Base):
    __tablename__ = "fail_alert_logs"
    
    id = Column(Integer, primary_key=True)
    mark_id = Column(Integer, ForeignKey("marks.id"))
    student_id = Column(Integer, ForeignKey("students.id"))
    recipient_email = Column(String)
    uipath_job_id = Column(String, nullable=True)
    status = Column(String)  # "sent", "failed", "pending"
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime, nullable=True)
```

---

## Error Handling

### Common Errors and Recovery

```python
# Error: Invalid API token
# Recovery: Prompt user to regenerate API token in Orchestrator

# Error: Process not found in Orchestrator
# Recovery: Check process_key matches exactly (case-sensitive)

# Error: Robot offline/not available
# Recovery: Check robot is running and connected to Orchestrator

# Error: Network timeout to orchestrator_url
# Recovery: Check firewall, network connectivity, URL is correct

# Error: Authentication fails
# Recovery: Verify credentials match Orchestrator exactly
```

---

## Testing Locally

### Mock UiPath Client

```python
# For development/testing without Orchestrator:

class MockUiPathClient:
    async def send_email_job(self, **kwargs):
        # Return mock job response
        return {
            "Id": 12345,
            "Status": "Success"
        }

# Use in tests:
if TESTING_MODE:
    client = MockUiPathClient()
else:
    client = UiPathOrchestratorClient(...)
```

### Unit Test Example

```python
import pytest
from app.services.fail_alert_service import send_fail_alert_via_uipath

@pytest.mark.asyncio
async def test_send_fail_alert():
    config = {
        "orchestrator_url": "https://mock-orchestrator.com/",
        "tenant_name": "test_tenant",
        "user_key": "test@test.com",
        "api_token": "mock_token",
        "process_key": "TestProcess",
        "enabled": True
    }
    
    result = await send_fail_alert_via_uipath(
        uipath_config=config,
        parent_email="parent@test.com",
        parent_name="Test Parent",
        student_name="Test Student",
        student_roll_no="001",
        class_name="Test Class",
        subject_name="Math",
        marks_obtained=30,
        max_marks=100,
        pass_marks=40
    )
    
    assert result == True  # Or check with mock
```

---

## Summary

**The flow is:**
1. Teacher enters mark
2. Backend detects fail
3. Triggers UiPath job creation
4. Orchestrator queues job for robot
5. Robot sends email
6. Parent receives notification

**Key files:**
- `uipath_service.py` - Orchestrator API client
- `fail_alert_service.py` - Fail detection and alert triggering
- `marks.py` - Integration point for mark entry
- `settings.py` - Configuration management

**Configuration is in memory** - Can be persisted to database for production.

---
