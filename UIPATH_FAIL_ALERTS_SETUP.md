# UiPath Fail Alert Email System - Complete Setup Guide

## Quick Start Summary

**Goal**: Send fail alert emails to parents **automatically and exclusively via UiPath** when a student fails an exam.

**Process**:  
1. ✓ Teacher enters failing mark in application
2. ✓ Backend detects mark < pass_marks
3. ✓ UiPath job is created automatically
4. ✓ UiPath robot sends email to parent
5. ✓ Parent receives fail notification

---

## Step 1: Create UiPath Automation Process

### 1.1 Create New Project in UiPath Studio

1. Open **UiPath Studio**
2. File → **New Project**
3. Choose **Process** (not Library)
4. Name: `StudentFailAlertNotification`
5. Framework: **Windows - Legacy** or **Cloud**

### 1.2 Create Input Arguments

1. Open the project in Studio
2. Bottom panel → click **Arguments**
3. Add these input arguments (all type: **String**, direction: **In**):

| Argument Name | Type | Used For |
|---|---|---|
| RecipientEmail | String | Parent's email address |
| Subject | String | Email subject line |
| Body | String | Email body (formatted) |
| StudentName | String | Student's full name |
| RollNumber | String | Student's roll number |

4. Save the project

### 1.3 Create Email Sending Workflow

#### Option A: Using Outlook (if available)

**Simple Steps:**
1. Drag **"Send Outlook Mail Message"** activity into Main
2. Set properties:
   - **To**: `RecipientEmail` (variable)
   - **Subject**: `Subject` (variable)
   - **Body**: `Body` (variable)
   - **IsBodyHtml**: `True`

#### Option B: Using SMTP (Gmail, Outlook 365, Custom)

**Simple Steps:**
1. Add **"Send SMTP Mail Message"** activity to Main
2. Set properties:
   - **To**: `RecipientEmail`
   - **Subject**: `Subject`
   - **Body**: `Body`
   - **Host**: Your SMTP server (e.g., `smtp.gmail.com`)
   - **Port**: `587`
   - **UserName**: Your email account
   - **Password**: Your email password
   - **EnableSSL**: `True`

### 1.4 Add Error Handling

1. Select all activities you added
2. Right-click → **Wrap** → **Try Catch**
3. In the **Catch** block, add **"Write Log"**:
   - Message: `"Email send failed: " + exception.Message`
   - Level: `Error`

### 1.5 Test Locally

1. Mock the input arguments in Main for testing
2. Run the workflow locally
3. Verify email is sent to test recipient
4. Fix any errors

**Final Workflow Structure:**
```
Try:
  ├─ Send Outlook/SMTP Mail Message
  └─ Write Log: "Email sent successfully"

Catch Exception:
  └─ Write Log: "Email failed"
```

---

## Step 2: Deploy to UiPath Orchestrator

### 2.1 Create UiPath Cloud Account

1. Go to: **https://cloud.uipath.com/**
2. Sign up with email or use existing account
3. Create a **Tenant** (if not already created)
4. Note your **Tenant Name** (e.g., `my_school_tenant`)

### 2.2 Get API Credentials

1. Log into Orchestrator: https://cloud.uipath.com/
2. Go to **Settings** → **API Access** (or **Tenant Settings**)
3. Create a new **API Token**
4. Note these credentials:
   - **Orchestrator URL**: `https://cloud.uipath.com/`
   - **Tenant Name**: You created this (e.g., `my_school_tenant`)
   - **User Key**: Your email address
   - **API Token**: Generated token (32+ characters)

**Save these securely - you'll need them in Step 3.**

### 2.3 Publish Process to Orchestrator

**From UiPath Studio:**

1. Top menu → **Publish**
2. Choose **Orchestrator Publishing**
3. Enter credentials:
   - Orchestrator URL: `https://cloud.uipath.com/`
   - Tenant Name: Your tenant name
4. Click **Publish**
5. Select **Folder** (create new: `StudentNotifications`)
6. Process name: `StudentFailAlert` (this is your **Process Key**)
7. Click **Publish**

**Verify in Orchestrator:**
1. Log into Orchestrator
2. Go to **Processes** → **Running**
3. Look for `StudentFailAlert` - it should be listed

### 2.4 Add Robot to Orchestrator

