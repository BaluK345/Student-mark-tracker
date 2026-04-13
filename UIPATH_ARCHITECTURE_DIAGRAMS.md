# UiPath Fail Alert System - Architecture & Flow Diagrams

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Student Mark Tracker System                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Frontend (React/TypeScript)                                         │
│  ├─ Teacher enters mark                                              │
│  └─ Submits to backend API                                           │
│                                                                       │
│  ⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇                                 │
│                                                                       │
│  Backend (Python FastAPI)                                            │
│  ├─ /api/marks (POST) - handles mark entry                          │
│  ├─ Stores in database                                               │
│  ├─ Checks: mark < pass_marks?                                       │
│  │  ├─ If YES → Background task triggered                            │
│  │  └─ If NO → Return success                                        │
│  │                                                                    │
│  ├─ Background Task                                                  │
│  │ ├─ Get student & parent info from database                       │
│  │ ├─ Get UiPath config from settings                               │
│  │ ├─ Call send_fail_alert_email_with_fallback()                   │
│  │ │  ├─ Calls send_fail_alert_via_uipath()                        │
│  │ │  │  ├─ Create UiPathOrchestratorClient                        │
│  │ │  │  ├─ Authenticate with API                                   │
│  │ │  │  ├─ Get process ID by key                                   │
│  │ │  │  ├─ Create job with parameters                              │
│  │ │  │  └─ Return job ID                                           │
│  │ │  ├─ If success → Return                                        │
│  │ │  └─ If fail → Try SMTP (fallback)                             │
│  │ └─ Log result                                                     │
│  │                                                                    │
│  ├─ Database                                                         │
│  │ ├─ Students (with parent_email, parent_name)                     │
│  │ ├─ Marks (status, created_at)                                    │
│  │ └─ Subjects (pass_marks)                                         │
│  │                                                                    │
│  ├─ Settings                                                         │
│  │ ├─ /api/settings/uipath (GET/POST)                              │
│  │ ├─ Stores: URL, tenant, user, token, process_key, robot_name    │
│  │ └─ /api/settings/uipath/test (test email send)                  │
│  │                                                                    │
│  └─ Services                                                         │
│    ├─ uipath_service.py - Orchestrator API client                  │
│    ├─ fail_alert_service.py - Email triggering                     │
│    └─ email_service.py - SMTP fallback                             │
│                                                                       │
│  ⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇                                 │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                               ⬇
                        HTTPS (SSL/TLS)
                               ⬇
        ┌──────────────────────────────────────────────┐
        │   UiPath Cloud Orchestrator Platform         │
        ├──────────────────────────────────────────────┤
        │                                              │
        │  API Endpoints (REST)                        │
        │  ├─ /api/Account/Authenticate               │
        │  ├─ /odata/Processes                        │
        │  ├─ /odata/Robots                           │
        │  ├─ /odata/Jobs                             │
        │  └─ /odata/Jobs/{id}/Log                   │
        │                                              │
        │  Process Queue                               │
        │  └─ StudentFailAlert Process                │
        │                                              │
        │  Robot Pool                                  │
        │  ├─ FailAlertRobot1 (online)                │
        │  ├─ FailAlertRobot2 (online)                │
        │  └─ FailAlertRobotN                         │
        │                                              │
        │  Execution Logs                              │
        │  ├─ Job status (running/success/faulted)    │
        │  ├─ Execution timestamps                    │
        │  └─ Error messages (if any)                 │
        │                                              │
        └──────────────────────────────────────────────┘
                               ⬇
                  HTTPS (SSL/TLS)
                               ⬇
        ┌──────────────────────────────────────────────┐
        │    UiPath Studio (Robot Machine)             │
        ├──────────────────────────────────────────────┤
        │                                              │
        │  StudentFailAlertNotification Process        │
        │  ├─ Receives job from Orchestrator           │
        │  ├─ Reads InputArguments:                   │
        │  │  ├─ RecipientEmail                       │
        │  │  ├─ Subject                              │
        │  │  ├─ Body                                 │
        │  │  ├─ StudentName                          │
        │  │  └─ RollNumber                           │
        │  │                                           │
        │  ├─ Try-Catch Block                          │
        │  │  ├─ Try:                                 │
        │  │  │  ├─ Send Outlook/SMTP Mail Message   │
        │  │  │  └─ Write Log (success)              │
        │  │  │                                       │
        │  │  └─ Catch Exception:                     │
        │  │     └─ Write Log (error)                │
        │  │                                           │
        │  └─ Job marked Success/Failed               │
        │                                              │
        └──────────────────────────────────────────────┘
                               ⬇
                  SMTP/Outlook Mail Protocol
                               ⬇
    ┌──────────────────────────────────────────────┐
    │        Email Service                         │
    ├──────────────────────────────────────────────┤
    │                                              │
    │  Option A: Gmail SMTP                        │
    │  ├─ smtp.gmail.com:587 (TLS)                 │
    │  └─ App Password Authentication              │
    │                                              │
    │  Option B: Office 365                        │
    │  ├─ smtp.office365.com:587 (TLS)             │
    │  └─ Office 365 Credentials                   │
    │                                              │
    │  Option C: Outlook Client                    │
    │  ├─ Local Outlook installation                │
    │  └─ Desktop/Online integration                │
    │                                              │
    └──────────────────────────────────────────────┘
                               ⬇
    ┌──────────────────────────────────────────────┐
    │        Parent's Inbox                        │
    ├──────────────────────────────────────────────┤
    │                                              │
    │  Subject: Important: John Doe - Math Result  │
    │                                              │
    │  Dear Parent,                                │
    │  Your child has not passed.                  │
    │  Marks: 32/100, Pass: 40                     │
    │  ...                                          │
    │                                              │
    └──────────────────────────────────────────────┘
```

---

## Mark Entry to Email Flow

```
Timeline Diagram:

T=0:00    Teacher submits mark in UI
            │
            ├─ Validation
            │
            └─ Store in DB
               │
               └─ Return to Frontend (response 200)
                  │
                  └─ UI shows "Mark saved"

T=0:01    Mark < Pass_Marks?
            │
            ├─ YES → Queue background task
            │         │
            │         └─ API returns (teacher doesn't wait)
            │
            └─ NO → Done

T=0:02 (Background, async)
        Check:
        ├─ Student exists? ✓
        ├─ Parent email exists? ✓
        └─ UiPath enabled? ✓
           │
           └─ Send fail alert via UiPath
              │
              ├─ Create UiPathOrchestratorClient
              │
              ├─ HTTP POST to Orchestrator API
              │
              ├─ Authenticate: {tenant, user, token}
              │  │
              │  └─ Returns: access_token
              │
              ├─ Get Process ID by "StudentFailAlert"
              │  │
              │  └─ Returns: processId = 12345
              │
              ├─ Get Robot ID by "FailAlertRobot"
              │  │
              │  └─ Returns: robotId = 67890
              │
              ├─ Create Job with parameters
              │  │
              │  ├─ POST /odata/Jobs
              │  │
              │  ├─ Body:
              │  │  {
              │  │    "processId": 12345,
              │  │    "robotIds": [67890],
              │  │    "inputArguments": {
              │  │      "RecipientEmail": "parent@mail.com",
              │  │      "Subject": "Important: John - Math Result",
              │  │      "Body": "Your child failed...",
              │  │      "StudentName": "John Doe",
              │  │      "RollNumber": "2024-001"
              │  │    }
              │  │  }
              │  │
              │  └─ Returns: jobId = 99999
              │
              └─ Mark complete (async)
                 │
                 └─ Backend logs: "Job 99999 created"

T=0:05 (Orchestrator Cloud)
        Job 99999 is queued
        │
        ├─ Check robot pool
        │
        ├─ Available robot: FailAlertRobot1 ✓
        │
        └─ Assign job to robot
           │
           └─ Send job to robot machine

T=0:06 (Robot Machine - UiPath Studio)
        Receive job
        │
        ├─ Read InputArguments
        │
        ├─ Execute StudentFailAlert process
        │
        ├─ Try:
        │  ├─ Send SMTP/Outlook Mail
        │  │  │
        │  │  └─ Connect to email service
        │  │     Connect to smtp.gmail.com:587 (TLS)
        │  │     Show error if invalid credentials
        │  │
        │  └─ Email sent ✓
        │
        ├─ Write Log: "Email sent to parent@mail.com"
        │
        └─ Mark job COMPLETED

T=0:30 (Orchestrator Cloud)
        Job 99999 status updated
        │
        ├─ Status: SUCCESS ✓
        │
        ├─ Execution time: 24 seconds
        │
        └─ Logs: "Email sent..."

T=1:00 (Parent's Email Service)
        Email arrives in inbox
        │
        ├─ From: school_noreply@school.com
        │
        ├─ Subject: Important: John Doe - Mathematics Result
        │
        └─ Body: 
            Dear Parent,
            Your child failed...
```

---

## Component Interaction Diagram

```
┌────────────────┐
│   Teacher UI   │ (React Frontend)
│                │
│ Enter Mark     │
│                │
└────────┬───────┘
         │ POST /api/marks
         │
    ┌────▼────────────────────┐
    │  Marks Route Handler    │
    │  (marks.py)             │
    │                         │
    │ ├─ Validate input       │
    │ ├─ Save to DB           │
    │ ├─ Check status="Fail"? │
    │ │  └─ YES: Queue task   │
    │ └─ Return 200 OK        │
    └────┬────────────────────┘
         │ (async background)
         │
    ┌────▼─────────────────────────────────┐
    │  Fail Alert Service                  │
    │  (fail_alert_service.py)            │
    │                                      │
    │                                      │
    │  send_fail_alert_email_with_fallback │
    │    │                                 │
    │    └──[If UiPath enabled]           │
    │       │                              │
    │       └─ send_fail_alert_via_uipath │
    │          │                           │
    │          └────┐                      │
    │               │                      │
    └───────────────┼──────────────────────┘
                    │
    ┌───────────────▼──────────────────┐
    │  UiPath Orchestrator Client      │
    │  (uipath_service.py)             │
    │                                  │
    │ ├─ Authenticate()                │
    │ ├─ Get Process ID                │
    │ ├─ Get Robot ID                  │
    │ └─ Create Job                    │
    │    │                             │
    │    └─ Return job details         │
    └───────────────┬──────────────────┘
                    │ HTTPS
                    │
    ┌───────────────▼──────────────────┐
    │  UiPath Cloud Orchestrator       │
    │  REST API                        │
    │                                  │
    │ Jobs Queue:                      │
    │ ├─ Job#99999 from Robot1        │
    │ ├─ Job#99998 from Robot2        │
    │ └─ Job#99997 (pending)          │
    │                                  │
    │ Robot Pool Status:               │
    │ ├─ FailAlertRobot1: Online ✓    │
    │ ├─ FailAlertRobot2: Online ✓    │
    │ └─ FailAlertRobot3: Offline X   │
    └───────────────┬──────────────────┘
                    │ Assign
                    │
    ┌───────────────▼──────────────────┐
    │  UiPath Robot                    │
    │  (Studio Process Execution)      │
    │                                  │
    │ StudentFailAlert Process:        │
    │ ├─ Get job from queue            │
    │ ├─ Load input arguments          │
    │ ├─ Execute workflow              │
    │ │  ├─ Connect to email service   │
    │ │  ├─ Compose email              │
    │ │  ├─ Send email                 │
    │ │  └─ Log result                 │
    │ ├─ Report status: SUCCESS        │
    │ └─ Return to Orchestrator        │
    └───────────────┬──────────────────┘
                    │ SMTP/Outlook
                    │
    ┌───────────────▼──────────────────┐
    │  Email Service                   │
    │  (Gmail/Office365/Outlook)       │
    │                                  │
    │ ├─ Receive email data            │
    │ ├─ Authenticate                  │
    │ ├─ Send to recipient             │
    │ └─ Confirm delivery              │
    └───────────────┬──────────────────┘
                    │
    ┌───────────────▼──────────────────┐
    │  Parent's Inbox                  │
    │                                  │
    │ ✓ NEW: Important: John - Math    │
    │                                  │
    │ Your child failed the exam...    │
    └────────────────────────────────────┘
```

---

## Decision Tree: When to Use What

```
Student failed exam (marks < pass_marks)
│
├─ Is student record in database?
│  ├─ NO  → No email sent
│  └─ YES ↓
│
├─ Does student have parent_email?
│  ├─ NO  → No email sent
│  └─ YES ↓
│
├─ Is UiPath enabled in settings?
│  │
│  ├─ NO  ↓
│  │   └─ Try SMTP fallback
│  │       ├─ SMTP configured?
│  │       │  ├─ NO  → Email not sent
│  │       │  └─ YES → Send via SMTP
│  │       │
│  │       └─ DONE
│  │
│  └─ YES ↓
│      ├─ Are UiPath credentials valid?
│      │  ├─ NO  → Try SMTP fallback
│      │  └─ YES ↓
│      │
│      ├─ Is Orchestrator accessible?
│      │  ├─ NO  → Try SMTP fallback
│      │  └─ YES ↓
│      │
│      ├─ Does process exist?
│      │  ├─ NO  → Try SMTP fallback
│      │  └─ YES ↓
│      │
│      ├─ Is robot online?
│      │  ├─ NO  → Try SMTP fallback
│      │  └─ YES ↓
│      │
│      └─ Send via UiPath
│          ├─ Job created: SUCCESS → DONE
│          └─ Job creation failed → Try SMTP fallback
│
RESULT: Email sent (via UiPath or SMTP) or failed (logged)
```

---

## Deployment Architecture

```
Development Environment:
┌──────────────────────────────────────┐
│  Developer Machine                   │
│  ├─ UiPath Studio                   │
│  ├─ StudentFailAlert.xaml           │
│  └─ Run locally for testing         │
└──────────────────────────────────────┘
              ↓ Publish

Production Environment:
┌──────────────────────────────────────┐
│  UiPath Cloud                        │
│  ├─ Orchestrator                    │
│  ├─ Process: StudentFailAlert       │
│  ├─ Robot1, Robot2, Robot3          │
│  └─ Job execution logs              │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  School's Server                     │
│  ├─ Backend Application              │
│  ├─ Database                         │
│  └─ Student/Mark/Parent data        │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  Robot Machines (Unattended)        │
│  ├─ VM1 (FailAlertRobot1)           │
│  ├─ VM2 (FailAlertRobot2)           │
│  └─ Running 24/7 for job execution  │
└──────────────────────────────────────┘
```

---

## Monitoring & Logging Points

```
Application Level:
├─ Backend logs: "Fail alert email sent via UiPath (Job ID: xxxxx)"
├─ Backend logs: "Error sending fail alert via UiPath: [error]"
└─ Database: mark.status = "Fail"

Orchestrator Level:
├─ Execution page: Job#99999 - Status
├─ Job Logs: Detailed execution steps
├─ Robot pool: Online/offline status
└─ API calls: Request/response logs

Robot/Process Level:
├─ UiPath Studio logs: Activity execution
├─ Process output: Email sent confirmation
├─ Error logs: Exception details
└─ Performance: Execution time

Email Service Level:
├─ SMTP/Outlook logs: Connection attempts
├─ Authentication: Success/failure
├─ Delivery: Success/bounce
└─ Spam filters: Message classified/rejected
```

---

## Scaling Example (100 Failing Students)

```
Scenario: Class exam, 100 students failed

Without UiPath (Manual SMTP only):
├─ SMTP sends: ~1 email per 2-3 seconds
├─ Total time: 200-300 seconds (3-5 minutes)
└─ Risk: Email server rate limiting, delivery delays

With UiPath (1 Robot):
├─ Orchestrator queues: 100 jobs
├─ Robot processes: ~1 job per 30 seconds
├─ Total time: 3000+ seconds (50 minutes)
└─ One at a time - slower but reliable

With UiPath (3 Robots):
├─ Orchestrator distributes: 100 jobs across 3 robots
├─ Each robot: ~34 jobs
├─ Robot processes: ~1 job per 30 seconds
├─ Total time: 1000+ seconds (15-20 minutes)
├─ Parallel processing: Much faster!
└─ Recommendation: Add robots for large batches

With UiPath (5 Robots):
├─ Orchestrator distributes: 100 jobs across 5 robots
├─ Processing: Highly parallel
├─ Total time: ~600 seconds (10 minutes)
├─ Optimal for large exams
└─ Can add more robots as needed
```

---

**Use these diagrams as reference when:**
- Explaining the system to stakeholders
- Debugging issues
- Planning scaling
- Documenting procedures
- Training new staff