1. Orchestrator → **Settings** → **Robots**
2. Click **Add Robot**
3. Fill in:
   - **Name**: `FailAlertRobot`
   - **Type**: Unattended
   - **Machine**: Select from list (or create new)
4. Save
5. Note the **Robot Name**: `FailAlertRobot`

---

## Step 3: Configure Backend Application

### 3.1 Access UiPath Configuration UI

1. Open Student Mark Tracker web application
2. Log in as **Teacher**
3. Sidebar → **UiPath Automation** (or **Settings** → **UiPath**)

### 3.2 Enter Configuration Values

Fill in the form with your credentials from Step 2:

```
Orchestrator URL:     https://cloud.uipath.com/
Tenant Name:          my_school_tenant
User Key:             your_email@company.com
API Token:            [paste your generated token]
Process Key:          StudentFailAlert
Robot Name:           FailAlertRobot
Enable UiPath:        ✓ (CHECK THIS BOX)
```

### 3.3 Save and Test

1. Click **Save Configuration**
2. You should see: "Configuration saved successfully"
3. Click **Send Test Email via UiPath**
4. Enter a test email address
5. Click **Send Test**

**Expected result:**
- ✓ Test email received within 1-2 minutes
- ✓ Backend shows: "Test email sent successfully"
- ✓ Orchestrator shows job status: **Success**

**If test email fails:**
- Go to Orchestrator → **Jobs** → Find failed job
- Click on job → **Logs** tab
- Look for error message
- Common issues:
  - Invalid email credentials in UiPath process
  - Network/firewall blocking connection
  - SMTP port not accessible

---

## Step 4: Test with Real Fail Mark Entry

### 4.1 Enter a Failing Mark

1. Log in as **Teacher**
2. Go to **Marks** section
3. Click **Add Mark** or **Bulk Upload**
4. Select a student, subject, exam type
5. Enter a mark **lower than pass marks**
6. Click **Submit**

### 4.2 Verify Email Sent

**Count to 2-3 minutes, then check:**

**1. Check Parent's Email:**
- Look in parent's inbox for email with subject:  
  `"Important: [StudentName] - [SubjectName] Exam Result"`
- Should contain fail notification with student details

**2. Check Orchestrator Jobs:**
1. Orchestrator → **Execution** → **Jobs**
2. Look for **StudentFailAlert** job with recent timestamp
3. Verify **Status** = **Success** (green checkmark)
4. Click on job → **Logs** to see execution details

**3. Check Application Logs:**
- Backend logs should show:
  ```
  "Fail alert email sent via UiPath to parent@email.com (Job ID: 12345)"
  ```

### 4.3 If Email Not Received

**Troubleshooting Steps:**

1. **Did Orchestrator job succeed?**
   - If job status = **Faulted**, check job logs for error
   - If no job created, UiPath config is disabled or wrong

2. **Is parent email configured?**
   - Check student record → parent_email field
   - If empty, update student profile with parent email

3. **Is UiPath enabled?**
   - Go to UiPath Automation settings
   - Verify **Enable UiPath** checkbox is checked
   - Verify all credentials are filled in

4. **Network connectivity issue?**
   - Verify backend server can reach `cloud.uipath.com`
   - Check firewall rules
   - Try from a different network

5. **Email account issue (UiPath process)?**
   - If using Gmail: Enable "Less secure apps" or use App Password
   - If using Office 365: Use correct OAuth settings
   - Test email directly from UiPath Studio

---

## Email Content Template

When a fail mark is entered, parent receives email with this format:

```
Subject: Important: John Doe - Mathematics Exam Result

Dear Parent/Guardian,

We regret to inform you that your child has not achieved the required 
passing marks in the recent examination. Please see the details below:

Student Details:
- Name: John Doe
- Roll Number: 2024-001
- Class: Grade 10-A

Exam Details:
- Subject: Mathematics
- Marks Obtained: 32 out of 100
- Pass Marks Required: 40
- Status: FAIL

Next Steps:
1. Please contact the school for a detailed performance review
2. Arrange additional tutoring or study support
3. Schedule a meeting with the Mathematics teacher

For further assistance, please contact our office during working hours.

Best regards,
Student Mark Tracker System
School Administration
```

---

## Monitoring

### View All Fail Alerts Sent

1. Orchestrator → **Execution** → **Jobs**
2. Filter by process: `StudentFailAlert`
3. You see all fail emails sent with:
   - Timestamp
   - Student/parent info
   - Success/failure status

### View by Student

1. Application → **Failed Students** page
2. See list of students who failed
3. Click on student → See when fail alert was sent

### View by Teacher

1. Application → **Reports** → **Fail Alerts Sent**
2. Download CSV with all fail alerts
3. Track when parents were notified

---

## Scaling for High Volume

If many students fail at once (e.g., class exam):

1. **Orchestrator automatically queues jobs**
   - Jobs are processed one at a time (single robot)
   - Each email takes 1-2 minutes
   - 100 students = 100-200 minutes to send all

2. **To speed up: Add more robots**
   - Orchestrator → **Settings** → **Robots**
   - Add `FailAlertRobot2`, `FailAlertRobot3`, etc.
   - Jobs are distributed across all robots
   - 3 robots = 3x faster processing

3. **Consider time of sending**
   - For exam over entire school: set mark entry in evening
   - Parents receive emails overnight without being overwhelmed

---

## Troubleshooting Reference

| Problem | Cause | Solution |
|---|---|---|
| "UiPath not enabled" | Checkbox unchecked | ✓ Check "Enable UiPath" in settings |
| "Failed to create job" | Wrong credentials | Verify API token and tenant name |
| Test email never arrives | Email config wrong in UiPath | Test Outlook/SMTP directly from Studio |
| Email sent but not to parent | Parent email not in student profile | Update student record with parent email |
| Email arrives but content wrong | Template issue in backend | Check fail_alert_service.py |
| Slow email sending | Only 1 robot | Add more robots in Orchestrator |
| Job shows "Faulted" | Process error | Check Orchestrator job logs for details |

---

## Success Checklist

- ✓ UiPath process created and working locally
- ✓ Process published to Orchestrator
- ✓ Robot created and online in Orchestrator
- ✓ Backend credentials entered and saved
- ✓ Test email sent successfully
- ✓ Real fail mark generates email to parent
- ✓ Parent receives email with correct details
- ✓ Email sent within 2-3 minutes of mark entry
- ✓ No backup SMTP email sent (only UiPath)

---

## API Reference

### Get Current UiPath Config
```
GET /api/settings/uipath
```

### Update UiPath Configuration
```
POST /api/settings/uipath
Body:
{
  "orchestrator_url": "https://cloud.uipath.com/",
  "tenant_name": "my_school_tenant",
  "user_key": "teacher@school.com",
  "api_token": "your_token_here",
  "process_key": "StudentFailAlert",
  "robot_name": "FailAlertRobot",
  "enabled": true
}
```

### Send Test Email
```
POST /api/settings/uipath/test
Body:
{
  "recipient_email": "test@example.com",
  "subject": "Test Email",
  "body": "This is a test email"
}
```

---

## Architecture Diagram

```
User (Teacher) enters failing mark
    ↓
FastAPI Backend receives request
    ↓
Mark stored in database
    ↓
Background task triggered (Celery/AsyncIO)
    ↓
Check mark status = "Fail"
    ↓
Call send_fail_alert_via_uipath()
    ↓
UiPath Client authenticates to Orchestrator API
    ↓
Query Process ID and Robot ID
    ↓
Create Job with email parameters
    ↓
Job queued in Orchestrator
    ↓
UiPath Robot picks up job
    ↓
Robot opens Outlook/SMTP connection
    ↓
Robot composes email with variables
    ↓
Robot sends email
    ↓
Job marked Success/Failed
    ↓
Parent receives email (within 1-2 minutes)
```

---

## Advanced: Customizing Email Template

To change the fail alert email content:

**File**: `backend/app/services/fail_alert_service.py`  
**Function**: `send_fail_alert_via_uipath()`

Find this section:
```python
email_body = f"""
Dear {parent_name},

We regret to inform you...
"""
```

Edit the email_body variable to customize the message.

---

## Support & Next Steps

For questions or issues:
1. Check "Troubleshooting Reference" above
2. Review Orchestrator job logs
3. Verify UiPath process works in Studio
4. Check backend application logs
5. Verify network connectivity to Orchestrator

Happy automated fail notifications! 🚀
